import { ThemedText } from "@/components/themed-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useSyncExternalStore } from "react";
import { Button, Platform, StyleSheet, View } from "react-native";

import StartWalkButton from "./start-walk-button";
import StopWalkButton from "./stop-walk-button";
import {
  setOnGoalReached,
  setWalkStatus,
  startUpdates,
  stopUpdates,
  useElapsedSeconds,
  useWalkStatus,
  WALK_GOAL_SECONDS,
} from "./tracking-walks";

// Re-export so existing imports of "PermissionsButton" (the Start Walk button)
// and "StopWalkButton" keep working now that they live in their own files.
export default StartWalkButton;
export { StopWalkButton };

// Local listener set for the pause reminder message, which is separate from
// the walk-tracking store's listeners.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((l) => l());
}

// Part 7/8 Send a Goal Notification and prevent duplicates
// called by the store's goal timer once the walker reaches the goal
function notifyGoalReached() {
  if (Platform.OS === "web") return;
  Notifications.getPermissionsAsync().then(({ status }) => {
    if (status !== "granted") return;
    return Notifications.scheduleNotificationAsync({
      content: {
        title: "Goal Reached",
        body: "Great job! You completed your walking goal.",
      },
      trigger: null,
    });
  });
}

// Register the goal handler with the store so its timer can fire it.
setOnGoalReached(notifyGoalReached);

// shows the 60 second goal and how many seconds have been walked
export const WalkGoalText = () => {
  const seconds = useElapsedSeconds();
  return (
    <View>
      <ThemedText>Goal: {WALK_GOAL_SECONDS} seconds</ThemedText>
      <ThemedText>CurrentProgress: {seconds} seconds</ThemedText>
      {seconds >= WALK_GOAL_SECONDS && (
        <ThemedText>Walking goal reached!</ThemedText>
      )}
    </View>
  );
};

// Part 5 Pause Reminder
// creating a unique key for notification ID
const PAUSE_REMINDER_KEY = "pauseReminderId";
// added reminder message for when the walk is paused
let reminderMessage = "";

function setReminderMessage(next: string) {
  reminderMessage = next;
  notifyListeners();
}

// Exported so the Stop Walk button can clear any visible pause reminder.
export function clearReminderMessage() {
  setReminderMessage("");
}

// Reuses the stored ID if there is one, otherwise generates a new one.
export const generateNotificationId = async () => {
  const id = await AsyncStorage.getItem(PAUSE_REMINDER_KEY);
  return id || `pause-reminder-${Date.now()}`;
};

// reminder notification using ID to cancel
export const schedulePauseReminder = async (
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
) => {
  const id = await generateNotificationId();
  await AsyncStorage.setItem(PAUSE_REMINDER_KEY, id);

  // Passing identifier is what lets cancelScheduledNotificationAsync find it later.
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      data: { id },
    },
    trigger,
  });

  console.log("Pause reminder scheduled with ID:", id);
};

// Scheduling isn't supported on web, so web only tracks the on-screen reminder status.
let webReminderActive = false;

// Cancels the scheduled pause reminder by its saved ID, then clears the ID.
// Exported so the Stop Walk button can cancel reminders when a walk ends.
export async function cancelPauseReminders() {
  if (Platform.OS === "web") {
    if (webReminderActive) {
      webReminderActive = false;
      setReminderMessage("Pause reminder canceled.");
    }
    return;
  }

  // If there is no saved ID, there is nothing to cancel.
  const id = await AsyncStorage.getItem(PAUSE_REMINDER_KEY);
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
  await Notifications.dismissNotificationAsync(id).catch(() => {});
  await AsyncStorage.removeItem(PAUSE_REMINDER_KEY);
  setReminderMessage("Pause reminder canceled.");
}

// Pauses the current walk and schedules a pause reminder.
const pauseWalk = async () => {
  await stopUpdates();
  setWalkStatus("paused");

  // Web can't schedule notifications, so it only shows the status message.
  if (Platform.OS === "web") {
    webReminderActive = true;
    setReminderMessage("Pause reminder scheduled.");
    return;
  }
  const { status: notificationStatus } =
    await Notifications.getPermissionsAsync();
  if (notificationStatus !== "granted") return;

  // Schedule a notification to remind the user that the walk is paused
  await schedulePauseReminder(
    "Walk Paused",
    "Your walk is still paused. Open the app when you are ready to continue.",
    {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
    },
  );
  setReminderMessage("Pause reminder scheduled.");
};

// button to resume walk, only enabled when walk status is paused
const resumeWalk = async () => {
  await startUpdates();
  setWalkStatus("tracking");
  setReminderMessage("");
  await cancelPauseReminders();
};

// text to display reminder message when walk is paused
export const PauseReminderText = () => {
  const message = useSyncExternalStore(
    subscribe,
    () => reminderMessage,
    () => "",
  );
  return message ? <ThemedText>{message}</ThemedText> : null;
};

// button to pause walk, only enabled when walk status is tracking
export const PauseWalkButton = ({ title }: { title?: string }) => {
  const status = useWalkStatus();
  return (
    <View style={styles.container}>
      <Button
        onPress={pauseWalk}
        disabled={status !== "tracking"}
        title={title ?? "Pause Walk"}
      />
    </View>
  );
};

// button to resume walk, only enabled when walk status is paused
export const ResumeWalkButton = ({ title }: { title?: string }) => {
  const status = useWalkStatus();
  return (
    <View style={styles.container}>
      <Button
        onPress={resumeWalk}
        disabled={status !== "paused"}
        title={title ?? "Resume Walk"}
      />
    </View>
  );
};

// Shows the tracking status using the exact labels the assignment requires.
export const WalkStatusText = () => {
  const status = useWalkStatus();
  const label =
    status === "tracking" || status === "paused"
      ? "Tracking"
      : status === "stopped"
        ? "Walk Stopped"
        : "Not Tracking";
  return <ThemedText>Tracking Status: {label}</ThemedText>;
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
});
