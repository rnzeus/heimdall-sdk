import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import { type JSX, useSyncExternalStore } from "react";

import {
  type FramesRecordingState,
  getFramesRecordingState,
  setFramesRecordingAllowed,
  subscribeFramesRecording,
} from "../../../core/frames";
import type { PromptTheme } from "../theme";

const describe = (state: FramesRecordingState): { text: string; isWarning: boolean } => {
  if (!state.isAllowed) {
    return { text: "Off on this device: bug reports get no screens.", isWarning: false };
  }
  if (state.status?.reason === "recording_declined") {
    return {
      text: "Recording was declined. Turn this off not to be asked again, or restart the app to be asked.",
      isWarning: true,
    };
  }
  if (state.status?.state === "running") {
    return { text: "On — screens for bug reports, only while Heimdall is connected.", isWarning: false };
  }
  return {
    text:
      Platform.OS === "ios"
        ? "Starts when Heimdall asks for screens; iOS will ask to allow screen recording."
        : "Starts when Heimdall asks for screens.",
    isWarning: false,
  };
};

type Props = { theme: PromptTheme };

/** The tester's say over screen recording on this device; shown only when the app can capture the screen. */
const ScreenRecording = ({ theme }: Props): JSX.Element | null => {
  const state = useSyncExternalStore(subscribeFramesRecording, getFramesRecordingState);
  if (!state.isAvailable) return null;
  const hint = describe(state);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.text }]}>Record the screen for bug reports</Text>
        <Switch
          value={state.isAllowed}
          onValueChange={setFramesRecordingAllowed}
          trackColor={{ true: theme.primary, false: theme.border }}
        />
      </View>
      <Text style={[styles.hint, { color: hint.isWarning ? theme.warning : theme.muted }]}>{hint.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 4, marginTop: 12 },
  row: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  label: { flexShrink: 1, fontSize: 13 },
  hint: { fontSize: 12, lineHeight: 16 },
});

export default ScreenRecording;
