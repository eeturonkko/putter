import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

export const SignOutButton = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const c = palette(isDark);
  const { signOut } = useClerk();
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={async () => {
        await signOut();
        router.replace("/");
      }}
      style={[styles.button, { backgroundColor: c.primary }]}
    >
      <Text style={[styles.buttonText, { color: c.onPrimary }]}>Sign out</Text>
    </TouchableOpacity>
  );
};

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
});

export default SignOutButton;
