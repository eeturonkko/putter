import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PuttRow = {
  id: number;
  session_id: number;
  distance_m: number;
  attempts: number;
  makes: number;
  created_at: string;
};

type Session = {
  id: number;
  user_id: string;
  name: string;
  date: string;
  created_at: string;
  putts: PuttRow[];
};

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://192.168.100.10:4000";

const onlyInt = (s: string) => s.replace(/[^\d]/g, "") || "0";
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const accessoryId = "numericDoneBar";
export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const userId = user?.id ?? "";
  const router = useRouter();

  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const c = palette(isDark);

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [distance, setDistance] = useState("0");
  const [attempts, setAttempts] = useState("0");
  const [makes, setMakes] = useState("0");

  const totals = useMemo(() => {
    if (!session) return { attempts: 0, makes: 0, pct: 0 };
    const att = session.putts.reduce((a, p) => a + p.attempts, 0);
    const mk = session.putts.reduce((a, p) => a + p.makes, 0);
    const pct = att ? Math.round((mk / att) * 100) : 0;
    return { attempts: att, makes: mk, pct };
  }, [session]);

  const sortPutts = (a: PuttRow, b: PuttRow) =>
    a.distance_m !== b.distance_m ? a.distance_m - b.distance_m : a.id - b.id;

  const load = useCallback(async () => {
    if (!id || !userId) return;
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/sessions/${id}`, {
        headers: { "Content-Type": "application/json", "x-user-id": userId },
      });
      if (!res.ok) {
        const txt = await res.text();
        if (res.status === 404) {
          setSession(null);
          setErr("Session not found.");
          return;
        }
        throw new Error(`${res.status}: ${txt || "Failed to load session"}`);
      }
      const data: Session = await res.json();
      data.putts = [...(data.putts || [])].sort(sortPutts);
      setSession(data);
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, userId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const addDistance = async () => {
    if (!session) return;
    const d = parseInt(onlyInt(distance), 10);
    const a = parseInt(onlyInt(attempts), 10);
    const m = parseInt(onlyInt(makes), 10);

    if (!d || d <= 0) return setErr("Distance must be a positive integer.");
    if (a < 0) return setErr("Attempts must be 0 or more.");
    if (m < 0) return setErr("Makes must be 0 or more.");
    if (m > a) return setErr("Makes cannot exceed attempts.");

    try {
      const res = await fetch(`${API_BASE}/sessions/${session.id}/putts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ distance_m: d, attempts: a, makes: m }),
      });
      if (!res.ok) throw new Error(await res.text());
      const row: PuttRow = await res.json();
      setSession((prev) =>
        prev ? { ...prev, putts: [...prev.putts, row].sort(sortPutts) } : prev
      );
      setModalOpen(false);
      setDistance("3");
      setAttempts("10");
      setMakes("7");
    } catch (e: any) {
      setErr(e?.message || "Failed to add distance");
    }
  };

  const updateRow = async (
    row: PuttRow,
    next: Partial<Pick<PuttRow, "attempts" | "makes">>
  ) => {
    if (!session) return;
    try {
      const res = await fetch(
        `${API_BASE}/sessions/${session.id}/putts/${row.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-user-id": userId },
          body: JSON.stringify(next),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const updated: PuttRow = await res.json();
      setSession((prev) =>
        prev
          ? {
              ...prev,
              putts: prev.putts
                .map((p) => (p.id === row.id ? updated : p))
                .sort(sortPutts),
            }
          : prev
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to update");
    }
  };

  const deleteRow = async (row: PuttRow) => {
    if (!session) return;
    try {
      const res = await fetch(
        `${API_BASE}/sessions/${session.id}/putts/${row.id}`,
        {
          method: "DELETE",
          headers: { "x-user-id": userId },
        }
      );
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      setSession((prev) =>
        prev
          ? { ...prev, putts: prev.putts.filter((p) => p.id !== row.id) }
          : prev
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to delete row");
    }
  };

  const confirmDeleteRow = (row: PuttRow) => {
    Alert.alert(
      `Delete ${row.distance_m}m row?`,
      "This will remove the distance record.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteRow(row) },
      ]
    );
  };

  const deleteSession = () => {
    if (!session) return;
    Alert.alert(
      "Delete session",
      "This will delete the session and all distances.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE}/sessions/${session.id}`, {
                method: "DELETE",
                headers: { "x-user-id": userId },
              });
              if (!res.ok && res.status !== 204)
                throw new Error(await res.text());
              router.back();
            } catch (e: any) {
              setErr(e?.message || "Failed to delete session");
            }
          },
        },
      ]
    );
  };

  const Row = ({ row }: { row: PuttRow }) => {
    const pct = row.attempts ? Math.round((row.makes / row.attempts) * 100) : 0;

    const incAttempts = () => updateRow(row, { attempts: row.attempts + 1 });
    const decAttempts = () =>
      updateRow(row, { attempts: Math.max(row.makes, row.attempts - 1) });

    const incMakes = () => {
      if (row.makes === row.attempts) {
        updateRow(row, { attempts: row.attempts + 1, makes: row.makes + 1 });
      } else {
        updateRow(row, { makes: row.makes + 1 });
      }
    };
    const decMakes = () =>
      updateRow(row, { makes: Math.max(0, row.makes - 1) });

    return (
      <Pressable
        onLongPress={() => confirmDeleteRow(row)}
        android_ripple={{ color: c.ripple }}
        style={[
          styles.row,
          {
            backgroundColor: c.cardBg,
            borderColor: c.border,
            shadowOpacity: isDark ? 0 : 0.05,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: c.fg }]}>
            {row.distance_m} m
          </Text>
          <Text style={[styles.rowMeta, { color: c.muted }]}>
            {row.makes}/{row.attempts} • {pct}%
          </Text>
        </View>

        <View style={styles.stepCol}>
          <Text style={[styles.stepLabel, { color: c.muted }]}>Att</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={decAttempts}
              style={[styles.stepBtn, { borderColor: c.border }]}
            >
              <Text style={[styles.stepBtnText, { color: c.fg }]}>−</Text>
            </Pressable>
            <Text style={[styles.stepValue, { color: c.fg }]}>
              {row.attempts}
            </Text>
            <Pressable
              onPress={incAttempts}
              style={[styles.stepBtn, { borderColor: c.border }]}
            >
              <Text style={[styles.stepBtnText, { color: c.fg }]}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.stepCol}>
          <Text style={[styles.stepLabel, { color: c.muted }]}>Make</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={decMakes}
              style={[styles.stepBtn, { borderColor: c.border }]}
            >
              <Text style={[styles.stepBtnText, { color: c.fg }]}>−</Text>
            </Pressable>
            <Text style={[styles.stepValue, { color: c.fg }]}>{row.makes}</Text>
            <Pressable
              onPress={incMakes}
              style={[styles.stepBtn, { borderColor: c.border }]}
            >
              <Text style={[styles.stepBtnText, { color: c.fg }]}>+</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
        <View style={styles.container}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: c.primary }]}
          >
            <Text style={[styles.backText, { color: c.onPrimary }]}>
              ← Back
            </Text>
          </Pressable>
          <Text style={[styles.title, { color: c.fg }]}>Session not found</Text>
          {err ? (
            <Text style={{ color: "#ef4444", marginTop: 8 }}>{err}</Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            android_ripple={{ color: c.ripple }}
            style={[styles.backBtn, { backgroundColor: c.primary }]}
          >
            <Text style={[styles.backText, { color: c.onPrimary }]}>
              ← Back
            </Text>
          </Pressable>

          <Pressable
            onPress={deleteSession}
            android_ripple={{ color: c.ripple }}
            style={[styles.deleteBtn, { borderColor: c.border }]}
          >
            <Text
              style={[
                styles.deleteText,
                { color: isDark ? "#fca5a5" : "#b91c1c" },
              ]}
            >
              Delete session
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: c.cardBg, borderColor: c.cardBorder },
          ]}
        >
          <Text style={[styles.title, { color: c.fg }]}>{session.name}</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>
            {session.date}
          </Text>

          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: c.badgeBg }]}>
              <Text style={[styles.statLabel, { color: c.muted }]}>
                Attempts
              </Text>
              <Text style={[styles.statValue, { color: c.fg }]}>
                {totals.attempts}
              </Text>
            </View>
            <View style={[styles.stat, { backgroundColor: c.badgeBg }]}>
              <Text style={[styles.statLabel, { color: c.muted }]}>Makes</Text>
              <Text style={[styles.statValue, { color: c.fg }]}>
                {totals.makes}
              </Text>
            </View>
            <View style={[styles.stat, { backgroundColor: c.badgeBg }]}>
              <Text style={[styles.statLabel, { color: c.muted }]}>
                Accuracy
              </Text>
              <Text style={[styles.statValue, { color: c.fg }]}>
                {totals.pct}%
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setModalOpen(true)}
              android_ripple={{ color: c.ripple }}
              style={[styles.button, { backgroundColor: c.primary }]}
            >
              <Text style={[styles.buttonText, { color: c.onPrimary }]}>
                Add distance
              </Text>
            </Pressable>
          </View>
        </View>

        {err ? (
          <Text style={{ color: "#ef4444", marginTop: 6 }}>{err}</Text>
        ) : null}

        <FlatList
          keyboardShouldPersistTaps="handled"
          data={session.putts}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.muted}
              colors={[c.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 16 }}
          renderItem={({ item }) => <Row row={item} />}
          ListEmptyComponent={
            <View
              style={[
                styles.empty,
                { backgroundColor: c.cardBg, borderColor: c.cardBorder },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: c.fg }]}>
                No distances yet
              </Text>
              <Text style={[styles.emptyText, { color: c.muted }]}>
                Tap “Add distance” to log your first range.
              </Text>
            </View>
          }
        />
      </View>

      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <Pressable
                onPress={() => {}}
                style={[
                  styles.modalCard,
                  { backgroundColor: c.cardBg, borderColor: c.cardBorder },
                ]}
              >
                <Text style={[styles.inputLabel, { color: c.muted }]}>
                  Distance (m)
                </Text>
                <TextInput
                  placeholder="e.g. 3"
                  keyboardType="number-pad"
                  placeholderTextColor={isDark ? "#7b8494" : "#9aa3b2"}
                  style={[
                    styles.input,
                    {
                      color: c.fg,
                      borderColor: c.border,
                      backgroundColor: c.bg,
                    },
                  ]}
                  value={distance}
                  onChangeText={(t) => setDistance(t.replace(/[^\d]/g, ""))}
                  inputAccessoryViewID={
                    Platform.OS === "ios" ? accessoryId : undefined
                  }
                />

                <Text style={[styles.inputLabel, { color: c.muted }]}>
                  Attempts
                </Text>
                <TextInput
                  placeholder="e.g. 10"
                  keyboardType="number-pad"
                  placeholderTextColor={isDark ? "#7b8494" : "#9aa3b2"}
                  style={[
                    styles.input,
                    {
                      color: c.fg,
                      borderColor: c.border,
                      backgroundColor: c.bg,
                    },
                  ]}
                  value={attempts}
                  onChangeText={(t) => setAttempts(t.replace(/[^\d]/g, ""))}
                  inputAccessoryViewID={
                    Platform.OS === "ios" ? accessoryId : undefined
                  }
                />

                <Text style={[styles.inputLabel, { color: c.muted }]}>
                  Makes
                </Text>
                <TextInput
                  placeholder="e.g. 7"
                  keyboardType="number-pad"
                  placeholderTextColor={isDark ? "#7b8494" : "#9aa3b2"}
                  style={[
                    styles.input,
                    {
                      color: c.fg,
                      borderColor: c.border,
                      backgroundColor: c.bg,
                    },
                  ]}
                  value={makes}
                  onChangeText={(t) => setMakes(t.replace(/[^\d]/g, ""))}
                  inputAccessoryViewID={
                    Platform.OS === "ios" ? accessoryId : undefined
                  }
                />

                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setModalOpen(false);
                    }}
                    android_ripple={{ color: c.ripple }}
                    style={[
                      styles.button,
                      styles.ghostButton,
                      { borderColor: c.border },
                    ]}
                  >
                    <Text style={[styles.ghostText, { color: c.fg }]}>
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={async () => {
                      Keyboard.dismiss();
                      await addDistance();
                    }}
                    android_ripple={{ color: c.ripple }}
                    style={[styles.button, { backgroundColor: c.primary }]}
                  >
                    <Text style={[styles.buttonText, { color: c.onPrimary }]}>
                      Add
                    </Text>
                  </Pressable>
                </View>

                {/* iOS "Done" bar */}
                {/*  {Platform.OS === "ios" && (
                  <InputAccessoryView nativeID={accessoryId}>
                    <View style={styles.accessoryBar}>
                      <View style={{ flex: 1 }} />
                      <Pressable
                        onPress={Keyboard.dismiss}
                        style={styles.accessoryBtn}
                      >
                        <Text style={styles.accessoryText}>Done</Text>
                      </Pressable>
                    </View>
                  </InputAccessoryView>
                )} */}
              </Pressable>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

function palette(dark: boolean) {
  return dark
    ? {
        bg: "#0c0f14",
        fg: "#eef2f7",
        muted: "#a8b0bc",
        cardBg: "#141922",
        cardBorder: "#1f2632",
        border: "#2a3342",
        primary: "#5b8cff",
        onPrimary: "#ffffff",
        ripple: "rgba(255,255,255,0.15)",
        badgeBg: "#202838",
        badgeFg: "#c8d1e0",
      }
    : {
        bg: "#f7f8fa",
        fg: "#0e141b",
        muted: "#586174",
        cardBg: "#ffffff",
        cardBorder: "#e6e9ef",
        border: "#d9dee6",
        primary: "#3b82f6",
        onPrimary: "#ffffff",
        ripple: "rgba(0,0,0,0.1)",
        badgeBg: "#eef2ff",
        badgeFg: "#3b82f6",
      };
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  backText: { fontWeight: "700" },
  deleteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteText: { fontWeight: "700" },

  card: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    gap: 8,
  },

  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  subtitle: { fontSize: 14 },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  stat: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
  statValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.2 },

  actionsRow: { marginTop: 12, flexDirection: "row", gap: 8 },
  button: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  buttonText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  ghostButton: { backgroundColor: "transparent", borderWidth: 1 },
  ghostText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    gap: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  rowMeta: { fontSize: 12, marginTop: 2 },

  stepCol: { alignItems: "center", gap: 6 },
  stepLabel: { fontSize: 11, fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { fontSize: 18, fontWeight: "800" },
  stepValue: {
    width: 36,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },

  empty: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 13, textAlign: "center" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.2 },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  accessoryBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d5db",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  accessoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
  },
  accessoryText: {
    color: "#fff",
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginTop: 6,
    marginBottom: 6,
  },
});
