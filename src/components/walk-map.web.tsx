import { StyleSheet, Text, View } from "react-native";

// react-native-maps is native-only, so the web build uses this fallback instead.
// react-native-maps is still in production so it only works on mobile platforms
export default function WalkMap() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        The interactive map is not available on the web. Your location and
        walking route are still tracked and shown as coordinates.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "80%",
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
});
