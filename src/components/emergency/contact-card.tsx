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
 * Contact person for the request, as one row.
 *
 * The design shows a single line — "Kamal Perera (077 889 9123)" — but the
 * service takes the name and the number as separate fields. So the row keeps one
 * border and one line, with the two editable fields either side of a pair of
 * literal parentheses, rather than flattening them into a string and splitting it
 * again on the way out.
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
  const error = nameError ?? mobileError;

  return (
    <View>
      <View style={[styles.card, error !== null && styles.cardError]}>
        <Feather name="user" size={12} color={Surface.textMuted} />

        <TextInput
          value={name}
          onChangeText={onChangeName}
          placeholder="Contact person"
          placeholderTextColor={Surface.textMuted}
          style={[styles.input, styles.inputName]}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          accessibilityLabel="Contact person"
          selectionColor={Blood.primary}
        />

        <Text style={styles.paren}>(</Text>

        <TextInput
          value={mobile}
          onChangeText={onChangeMobile}
          placeholder="077 000 0000"
          placeholderTextColor={Surface.textMuted}
          style={[styles.input, styles.inputMobile]}
          keyboardType="phone-pad"
          autoComplete="tel"
          returnKeyType="done"
          accessibilityLabel="Contact mobile number"
          selectionColor={Blood.primary}
        />

        <Text style={styles.paren}>)</Text>

        {/* Not a button — the number is already editable in the row. */}
        <Feather name="phone" size={12} color={Blood.primary} />
      </View>

      <FieldError message={error} reserveSpace={false} />

      {caption !== undefined && error === null ? (
        <Text style={styles.caption}>{caption}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 40,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  cardError: {
    borderColor: Surface.danger,
  },

  input: {
    ...Typography.input,
    // Android adds its own vertical padding that breaks the fixed row height.
    paddingVertical: 0,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: -0.05,
    color: Surface.text,
  },

  inputName: {
    flex: 1,
  },

  inputMobile: {
    // Fixed width so the number cannot wrap mid-number at 375px.
    flexShrink: 0,
    width: 82,
  },

  paren: {
    ...Typography.micro,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    color: Surface.textMuted,
  },

  caption: {
    ...Typography.micro,
    fontSize: 7.5,
    lineHeight: 11,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textMuted,
    marginTop: 5,
  },
});