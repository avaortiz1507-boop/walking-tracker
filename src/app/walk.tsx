import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useState, useSyncExternalStore } from "react";
import { Button, FlatList, Platform, StyleSheet, Text, View } from "react-native";

const LOCATION_TASK_NAME = "background-location-task";
const PERMISSION_DENIED_MESSAGE = "Location access is required to use tracking.";

type State = {
  status: "idle" | "tracking" | "paused";
  current: Location.LocationObject | null;
  records: { id: string; latitude: number; longitude: number; timestamp: number }[];
};

// Module-level store because the background task runs outside React.
let state: State = { status: "idle", current: null, records: [] };
let webWatch: Location.LocationSubscription | null = null;
const listeners = new Set<() => void>();

const getState = () => state;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function addRecords(locations: Location.LocationObject[]) {
  const newRecords = locations.map((loc) => ({
    id: `${loc.timestamp}`,
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    timestamp: loc.timestamp,
  }));
  update({
    records: [...state.records, ...newRecords],
    current: locations[locations.length - 1],
  });
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error || !data) return;
  addRecords((data as { locations: Location.LocationObject[] }).locations);
});

async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return false;

  update({ current: await Location.getCurrentPositionAsync({}) });
  return true;
}

async function startUpdates() {
  if (Platform.OS === "web") {
    webWatch = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced },
      (loc) => addRecords([loc]),
    );
    return;
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    foregroundService: {
      notificationTitle: "Tracking",
      notificationBody: "Location tracking active",
    },
  });
}

async function stopUpdates() {
  if (Platform.OS === "web") {
    webWatch?.remove();
    webWatch = null;
    return;
  }

  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

async function startTracking() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return false;

  if (Platform.OS !== "web") {
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== "granted") return false;
  }

  update({ records: [] });
  await startUpdates();
  update({ status: "tracking" });
  return true;
}

async function pauseTracking() {
  await stopUpdates();
  update({ status: "paused" });
}

async function resumeTracking() {
  await startUpdates();
  update({ status: "tracking" });
}

async function stopTracking() {
  await stopUpdates();
  update({ status: "idle" });
}

export default function LocationTracker() {
  const { status, current, records } = useSyncExternalStore(subscribe, getState);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const run = async (action: () => Promise<boolean | void>) => {
    const ok = await action();
    setErrorMsg(ok === false ? PERMISSION_DENIED_MESSAGE : null);
  };

  const coords = current?.coords;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {coords
          ? `Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`
          : "No location yet"}
      </Text>
      <Text style={styles.text}>Status: {status}</Text>
      {errorMsg && <Text style={styles.text}>{errorMsg}</Text>}

      <View>
        <Button title="Get Current Location" onPress={() => run(getCurrentLocation)} />
        <Button title="Start Walk" onPress={() => run(startTracking)} disabled={status !== "idle"} />
        <Button title="Pause" onPress={() => run(pauseTracking)} disabled={status !== "tracking"} />
        <Button title="Resume" onPress={() => run(resumeTracking)} disabled={status !== "paused"} />
        <Button title="Stop" onPress={() => run(stopTracking)} disabled={status === "idle"} />
      </View>

      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <Text>
            {new Date(item.timestamp).toLocaleTimeString()}: {item.latitude}, {item.longitude}
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  text: {
    fontSize: 18,
    textAlign: "center",
  },
});