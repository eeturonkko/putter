import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type Session = {
  id: number;
  name: string;
  date: string;
  created_at: string;
};

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://192.168.100.10:4000";

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!id || !user?.id) return;
      setLoading(true);
      setErr(null);
      try {
        const url = `${API_BASE}/sessions/${id}`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id, // IMPORTANT: real Clerk user id
          },
        });

        if (!res.ok) {
          // Read text safely to avoid JSON parse crashes
          const txt = await res.text();
          if (res.status === 404) {
            if (!cancelled) {
              setSession(null);
              setErr("Session not found (404).");
            }
            return;
          }
          throw new Error(`${res.status}: ${txt || "Request failed"}`);
        }

        const data: Session = await res.json();
        if (!cancelled) setSession(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  const bg = isDark ? "#0c0f14" : "#f7f8fa";
  const fg = isDark ? "#eef2f7" : "#0e141b";

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {err ? (
        <>
          <Text style={[styles.title, { color: fg }]}>Error</Text>
          <Text style={{ color: isDark ? "#fca5a5" : "#b91c1c", marginTop: 8 }}>
            {err}
          </Text>
        </>
      ) : session ? (
        <>
          <Text style={[styles.title, { color: fg }]}>{session.name}</Text>
          {/* Add more session info here later */}
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: fg }]}>Session not found</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    alignSelf: "flex-start",
  },
  backText: { color: "#fff", fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "700" },
});
