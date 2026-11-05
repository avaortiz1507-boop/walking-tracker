import { router } from "expo-router";
import { Button, StyleSheet } from "react-native";
import { SavedWalk } from "./sample-walks";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";


export const WalkDetailsScreen = ({ walk }: { walk: SavedWalk }) => {
  return (
    <ThemedView style={styles.container}>
      <Button title="Back" onPress={() => router.replace("/walk")} />
      <ThemedText type="subtitle">Walk Details</ThemedText>
      <ThemedText>Walk ID: {walk.id}</ThemedText>
      <ThemedText>Date and Time: {walk.dateTime}</ThemedText>
      <ThemedText>Starting Latitude: {walk.startLatitude}</ThemedText>
      <ThemedText>Starting Longitude: {walk.startLongitude}</ThemedText>
      <ThemedText>Status: {walk.status}</ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    // Extra top padding so the back button sits below the tab bar on web.
    paddingTop: 80,
    padding: 20,
    gap: 8,
    alignItems: "flex-start",
  },
});