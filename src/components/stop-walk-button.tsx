import { ThemedText } from "@/components/themed-text";
import { Button, StyleSheet, View } from "react-native";

import {
  setWalkStatus,
  stopUpdates,
  useWalkStatus,
} from "./tracking-walks";
import {
  cancelPauseReminders,
  clearReminderMessage,
} from "./permissions-button";

// Stop Walk button: ends the tracking session. Disabled when no walk is
// being tracked or paused.
const StopWalkButton = ({ title }: { title?: string }) => {
  const status = useWalkStatus();

  const stopWalk = async () => {
    // Stop the location subscription so no new coordinates are recorded.
    await stopUpdates();
    // "stopped" (not "idle") so the status text can show "Walk Stopped".
    setWalkStatus("stopped");
    // The route array is intentionally left untouched so the completed
    // route remains visible on the map.
    clearReminderMessage();
    await cancelPauseReminders();
  };

  return (
    <View style={styles.container}>
      <Button
        onPress={stopWalk}
        disabled={status === "idle" || status === "stopped"}
        title={title ?? "Stop Walk"}
      />
      {status === "stopped" && (
        <ThemedText>
          Walk stopped. The completed route remains on the map.
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
});

export default StopWalkButton;
