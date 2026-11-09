import { Button, Platform, StyleSheet, View } from "react-native";

import {
  beginWalkSession,
  requestWalkPermissions,
  useWalkStatus,
} from "./tracking-walks";

// Start Walk button: requests location permission, clears the previous route,
// and starts tracking. Disabled while a walk is already tracking or paused.
const StartWalkButton = ({ title }: { title?: string | null }) => {
  const status = useWalkStatus();

  const startWalk = async () => {
    // Tracking must not start unless location permission is approved.
    if (!(await requestWalkPermissions())) {
      return;
    }
    await beginWalkSession();
  };

  return (
    <View style={styles.container}>
      <Button
        onPress={startWalk}
        disabled={status === "tracking" || status === "paused"}
        title={
          title !== null && title !== undefined
            ? title
            : `Enable ${Platform.OS === "web" ? "foreground" : "background"} location`
        }
      />
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

export default StartWalkButton;
