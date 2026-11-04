import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import { SavedWalk } from "./sample-walks";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";


export const WalkDetailsScreen = ({ walk }: { walk: SavedWalk }) => {
  return (
    <ThemedView style={styles.container}>
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
    padding: 20,
    gap: 8,
  },
});