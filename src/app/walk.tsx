import { useState, useEffect } from 'react';
import { Platform, Text, View, StyleSheet } from 'react-native';

import * as Location from 'expo-location';
import PermissionsButton from '../components/permissions-button';

export default function WalkScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function getCurrentLocation() {
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log('location', location);
      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  let text = 'Waiting...';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    const { latitude, longitude } = location.coords;
    text = `Latitude: ${latitude}, Longitude: ${longitude}`;
  }

  return (
    <View style={styles.container}>
      <PermissionsButton title="Start Walk" />
      <Text style={styles.paragraph}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  paragraph: {
    fontSize: 18,
    textAlign: 'center',
  },
});