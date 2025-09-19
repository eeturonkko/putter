import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SignOutButton } from "./components/SignOutButton";
import { palette } from "./utils/functions";
type Session = {
  id: number;
  name: string;
  date: string; // YYYY-MM-DD
  created_at: string;
};

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const c = palette(isDark);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [newDate, setNewDate] = useState(today);

  const userId = user?.id ?? "";
  const insets = useSafeAreaInsets();
  const accessoryId = "newSessionDoneBar";

  const fetchSessions = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Session[] = await res.json();
      setSessions(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(async () => {
    if (!newName.trim()) {
      setError("Session name is required.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ name: newName.trim(), date: newDate }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: Session = await res.json();
      setSessions((prev) => [created, ...prev]);
      // reset & close
      setNewName("");
      setNewDate(today);
      setCreateOpen(false);

      router.push({
        pathname: "/(tabs)/session/[id]",
        params: { id: String(created.id) },
      });
    } catch (e: any) {
      setError(e?.message || "Failed to create session");
    }
  }, [newName, newDate, userId, today, router]);

  const openSession = (s: Session) => {
    router.push({
      pathname: "/(tabs)/session/[id]",
      params: { id: String(s.id) },
    });
  };

  const Empty = () => (
    <View
      style={[
        styles.empty,
        { borderColor: c.cardBorder, backgroundColor: c.cardBg },
      ]}
    >
      <Text style={[styles.emptyTitle, { color: c.fg }]}>No sessions yet</Text>
      <Text style={[styles.emptyText, { color: c.muted }]}>
        Tap “New session” to start logging your putts.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.appName, { color: c.fg }]}>Putter</Text>
          <View style={[styles.badge, { backgroundColor: c.badgeBg }]}>
            <Text style={[styles.badgeText, { color: c.badgeFg }]}>v1.0</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: c.fg }]}>Welcome</Text>
        <Text style={[styles.subtitle, { color: c.muted }]}>
          Putter helps you track distances and makes to sharpen your putting.
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: c.cardBg, borderColor: c.cardBorder },
          ]}
        >
          <SignedIn>
            <Text style={[styles.cardTitle, { color: c.fg }]}>
              Hei, {user?.primaryEmailAddress?.emailAddress}
            </Text>
            <Text style={[styles.cardText, { color: c.muted }]}>
              Create a new session or open an existing one below.
            </Text>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => setCreateOpen(true)}
                android_ripple={{ color: c.ripple }}
                style={[styles.button, { backgroundColor: c.primary }]}
              >
                <Text style={[styles.buttonText, { color: c.onPrimary }]}>
                  New session
                </Text>
              </Pressable>
              <SignOutButton />
            </View>

            {error ? (
              <Text style={{ color: "#ef4444", marginTop: 8 }}>{error}</Text>
            ) : null}

            {loading ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator />
              </View>
            ) : (
              <FlatList
                data={sessions}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    tintColor={c.muted}
                    colors={[c.primary]}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
                ListEmptyComponent={<Empty />}
                ItemSeparatorComponent={() => (
                  <View
                    style={{
                      height: 10,
                    }}
                  />
                )}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => openSession(item)}
                    android_ripple={{ color: c.ripple }}
                    style={[
                      styles.sessionRow,
                      {
                        backgroundColor: c.cardBg,
                        borderColor: c.border,
                        shadowOpacity: isDark ? 0 : 0.05,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.sessionName, { color: c.fg }]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.sessionMeta, { color: c.muted }]}>
                        {item.date} • #{item.id}
                      </Text>
                    </View>
                    <Text style={[styles.sessionChevron, { color: c.muted }]}>
                      ›
                    </Text>
                  </Pressable>
                )}
                contentContainerStyle={{ paddingTop: 10 }}
              />
            )}
          </SignedIn>

          <SignedOut>
            <Text style={[styles.cardTitle, { color: c.fg }]}>Get started</Text>
            <Text style={[styles.cardText, { color: c.muted }]}>
              Create an account or sign in to continue.
            </Text>
            <View style={styles.actionsCol}>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable
                  android_ripple={{ color: c.ripple }}
                  style={[styles.button, { backgroundColor: c.primary }]}
                >
                  <Text style={[styles.buttonText, { color: c.onPrimary }]}>
                    Kirjaudu sisään
                  </Text>
                </Pressable>
              </Link>

              <Link href="/(auth)/sign-up" asChild>
                <Pressable
                  android_ripple={{ color: c.ripple }}
                  style={[
                    styles.button,
                    styles.ghostButton,
                    { borderColor: c.border },
                  ]}
                >
                  <Text style={[styles.ghostText, { color: c.fg }]}>
                    Luo tili
                  </Text>
                </Pressable>
              </Link>
            </View>
          </SignedOut>
        </View>

        <Text style={[styles.footer, { color: c.muted }]}>
          By continuing you agree to our Terms & Privacy.
        </Text>
      </View>

      <Modal
        visible={createOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateOpen(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={insets.top + 8}
              style={{ width: "100%" }}
            >
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: c.cardBg, borderColor: c.cardBorder },
                ]}
              >
                <Text style={[styles.cardTitle, { color: c.fg }]}>
                  New session
                </Text>

                <TextInput
                  placeholder="Session name"
                  placeholderTextColor={isDark ? "#7b8494" : "#9aa3b2"}
                  style={[
                    styles.input,
                    {
                      color: c.fg,
                      borderColor: c.border,
                      backgroundColor: c.bg,
                    },
                  ]}
                  value={newName}
                  onChangeText={setNewName}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                  inputAccessoryViewID={
                    Platform.OS === "ios" ? accessoryId : undefined
                  }
                />

                <TextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDark ? "#7b8494" : "#9aa3b2"}
                  style={[
                    styles.input,
                    {
                      color: c.fg,
                      borderColor: c.border,
                      backgroundColor: c.bg,
                    },
                  ]}
                  value={newDate}
                  onChangeText={setNewDate}
                  autoCapitalize="none"
                  keyboardType={
                    Platform.OS === "ios"
                      ? "numbers-and-punctuation"
                      : "default"
                  }
                  returnKeyType="done"
                  inputAccessoryViewID={
                    Platform.OS === "ios" ? accessoryId : undefined
                  }
                />

                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setCreateOpen(false);
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
                      await createSession();
                    }}
                    android_ripple={{ color: c.ripple }}
                    style={[styles.button, { backgroundColor: c.primary }]}
                  >
                    <Text style={[styles.buttonText, { color: c.onPrimary }]}>
                      Create
                    </Text>
                  </Pressable>
                </View>

                {/* iOS "Done" bar above the keyboard */}
                {/* {Platform.OS === "ios" && (
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
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  card: {
    marginTop: 10,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  actionsCol: {
    marginTop: 12,
    gap: 10,
  },
  button: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  ghostText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: "auto",
    marginBottom: 12,
  },
  // List
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sessionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  sessionChevron: {
    fontSize: 28,
    marginLeft: 10,
  },
  // Empty
  empty: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  // Modal
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
});
