import React, { useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; date: string }) => Promise<void> | void;
  isDark: boolean;
  colors: {
    bg: string;
    fg: string;
    muted: string;
    cardBg: string;
    cardBorder: string;
    border: string;
    ripple: string;
    primary: string;
    onPrimary: string;
  };
};

export default function NewSessionModal({
  visible,
  onClose,
  onSubmit,
  isDark,
  colors,
}: Props) {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [name, setName] = useState("");
  const [date, setDate] = useState(today);

  const submit = async () => {
    Keyboard.dismiss();
    await onSubmit({ name: name.trim(), date });
    setName("");
    setDate(today);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={insets.top + 8}
            style={{ width: "100%" }}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.title, { color: colors.fg }]}>
                New session
              </Text>

              <TextInput
                placeholder="Session name"
                placeholderTextColor={isDark ? "#7b8494" : "#9aa3b2"}
                style={[
                  styles.input,
                  {
                    color: colors.fg,
                    borderColor: colors.border,
                    backgroundColor: colors.bg,
                  },
                ]}
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />

              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDark ? "#7b8494" : "#9aa3b2"}
                style={[
                  styles.input,
                  {
                    color: colors.fg,
                    borderColor: colors.border,
                    backgroundColor: colors.bg,
                  },
                ]}
                value={date}
                onChangeText={setDate}
                autoCapitalize="none"
                keyboardType={
                  Platform.OS === "ios" ? "numbers-and-punctuation" : "default"
                }
                returnKeyType="done"
              />

              <View style={styles.actions}>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    onClose();
                  }}
                  android_ripple={{ color: colors.ripple }}
                  style={[
                    styles.btn,
                    styles.ghost,
                    { borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.ghostText, { color: colors.fg }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={submit}
                  android_ripple={{ color: colors.ripple }}
                  style={[styles.btn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.btnText, { color: colors.onPrimary }]}>
                    Create
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  card: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: "700", letterSpacing: -0.2 },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  actions: { marginTop: 12, flexDirection: "row", gap: 8 },
  btn: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  btnText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  ghost: { backgroundColor: "transparent", borderWidth: 1 },
  ghostText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
});
