import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Alert, Button, StyleSheet } from "react-native";
import { SavedWalk } from "./sample-walks";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";


export const WalkDetailsScreen = ({ walk }: { walk: SavedWalk }) => {
  // Builds a Google Maps URL from the walk's starting coordinates and opens it, but only after checking the device can handle the link.
  const openMaps = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${walk.startLatitude},${walk.startLongitude}`;
    try {
      // Check if the device can open the URL before attempting to open it.
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Unable to open the maps app. Please try again on a device with a compatible maps app.");
      }
    } catch {
      // A failed open must not crash the app.
      Alert.alert("Unable to open the maps app. Please try again on a device with a compatible maps app.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Button title="Back" onPress={() => router.replace("/walk")} />
      <ThemedText type="subtitle">Walk Details</ThemedText>
      <ThemedText>Walk ID: {walk.id}</ThemedText>
      <ThemedText>Date and Time: {walk.dateTime}</ThemedText>
      <ThemedText>Starting Latitude: {walk.startLatitude}</ThemedText>
      <ThemedText>Starting Longitude: {walk.startLongitude}</ThemedText>
      <ThemedText>Status: {walk.status}</ThemedText>
      <Button title="Open Starting Location in Maps" onPress={openMaps} />
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