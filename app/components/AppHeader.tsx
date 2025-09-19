import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  title?: string;
  version?: string;
  colors: { fg: string; badgeBg: string; badgeFg: string };
};

export default function AppHeader({
  title = "Putter",
  version = "v1.0",
  colors,
}: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.appName, { color: colors.fg }]}>{title}</Text>
      <View style={[styles.badge, { backgroundColor: colors.badgeBg }]}>
        <Text style={[styles.badgeText, { color: colors.badgeFg }]}>
          {version}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appName: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
});
