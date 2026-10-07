import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequestList } from "@/components/dashboard/request-list";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { Blood, Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { apiErrorMessage } from "@/services/auth";
import {
  completeDonationCase,
  verifyDonorCheckIn,
} from "@/services/donors/donor-workflow";

export default function HospitalDashboardScreen() {
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifiedPass, setVerifiedPass] = useState<{
    requestId: string;
    token: string;
    stage: string;
    donorName?: string;
    bloodGroup?: string;
    patientName?: string;
    hospital?: string;
    units?: number;
  } | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeSuccess, setCompleteSuccess] = useState(false);

  return (
    <DashboardShell title="Hospital Dashboard">
      {(summary, helpers) => {
        const awaiting = summary.requests.filter((request) => request.status === "pending");
        const handled = summary.requests.filter((request) => request.status !== "pending");

        async function handleProcessScan() {
          const raw = scanInput.trim();
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

            // Find matching request in summary if available
            const matchedReq = summary.requests.find((r) => r.id === requestId);

            await verifyDonorCheckIn(requestId, token);

            setVerifiedPass({
              requestId,
              token,
              stage: "arrived",
              donorName: "Verified Donor",
              bloodGroup: matchedReq?.bloodGroup ?? "O+",
              patientName: matchedReq?.patientName ?? "Emergency Patient",
              hospital: matchedReq?.hospital ?? "Hospital Intake Desk",
              units: matchedReq?.units ?? 1,
            });

            helpers.reload();
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
            setVerifiedPass((prev) => (prev ? { ...prev, stage: "completed" } : null));
            helpers.reload();
          } catch (caught) {
            setVerifyError(apiErrorMessage(caught));
          } finally {
            setIsCompleting(false);
          }
        }

        return (
          <>
            <StatGrid stats={summary.stats} />

            {/* Quick Intake QR Scanner Banner */}
            <View style={styles.scanActionBanner}>
              <View style={styles.scanBannerIcon}>
                <Feather name="grid" size={20} color={Blood.primary} />
              </View>

              <View style={styles.scanBannerText}>
                <Text style={styles.scanBannerTitle}>Donor Hospital Intake</Text>
                <Text style={styles.scanBannerSubtitle}>
                  Scan the arriving donor’s QR code to verify pass details and register intake.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Verify donor pass"
                onPress={() => {
                  setScanInput("");
                  setVerifyError(null);
                  setVerifiedPass(null);
                  setCompleteSuccess(false);
                  setShowScannerModal(true);
                }}
                style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
              >
                <Feather name="maximize" size={15} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Verify Pass</Text>
              </Pressable>
            </View>

            <View style={styles.notice}>
              <Feather name="shield" size={14} color={Surface.textSecondary} />
              <Text style={styles.noticeText}>
                Verifying an emergency request releases it to matching donors. Unverified requests
                stay in triage only.
              </Text>
            </View>

            <SectionHeading
              label="Awaiting verification"
              trailing={<Text style={styles.count}>{awaiting.length}</Text>}
            />

            <RequestList
              requests={awaiting}
              emptyTitle="Triage queue is clear"
              emptyMessage="Every request has been verified or closed."
            />

            {handled.length > 0 ? (
              <>
                <SectionHeading label="Verified and recent" />
                <RequestList requests={handled} />
              </>
            ) : null}

            {/* Modal for QR Pass Scanner & Details */}
            <Modal
              visible={showScannerModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowScannerModal(false)}
            >
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
                      onPress={() => setShowScannerModal(false)}
                      style={styles.closeBtn}
                    >
                      <Feather name="x" size={18} color={Surface.text} />
                    </Pressable>
                  </View>

                  {!verifiedPass ? (
                    <View style={styles.scanForm}>
                      <Text style={styles.scanInstructions}>
                        Scan or paste the donor intake QR code string to see verified pass details:
                      </Text>

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
                              <Text style={styles.completeBtnText}>
                                Confirm Blood Draw & Complete
                              </Text>
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
          </>
        );
      }}
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  scanActionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Radius.card,
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.border,
    ...Elevation.card,
  },

  scanBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Surface.softRed,
    alignItems: "center",
    justifyContent: "center",
  },

  scanBannerText: {
    flex: 1,
    gap: 2,
  },

  scanBannerTitle: {
    ...Typography.cardTitle,
    fontSize: 14.5,
    color: Surface.text,
  },

  scanBannerSubtitle: {
    ...Typography.micro,
    color: Surface.textSecondary,
    fontSize: 11,
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    height: 38,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
  },

  scanButtonText: {
    ...Typography.button,
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  noticeText: {
    ...Typography.small,
    color: Surface.textSecondary,
    flex: 1,
  },

  count: {
    ...Typography.micro,
    color: Surface.textSecondary,
  },

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
