import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const c = palette(isDark);

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit =
    emailAddress.length > 3 && password.length >= 6 && isLoaded && !submitting;

  const onSignInPress = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const attempt = await signIn!.create({
        identifier: emailAddress.trim(),
        password,
      });

      if (attempt.status === "complete") {
        await setActive!({ session: attempt.createdSessionId });
        router.replace("/");
      } else {
        setError("Kirjautuminen ei valmistunut. Yritä uudelleen.");
        console.error(JSON.stringify(attempt, null, 2));
      }
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.longMessage ||
        e?.errors?.[0]?.message ||
        "Kirjautuminen epäonnistui. Tarkista sähköposti ja salasana.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <View style={styles.headerRow}>
              <Text style={[styles.appName, { color: c.fg }]}>YourApp</Text>
            </View>

            <Text style={[styles.title, { color: c.fg }]}>Kirjaudu sisään</Text>
            <Text style={[styles.subtitle, { color: c.muted }]}>
              Syötä sähköpostisi ja salasanasi jatkaaksesi.
            </Text>

            <View
              style={[
                styles.card,
                { backgroundColor: c.cardBg, borderColor: c.cardBorder },
              ]}
            >
              <Text style={[styles.label, { color: c.muted }]}>Sähköposti</Text>
              <TextInput
                placeholder="nimi@esimerkki.fi"
                placeholderTextColor={isDark ? "#8a93a4" : "#9aa3b2"}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                value={emailAddress}
                onChangeText={setEmailAddress}
                style={[styles.input, { color: c.fg, borderColor: c.border }]}
              />

              <Text style={[styles.label, { color: c.muted, marginTop: 10 }]}>
                Salasana
              </Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={isDark ? "#8a93a4" : "#9aa3b2"}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { color: c.fg, borderColor: c.border }]}
              />

              {!!error && (
                <Text style={[styles.errorText, { color: c.error }]}>
                  {error}
                </Text>
              )}

              <Pressable
                onPress={onSignInPress}
                disabled={!canSubmit}
                android_ripple={{ color: c.ripple }}
                style={[
                  styles.button,
                  {
                    backgroundColor: canSubmit ? c.primary : c.disabled,
                  },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={[styles.buttonText, { color: c.onPrimary }]}>
                    Jatka
                  </Text>
                )}
              </Pressable>

              <View style={styles.altRow}>
                <Text style={{ color: c.muted }}>Eikö ole tiliä?</Text>
                <Link href="/(auth)/sign-up" asChild>
                  <Pressable android_ripple={{ color: c.ripple }}>
                    <Text style={[styles.altLink, { color: c.primary }]}>
                      Luo tili
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            {/* Footer */}
            <Text style={[styles.footer, { color: c.muted }]}>
              Jatkamalla hyväksyt käyttöehdot ja tietosuojan.
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
        disabled: "#3b4760",
        ripple: "rgba(255,255,255,0.15)",
        error: "#ff6b6b",
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
        disabled: "#b7cdfc",
        ripple: "rgba(0,0,0,0.1)",
        error: "#d44",
      };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 18,
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
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    marginTop: 6,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  altRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  altLink: {
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: "auto",
    marginBottom: 12,
  },
});
