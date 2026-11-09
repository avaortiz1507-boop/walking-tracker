import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";

const LOCATION_TASK_NAME = "background-location-task";

// Web has no background location task, and Expo Go doesn't include the iOS background-location
// Info.plist keys (it throws "NSLocation*UsageDescription must be present"). Both track in the
// foreground with watchPositionAsync instead. Development builds use the background task.
const foregroundOnly =
  Platform.OS === "web" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// four statuses: "stopped" is separate from "idle" so the screen can show
// "Walk Stopped" after a walk ends instead of "Not Tracking".
export type WalkStatus = "idle" | "tracking" | "paused" | "stopped";

// A single saved route point: just the coordinates the assignment requires.
export type RoutePoint = { latitude: number; longitude: number };

//every button shares one status.
let walkStatus: WalkStatus = "idle";
// Route points and current position live at module level (next to walkStatus)
// because location callbacks run outside React and need somewhere to write.
let route: RoutePoint[] = [];
let currentPosition: RoutePoint | null = null;
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

// Notifies every subscribed component that something changed.
function notifyListeners() {
  listeners.forEach((l) => l());
}

// useSyncExternalStore is used to read data outside of React(location updates) and subscribe to changes in walk status
// The third argument is the server snapshot, used when Expo renders the web page statically.
export const useWalkStatus = () =>
  useSyncExternalStore(
    subscribe,
    () => walkStatus,
    () => "idle" as WalkStatus,
  );

// Hooks so components (e.g. the map) can read the route and current position.
export const useRoute = () =>
  useSyncExternalStore(
    subscribe,
    () => route,
    () => [] as RoutePoint[],
  );

export const useCurrentPosition = () =>
  useSyncExternalStore(
    subscribe,
    () => currentPosition,
    () => null,
  );

// Called every time a new location arrives: update the current position and
// append the point to the route array, then notify subscribed components.
function recordLocation(location: Location.LocationObject) {
  const point = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
  currentPosition = point;
  route = [...route, point];
  notifyListeners();
}

//start foreground location tracking once and avoid creating duplicate location listeners.
export async function startUpdates() {
  if (foregroundOnly) {
    if (!webLocationSubscription) {
      webLocationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced },
        // record each new location instead of just logging it
        recordLocation,
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

// Requests the location permissions needed to start a walk. Returns true only
// when tracking is allowed to begin.
export async function requestWalkPermissions(): Promise<boolean> {
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();

  if (foregroundStatus !== "granted") {
    return false;
  }

  if (!foregroundOnly) {
    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();

    if (backgroundStatus !== "granted") {
      return false;
    }
  }

  return true;
}

// Part 6 Simple Walking Goal
// goal of 60 seconds on tracking screen
export const WALK_GOAL_SECONDS = 60;

// Seconds walked so far. The timer runs only while tracking, keeps its value when paused,
// and resets when the walk stops.
let elapsedSeconds = 0;
let walkTimer: ReturnType<typeof setInterval> | null = null;
// Remembers whether the goal notification was already sent, so its used once per walk
let goalNotificationSent = false;

// Called when the walking goal is reached. Set by permissions-button.tsx,
// which owns the notification logic.
let onGoalReached: (() => void) | null = null;
export function setOnGoalReached(handler: () => void) {
  onGoalReached = handler;
}

// Hook so components can read the elapsed walk time.
export const useElapsedSeconds = () =>
  useSyncExternalStore(
    subscribe,
    () => elapsedSeconds,
    () => 0,
  );

// Updates the shared walk status, runs the goal timer, and notifies subscribers.
export function setWalkStatus(next: WalkStatus) {
  walkStatus = next;

  // tracking mode: start the timer if tracking, stop it otherwise
  if (next === "tracking") {
    if (!walkTimer) {
      walkTimer = setInterval(() => {
        // continuously adds one second until paused or stopped
        elapsedSeconds += 1;
        notifyListeners();
        if (elapsedSeconds >= WALK_GOAL_SECONDS && !goalNotificationSent) {
          onGoalReached?.();
          // when true, mark the notification as sent so it won't be sent again
          goalNotificationSent = true;
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

  notifyListeners();
}

// Begins a new walking session: clears the previous route, starts listening
// for location changes, and marks the status as tracking.
export async function beginWalkSession() {
  // Clear the route left from the previous walking session before starting.
  route = [];
  currentPosition = null;
  // a new walking session, so the goal notification can be sent again
  goalNotificationSent = false;
  await startUpdates();
  setWalkStatus("tracking");
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    // Error occurred - check `error.message` for more details.
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    // record background locations the same way as foreground ones
    locations.forEach(recordLocation);
  }
});
