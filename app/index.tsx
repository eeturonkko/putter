import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SignOutButton } from "./components/SignOutButton";
import { palette } from "./utils/functions";
import AppHeader from "./components/AppHeader";
import EmptyState from "./components/EmptyState";
import NewSessionModal from "./components/NewSessionModal";
import SessionList from "./components/SessionList";

type Session = {
  id: number;
  name: string;
  date: string;
  created_at: string;
};

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");

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

  const userId = user?.id ?? "";

  const fetchSessions = useCallback(async () => {
    if (!userId || !API_BASE) return;
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

  const createSession = useCallback(
    async ({ name, date }: { name: string; date: string }) => {
      if (!API_BASE) return;
      if (!name) {
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
          body: JSON.stringify({ name, date }),
        });
        if (!res.ok) throw new Error(await res.text());
        const created: Session = await res.json();
        setSessions((prev) => [created, ...prev]);
        setCreateOpen(false);
        router.push({
          pathname: "/(tabs)/session/[id]",
          params: { id: String(created.id) },
        });
      } catch (e: any) {
        setError(e?.message || "Failed to create session");
      }
    },
    [userId, router]
  );

  const openSession = (s: Session) => {
    router.push({
      pathname: "/(tabs)/session/[id]",
      params: { id: String(s.id) },
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <View style={styles.container}>
        <AppHeader
          colors={{ fg: c.fg, badgeBg: c.badgeBg, badgeFg: c.badgeFg }}
        />

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
              <SessionList
                data={sessions}
                onOpen={openSession}
                refreshing={refreshing}
                onRefresh={onRefresh}
                isDark={isDark}
                colors={{
                  ripple: c.ripple,
                  cardBg: c.cardBg,
                  border: c.border,
                  fg: c.fg,
                  muted: c.muted,
                }}
                empty={
                  <EmptyState
                    title="No sessions yet"
                    subtitle='Tap "New session" to start logging your putts.'
                    colors={{
                      cardBg: c.cardBg,
                      cardBorder: c.cardBorder,
                      fg: c.fg,
                      muted: c.muted,
                    }}
                  />
                }
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

      <NewSessionModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createSession}
        isDark={isDark}
        colors={{
          bg: c.bg,
          fg: c.fg,
          muted: c.muted,
          cardBg: c.cardBg,
          cardBorder: c.cardBorder,
          border: c.border,
          ripple: c.ripple,
          primary: c.primary,
          onPrimary: c.onPrimary,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 10,
  },
  subtitle: { fontSize: 15, lineHeight: 20 },
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
  cardTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.2 },
  cardText: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  actionsRow: { marginTop: 12, flexDirection: "row", gap: 8 },
  actionsCol: { marginTop: 12, gap: 10 },
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
  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: "auto",
    marginBottom: 12,
  },
});
