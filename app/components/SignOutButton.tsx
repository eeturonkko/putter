import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { palette } from "../utils/functions";
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
