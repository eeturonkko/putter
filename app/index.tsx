import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SignOutButton } from "./components/SignOutButton";

export default function Home() {
  const { user } = useUser();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const c = palette(isDark);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <View style={styles.container}>
        {/* App header */}
        <View style={styles.headerRow}>
          <Text style={[styles.appName, { color: c.fg }]}>Putter</Text>
          <View style={[styles.badge, { backgroundColor: c.badgeBg }]}>
            <Text style={[styles.badgeText, { color: c.badgeFg }]}>v1.0</Text>
          </View>
        </View>

        {/* Big title */}
        <Text style={[styles.title, { color: c.fg }]}>Welcome</Text>
        <Text style={[styles.subtitle, { color: c.muted }]}>
          Putter is a helpful tool for improving your disc golf putting skills.
        </Text>

        {/* Content card */}
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
              You are signed in. Continue exploring the app or sign out below.
            </Text>
            <View style={styles.actionsRow}>
              <SignOutButton />
            </View>
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
});
