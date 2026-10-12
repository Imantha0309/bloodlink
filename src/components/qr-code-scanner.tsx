import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type QrCodeScannerProps = {
  /** Called once per successful read with the raw QR payload. */
  onScanned: (value: string) => void;
  onCancel: () => void;
};

/** Full-pane live camera that reads a single QR code and hands it back. */
export function QrCodeScanner({ onScanned, onCancel }: QrCodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const lockRef = useRef(false);

  // Ask for the camera as soon as the pane mounts.
  useEffect(() => {
    if (permission?.granted === false && permission?.canAskAgain !== false) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  // Web has no reliable BarcodeDetector in expo-camera; callers hide the pane.
  if (Platform.OS === "web") {
    return null;
  }

  if (!permission) {
    return (
      <View style={styles.pane}>
        <Text style={styles.hint}>Preparing camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.pane}>
        <Feather name="camera-off" size={34} color={Surface.textMuted} />
        <Text style={styles.hint}>Camera access is needed to scan the donor pass QR.</Text>

        {permission.canAskAgain ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void requestPermission()}
            style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}
          >
            <Feather name="camera" size={16} color="#FFFFFF" />
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </Pressable>
        ) : (
          <Text style={styles.settingsHint}>Enable camera for this app in your device settings.</Text>
        )}

        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancelLink}>
          <Text style={styles.cancelLinkText}>Enter code manually</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.pane}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={(event) => {
          // Debounce: the scanner fires many times per second on a steady frame.
          if (lockRef.current || hasScanned) return;
          const value = event.data?.trim();
          if (!value) return;

          lockRef.current = true;
          setHasScanned(true);
          onScanned(value);
        }}
      />

      {/* Framing overlay: dimmed surround with a clear scan window. */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
        </View>
        <Text style={styles.hint}>Point at the donor intake QR code</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel scanning"
        onPress={onCancel}
        style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
      >
        <Feather name="x" size={18} color="#FFFFFF" />
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const FRAME_SIZE = 230;

const styles = StyleSheet.create({
  pane: {
    height: 320,
    borderRadius: Radius.card,
    overflow: "hidden",
    backgroundColor: "#111318",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: Radius.field,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },

  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: Blood.primary,
  },

  cornerTopLeft: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  cornerTopRight: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  cornerBottomLeft: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  cornerBottomRight: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },

  hint: {
    ...Typography.small,
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 24,
  },

  settingsHint: {
    ...Typography.micro,
    color: "#CBD2E0",
    textAlign: "center",
    paddingHorizontal: 24,
  },

  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    height: 42,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
  },

  permissionButtonText: {
    ...Typography.button,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  cancelButton: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  cancelButtonText: {
    ...Typography.small,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  cancelLink: {
    paddingVertical: 6,
  },

  cancelLinkText: {
    ...Typography.small,
    color: "#FFFFFF",
    textDecorationLine: "underline",
  },

  pressed: {
    opacity: 0.8,
  },
});
