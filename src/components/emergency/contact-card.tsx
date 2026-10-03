import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { FieldError } from "@/components/auth/field-error";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type ContactCardProps = {
  name: string;
  onChangeName: (value: string) => void;
  mobile: string;
  onChangeMobile: (value: string) => void;
  nameError?: string | null;
  mobileError?: string | null;
  /** Note about who sees this number, rendered under the card. */
  caption?: string;
};

/**
 * Contact person for the request, as one card with two borderless inputs.
 *
 * The design shows a single row — "Kamal Perera (077 889 9123)" — but the
 * service takes the name and the number as separate fields, so both live in one
 * bordered card rather than being flattened into a string and split again. A
 * hairline separates them.
 */
export function ContactCard({
  name,
  onChangeName,
  mobile,
  onChangeMobile,
  nameError = null,
  mobileError = null,
  caption,
}: ContactCardProps) {
  const hasError = nameError !== null || mobileError !== null;

  return (
    <View>
      <View style={[styles.card, hasError && styles.cardError]}>
        <View style={styles.row}>
          <Feather name="user" size={15} color={Surface.textMuted} />

          <TextInput
            value={name}
            onChangeText={onChangeName}
            placeholder="Contact person"
            placeholderTextColor={Surface.textMuted}
            style={styles.input}
            autoCapitalize="words"
            autoComplete="name"
            accessibilityLabel="Contact person"
            selectionColor={Blood.primary}
          />

          <Feather name="phone" size={15} color={Blood.primary} />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Feather name="smartphone" size={15} color={Surface.textMuted} />

          <TextInput
            value={mobile}
            onChangeText={onChangeMobile}
            placeholder="Mobile number"
            placeholderTextColor={Surface.textMuted}
            style={styles.input}
            keyboardType="phone-pad"
            autoComplete="tel"
            accessibilityLabel="Contact mobile number"
            selectionColor={Blood.primary}
          />

          {/* Keeps the phone glyph in the trailing column aligned with the row above. */}
          <View style={styles.trailingSpacer} />
        </View>
      </View>

      {nameError !== null ? <FieldError message={nameError} /> : null}

      {mobileError !== null ? <FieldError message={mobileError} /> : null}

      {caption !== undefined && !hasError ? (
        <Text style={styles.caption}>{caption}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.field,
    paddingHorizontal: 13,
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  cardError: {
    borderColor: Surface.danger,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Surface.border,
  },

  input: {
    ...Typography.input,
    flex: 1,
    color: Surface.text,
    // Android adds its own vertical padding, which would break the row height.
    paddingVertical: 0,
  },

  trailingSpacer: {
    width: 15,
  },

  caption: {
    ...Typography.micro,
    fontSize: 8.5,
    fontWeight: "500",
    lineHeight: 12,
    letterSpacing: 0.1,
    color: Surface.textMuted,
    marginTop: 6,
  },
});