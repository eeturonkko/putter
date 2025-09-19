import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  title: string;
  subtitle: string;
  colors: { cardBg: string; cardBorder: string; fg: string; muted: string };
};

export default function EmptyState({ title, subtitle, colors }: Props) {
  return (
    <View
      style={[
        styles.box,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
    >
      <Text style={[styles.title, { color: colors.fg }]}>{title}</Text>
      <Text style={[styles.text, { color: colors.muted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  title: { fontSize: 16, fontWeight: "700" },
  text: { fontSize: 13, textAlign: "center" },
});
