import React from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type Session = {
  id: number;
  name: string;
  date: string;
  created_at: string;
};

type Props = {
  data: Session[];
  onOpen: (s: Session) => void;
  refreshing: boolean;
  onRefresh: () => void;
  isDark: boolean;
  colors: {
    ripple: string;
    cardBg: string;
    border: string;
    fg: string;
    muted: string;
  };
  empty: React.ReactElement | null;
};

export default function SessionList({
  data,
  onOpen,
  refreshing,
  onRefresh,
  isDark,
  colors,
  empty,
}: Props) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          tintColor={colors.muted}
          colors={[colors.fg]}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      ListEmptyComponent={empty}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onOpen(item)}
          android_ripple={{ color: colors.ripple }}
          style={[
            styles.row,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              shadowOpacity: isDark ? 0 : 0.05,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.fg }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>
              {item.date} • #{item.id}
            </Text>
          </View>
          <Text style={[styles.chev, { color: colors.muted }]}>›</Text>
        </Pressable>
      )}
      contentContainerStyle={{ paddingTop: 10 }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  name: { fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  meta: { fontSize: 12, marginTop: 2 },
  chev: { fontSize: 28, marginLeft: 10 },
});
