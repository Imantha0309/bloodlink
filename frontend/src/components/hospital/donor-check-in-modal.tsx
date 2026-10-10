import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { QrCodeScanner } from "@/components/qr-code-scanner";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { apiErrorMessage } from "@/services/auth";
import { completeDonationCase, verifyDonorCheckIn } from "@/services/donors/donor-workflow";
import { getEmergencyRequest } from "@/services/requests/emergency-requests";

type VerifiedPass = {
  requestId: string;
  token: string;
  stage: string;
  donorName?: string;
  bloodGroup?: string;
  patientName?: string;
  hospital?: string;
  units?: number;
};

type DonorCheckInModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Hospital-side donor intake verification.
 *
 * Scan (camera or paste) the donor's intake QR, call the check-in API, then
 * confirm the blood draw to complete the case. Owns all of its state so the
 * screens that open it only control visibility.
 */
export function DonorCheckInModal({ visible, onClose }: DonorCheckInModalProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifiedPass, setVerifiedPass] = useState<VerifiedPass | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeSuccess, setCompleteSuccess] = useState(false);

  /** Closing always hands the next open a clean scan form. */
  function handleClose() {
    setShowCamera(false);
    setScanInput("");
    setVerifyError(null);
    setVerifiedPass(null);
    setCompleteSuccess(false);
    onClose();
  }

  async function handleProcessScan(scanned?: string) {
    const raw = (scanned ?? scanInput).trim();
    if (!raw) {
      setVerifyError("Please scan or paste the donor intake QR code.");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setCompleteSuccess(false);

    try {
      // Parse token and requestId from raw string (supports plain token or formatted pass text)
      let requestId = "";
      let token = "";

      if (raw.includes("bloodlink-intake:")) {
        const match = raw.match(/bloodlink-intake:([^:\s]+):([^:\s]+)/);
        if (match) {
          requestId = match[1];
          token = match[2];
        }
      } else if (raw.includes(":")) {
        const parts = raw.split(":");
        requestId = parts[0];
        token = parts[1];
      } else {
        requestId = raw;
        token = "scanned";
      }

      await verifyDonorCheckIn(requestId, token);

      // Enrich the pass card from the request itself; the display fields are
      // best-effort, so a lookup failure must not hide a successful check-in.
      let donorName: string | undefined = "Verified Donor";
      let bloodGroup: string | undefined = "O+";
      let patientName: string | undefined = "Emergency Patient";
      let hospital: string | undefined = "Hospital Intake Desk";
      let units: number | undefined = 1;

      try {
        const detail = await getEmergencyRequest(requestId);
        bloodGroup = detail.request.bloodGroup;
        patientName = detail.request.patientName;
        hospital = detail.request.hospital;
        units = detail.request.units;
      } catch {
        // Keep the fallback display values.
      }

      setVerifiedPass({
        requestId,
        token,
        stage: "arrived",
        donorName,
        bloodGroup,
        patientName,
        hospital,
        units,
      });
    } catch (caught) {
      setVerifyError(apiErrorMessage(caught));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleCompleteDonation() {
    if (!verifiedPass || isCompleting) return;
    setIsCompleting(true);
    setVerifyError(null);

    try {
      await completeDonationCase(verifiedPass.requestId);
      setCompleteSuccess(true);
      setVerifiedPass((prev) => (prev ? { ...prev, stage: "completed" } : prev));
    } catch (caught) {
      setVerifyError(apiErrorMessage(caught));
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Feather name="shield" size={18} color={Blood.primary} />
              <Text style={styles.modalTitle}>Donor Pass Verification</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close verification modal"
              onPress={handleClose}
              style={styles.closeBtn}
            >
              <Feather name="x" size={18} color={Surface.text} />
            </Pressable>
          </View>

          {!verifiedPass ? (
            <View style={styles.scanForm}>
              {showCamera ? (
                <QrCodeScanner
                  onCancel={() => setShowCamera(false)}
                  onScanned={(value) => {
                    setShowCamera(false);
                    setScanInput(value);
                    void handleProcessScan(value);
                  }}
                />
              ) : (
                <>
                  <Text style={styles.scanInstructions}>
                    Scan or paste the donor intake QR code string to see verified pass details:
                  </Text>

                  {Platform.OS !== "web" ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open camera to scan QR code"
                      disabled={isVerifying}
                      onPress={() => {
                        setVerifyError(null);
                        setShowCamera(true);
                      }}
                      style={({ pressed }) => [styles.cameraScanBtn, pressed && styles.pressed]}
                    >
                      <Feather name="camera" size={16} color="#FFFFFF" />
                      <Text style={styles.cameraScanBtnText}>Scan with Camera</Text>
                    </Pressable>
                  ) : null}

                  <TextInput
                    value={scanInput}
                    onChangeText={setScanInput}
                    placeholder="Paste QR scan or e.g. bloodlink-intake:req_123:token..."
                    placeholderTextColor={Surface.textMuted}
                    style={styles.scanInput}
                    multiline
                    numberOfLines={3}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {verifyError ? (
                    <View style={styles.errorBox}>
                      <Feather name="alert-circle" size={14} color={Surface.danger} />
                      <Text style={styles.errorText}>{verifyError}</Text>
                    </View>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Verify pass now"
                    disabled={isVerifying}
                    onPress={() => void handleProcessScan()}
                    style={({ pressed }) => [styles.primaryModalBtn, pressed && styles.pressed]}
                  >
                    {isVerifying ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="check-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.primaryModalBtnText}>Verify & Check In Donor</Text>
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            /* Verified Pass Details Card */
            <View style={styles.passDetailsWrap}>
              <View style={styles.verifiedBadge}>
                <Feather
                  name={completeSuccess ? "check-circle" : "check"}
                  size={18}
                  color={Surface.online}
                />
                <Text style={styles.verifiedBadgeText}>
                  {completeSuccess ? "DONATION COMPLETED" : "INTAKE VERIFIED · DONOR ARRIVED"}
                </Text>
              </View>

              <View style={styles.passDetailCard}>
                <View style={styles.passTopRow}>
                  <View style={styles.bloodTag}>
                    <Text style={styles.bloodTagText}>{verifiedPass.bloodGroup}</Text>
                  </View>
                  <View style={styles.passMeta}>
                    <Text style={styles.passPatientName}>
                      Patient: {verifiedPass.patientName}
                    </Text>
                    <Text style={styles.passHospitalName}>{verifiedPass.hospital}</Text>
                  </View>
                </View>

                <View style={styles.passInfoRow}>
                  <Text style={styles.passInfoLabel}>Units Requested:</Text>
                  <Text style={styles.passInfoVal}>{verifiedPass.units} Unit(s)</Text>
                </View>

                <View style={styles.passInfoRow}>
                  <Text style={styles.passInfoLabel}>Case Reference:</Text>
                  <Text style={styles.passInfoVal}>
                    #{verifiedPass.requestId.slice(-6).toUpperCase()}
                  </Text>
                </View>
              </View>

              {!completeSuccess ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Complete donation"
                  disabled={isCompleting}
                  onPress={() => void handleCompleteDonation()}
                  style={({ pressed }) => [styles.completeBtn, pressed && styles.pressed]}
                >
                  {isCompleting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="award" size={16} color="#FFFFFF" />
                      <Text style={styles.completeBtnText}>Confirm Blood Draw & Complete</Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <Text style={styles.completedNote}>
                  This case has been fulfilled. Thank you for using BloodLink!
                </Text>
              )}

              <Pressable
                onPress={() => {
                  setVerifiedPass(null);
                  setScanInput("");
                }}
                style={styles.anotherBtn}
              >
                <Text style={styles.anotherBtnText}>Scan Another Pass</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: Surface.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
    maxHeight: "85%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  modalTitle: {
    ...Typography.title,
    fontSize: 16.5,
    color: Surface.text,
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Surface.iconWash,
    alignItems: "center",
    justifyContent: "center",
  },

  scanForm: {
    gap: 12,
  },

  scanInstructions: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  scanInput: {
    borderWidth: 1,
    borderColor: Surface.border,
    borderRadius: Radius.field,
    padding: 12,
    backgroundColor: Surface.background,
    fontSize: 13,
    color: Surface.text,
    textAlignVertical: "top",
    minHeight: 80,
  },

  cameraScanBtn: {
    height: 46,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  cameraScanBtnText: {
    ...Typography.button,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  errorText: {
    ...Typography.small,
    color: Surface.danger,
    fontSize: 12,
  },

  primaryModalBtn: {
    height: 46,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryModalBtnText: {
    ...Typography.button,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  passDetailsWrap: {
    gap: 12,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    padding: 10,
    borderRadius: Radius.field,
    backgroundColor: Surface.softGreen,
    borderWidth: 1,
    borderColor: Surface.softGreenBorder,
  },

  verifiedBadgeText: {
    ...Typography.micro,
    color: Surface.online,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  passDetailCard: {
    padding: 14,
    gap: 10,
    borderRadius: Radius.card,
    backgroundColor: Surface.background,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  passTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  bloodTag: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Blood.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  bloodTagText: {
    ...Typography.title,
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  passMeta: {
    flex: 1,
  },

  passPatientName: {
    ...Typography.cardTitle,
    fontSize: 14,
    color: Surface.text,
  },

  passHospitalName: {
    ...Typography.micro,
    color: Surface.textSecondary,
  },

  passInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  passInfoLabel: {
    ...Typography.small,
    fontSize: 12,
    color: Surface.textSecondary,
  },

  passInfoVal: {
    ...Typography.small,
    fontSize: 12,
    fontWeight: "700",
    color: Surface.text,
  },

  completeBtn: {
    height: 46,
    borderRadius: Radius.field,
    backgroundColor: "#027A48",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  completeBtnText: {
    ...Typography.button,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  completedNote: {
    ...Typography.small,
    color: Surface.online,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 6,
  },

  anotherBtn: {
    alignSelf: "center",
    paddingVertical: 8,
  },

  anotherBtnText: {
    ...Typography.small,
    color: Blood.primary,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.75,
  },
});
