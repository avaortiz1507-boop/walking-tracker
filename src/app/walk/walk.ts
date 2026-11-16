import { useSyncExternalStore } from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const LOCATION_TASK_NAME = "background-location-task";

// Web has no background location task, and Expo Go doesn't include the iOS background-location
// Info.plist keys (it throws "NSLocation*UsageDescription must be present"). Both track in the
// foreground with watchPositionAsync instead. Development builds use the background task.
const foregroundOnly =
  Platform.OS === "web" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// three statuses
export type WalkStatus = "idle" | "tracking" | "paused";

//every button shares one status.
let walkStatus: WalkStatus = "idle";
const listeners = new Set<() => void>();
// Used when foregroundOnly. watchPositionAsync returns a LocationSubscription, and calling
// .remove() on it is the only way to pause or stop. Otherwise we stop LOCATION_TASK_NAME.
let webLocationSubscription: Location.LocationSubscription | null = null;

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
export const useWalkStatus = () =>
  useSyncExternalStore(
    subscribe,
    () => walkStatus,
    () => "idle" as WalkStatus,
  );

//start foreground location tracking once and avoid creating duplicate location listeners.
export async function startUpdates() {
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
export async function stopUpdates() {
  if (foregroundOnly) {
    webLocationSubscription?.remove();
    webLocationSubscription = null;
    return;
  }

  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

//starts a new walk
export const startWalk = async () => {
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

// Part 6 Simple Walking Goal
// goal of 60 seconds on tracking screen
const WALK_GOAL_SECONDS = 60;

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

// Part 7/8 Send a Goal Notification and prevent duplicates
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
