import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useSyncExternalStore } from "react";
import { Button, Platform, StyleSheet, Text, View } from "react-native";

const LOCATION_TASK_NAME = "background-location-task";

type WalkStatus = "idle" | "tracking" | "paused";

// Module-level so every button shares one status.
let walkStatus: WalkStatus = "idle";
const listeners = new Set<() => void>();
// Web only. Browsers have no background location task, so
// startLocationUpdatesAsync/stopLocationUpdatesAsync aren't available. Location.watchPositionAsync
// returns a LocationSubscription instead; calling .remove() on it is the only way to pause or stop
// tracking on web. iOS/Android pause and stop by stopping LOCATION_TASK_NAME.
let webLocationSubscription: Location.LocationSubscription | null = null;

//updates walk status from resume, pause and stop. actual data
function setWalkStatus(next: WalkStatus) {
  walkStatus = next;
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
const useWalkStatus = () => useSyncExternalStore(subscribe, () => walkStatus);

async function startUpdates() {
  if (Platform.OS === "web") {
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
  if (Platform.OS === "web") {
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

  if (Platform.OS !== "web") {
    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();

    if (backgroundStatus !== "granted") {
      return;
    }
  }

  await startUpdates();
  setWalkStatus("tracking");
};

const pauseWalk = async () => {
  await stopUpdates();
  setWalkStatus("paused");
};

const resumeWalk = async () => {
  await startUpdates();
  setWalkStatus("tracking");
};

const stopWalk = async () => {
  await stopUpdates();
  setWalkStatus("idle");
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
  return <Text>Walk status: {status}</Text>;
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PermissionsButton;