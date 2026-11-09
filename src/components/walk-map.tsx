import { StyleSheet, View } from "react-native";
import MapView, { Circle, Marker, Polyline } from "react-native-maps";
import { useRoute } from "./tracking-walks";

type Coords = { latitude: number; longitude: number };

export default function WalkMap({ coords }: { coords: Coords | null }) {
  // The walked route, recorded by the tracking buttons in permissions-button.
  const route = useRoute();

  // centers the map for the user
  const region = {
    latitude: coords?.latitude ?? 37.78825,
    longitude: coords?.longitude ?? -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={region} region={region}>
        {coords && <Marker coordinate={coords} title="You are here" />}
        {/* Draw the walked route once at least two points exist. The route
            is never cleared on stop, so it stays visible after the walk ends. */}
        {route.length > 1 && <Polyline coordinates={route} strokeWidth={4} />}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "80%",
    minHeight: 240,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});