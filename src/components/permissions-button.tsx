import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useSyncExternalStore } from "react";
import { Button, Platform, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import * as Notifications from "expo-notifications";

const LOCATION_TASK_NAME = "background-location-task";

// Web has no background location task, and Expo Go doesn't include the iOS background-location
// Info.plist keys (it throws "NSLocation*UsageDescription must be present"). Both track in the
// foreground with watchPositionAsync instead. Development builds use the background task.
const foregroundOnly =
  Platform.OS === "web" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type WalkStatus = "idle" | "tracking" | "paused";

// Module-level so every button shares one status.
let walkStatus: WalkStatus = "idle";
const listeners = new Set<() => void>();
// Used when foregroundOnly. watchPositionAsync returns a LocationSubscription, and calling
// .remove() on it is the only way to pause or stop. Otherwise we stop LOCATION_TASK_NAME.
let webLocationSubscription: Location.LocationSubscription | null = null;

// Seconds walked so far. The timer runs only while tracking, keeps its value when paused,
// and resets when the walk stops.
let elapsedSeconds = 0;
let walkTimer: ReturnType<typeof setInterval> | null = null;
// Remembers whether the goal notification was already sent, so its used once per walk
let goalNotificationSent = false;
//Set the variable to true after sending the notification.
function setNotificationSent(sent: boolean) {
  goalNotificationSent = sent;
} 


//updates walk status from resume, pause and stop. actual data
function setWalkStatus(next: WalkStatus) {
  walkStatus = next;

  // tracking mode: start the timer if tracking, stop it otherwise
  if (next === "tracking") {
    if (!walkTimer) {
      walkTimer = setInterval(() => {
        // continuously adds one second until paused or stopped
        elapsedSeconds += 1;
        listeners.forEach((l) => l());
        if (elapsedSeconds >= WALK_GOAL_SECONDS && !goalNotificationSent) {
          notifyGoalReached();
          // when true, mark the notification as sent so it won't be sent again
          setNotificationSent(true);
        }
      }, 1000);
    }
  } else {
    if (walkTimer) {
      clearInterval(walkTimer);
      walkTimer = null;
    }
    // starts over if the walk is idle and there is no ongoing walk
    if (next === "idle") {
      elapsedSeconds = 0;
      // if goalNotificationSent is false, the goal notification can be sent again 
      // in the next walk because the previous walk has ended
      goalNotificationSent = false;
    }
  }

  listeners.forEach((l) => l());

  
}

// added reminder message for when the walk is paused
let reminderMessage = "";

function setReminderMessage(next: string) {
  reminderMessage = next;
  listeners.forEach((l) => l());
}

// used to let parts of your app "listen" for changes, such as when it starts, pauses, or stops tracking
// Example usage: const status = useWalkStatus();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// useSyncExternalStore is used to read data outside of React(location updates) and subscribe to changes in walk status
// The third argument is the server snapshot, used when Expo renders the web page statically.
const useWalkStatus = () =>
  useSyncExternalStore(
    subscribe,
    () => walkStatus,
    () => "idle" as WalkStatus,
  );

async function startUpdates() {
  if (foregroundOnly) {
    if (!webLocationSubscription) {
      webLocationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced },
        (location) => console.log("foreground location", location),
      );
    }
    return;
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
  });
}

// stops location updates for both web and mobile 
async function stopUpdates() {
  if (foregroundOnly) {
    webLocationSubscription?.remove();
    webLocationSubscription = null;
    return;
  }

  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

const startWalk = async () => {
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();

  if (foregroundStatus !== "granted") {
    return;
  }

  if (!foregroundOnly) {
    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();

    if (backgroundStatus !== "granted") {
      return;
    }
  }

  await startUpdates();
  // a new walking session, so the goal notification can be sent again
  setNotificationSent(false);
  setWalkStatus("tracking");
};

// creating a unique key for notification ID 
const PAUSE_REMINDER_KEY = "pauseReminderId";

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

// goal of 60 seconds on tracking screen
const WALK_GOAL_SECONDS = 60;

// called by the timer once the walker reaches the goal
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


// after canceling, clear the stored notification ID
const cancelReminder = async () => {
  const id = await AsyncStorage.getItem(PAUSE_REMINDER_KEY);
  if (id) {
    await Notifications.dismissNotificationAsync(id);
    await AsyncStorage.removeItem(PAUSE_REMINDER_KEY);
  }
  alert("Pause reminder canceled.");
};

// Scheduling isn't supported on web, so there is nothing to cancel there.
async function cancelPauseReminders() {
  if (Platform.OS === "web") return;
  const id = await AsyncStorage.getItem(PAUSE_REMINDER_KEY);
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
  await AsyncStorage.removeItem(PAUSE_REMINDER_KEY);
}

const pauseWalk = async () => {
  await stopUpdates();
  setWalkStatus("paused");

  // Scheduling isn't supported on web, and nothing is scheduled without permission.
  if (Platform.OS === "web") return;
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
  await cancelReminder();
};

// button to stop walk, only enabled when walk status is not idle
const stopWalk = async () => {
  await stopUpdates();
  setWalkStatus("idle");
  setReminderMessage("");
  await cancelPauseReminders();
  await cancelReminder();
};


// button to start walk, only enabled when walk status is idle
const PermissionsButton = ({ title }: { title?: string | null }) => {
  const status = useWalkStatus();
  return (
    <View style={styles.container}>
      <Button
        onPress={startWalk}
        disabled={status !== "idle"}
        title={
          title !== null && title !== undefined
            ? title
            : `Enable ${Platform.OS === "web" ? "foreground" : "background"} location`
        }
      />
    </View>
  );
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

// button to stop walk, only enabled when walk status is not idle
export const StopWalkButton = ({ title }: { title?: string }) => {
  const status = useWalkStatus();
  return (
    <View style={styles.container}>
      <Button
        onPress={stopWalk}
        disabled={status === "idle"}
        title={title ?? "Stop Walk"}
      />
    </View>
  );
};

export const WalkStatusText = () => {
  const status = useWalkStatus();
  return <ThemedText>Walk status: {status}</ThemedText>;
};

// shows the 60 second goal and how many seconds have been walked
export const WalkGoalText = () => {
  const seconds = useSyncExternalStore(
    subscribe,
    () => elapsedSeconds,
    () => 0,
  );
  return (
    <View>
      <ThemedText>Goal: {WALK_GOAL_SECONDS} seconds</ThemedText>
      <ThemedText>CurrentProgress: {seconds} seconds</ThemedText>
      {seconds >= WALK_GOAL_SECONDS && <ThemedText>Walking goal reached!</ThemedText>}
    </View>
  );
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

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    // Error occurred - check `error.message` for more details.
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    // do something with the locations captured in the background
    console.log(locations);
  }
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
});

export default PermissionsButton;