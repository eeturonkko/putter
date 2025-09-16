import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={async () => {
        await signOut();
        router.replace("/");
      }}
    >
      <Text style={styles.buttonText}>Sign out</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    color: "white",
  },
});
