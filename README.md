# Walking Tracker

A mobile walking tracker built with Expo and React Native. Check your current location, record a walk, and review its saved location points.

## Features

- View your current latitude and longitude.
- Start, pause, resume, and stop location tracking.
- See the current tracking status: idle, tracking, or paused.
- Review recorded location points.
- Receive location updates in the background on mobile while a walk is active.

## Get Started

### Requirements

- Node.js and npm
- A device or emulator with location services enabled

### Install and Run

```bash
npm install
npx expo start
```

Open the app in Expo Go or an emulator. Use the Expo CLI prompts to select a platform.

## Using the Tracker

1. Select **Get Current Location** to view your coordinates.
2. Select **Start Walk** and grant the requested location permissions.
3. Use **Pause** and **Resume** to control tracking during your walk.
4. Select **Stop** to finish. Recorded points appear in the list.

> Location access requires foreground permission. Android and iOS also request background location permission when you start a walk.

## Manual Checks

- **Current location:** Allow permission and confirm that coordinates appear. Denying permission should show an error message.
- **Walk tracking:** Start a walk, move with the device, and confirm that location points are recorded.
- **Tracking controls:** Pause, resume, and stop the walk using the corresponding buttons.

## Built With

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- `expo-location`
- `expo-task-manager`

## Privacy

The app reads your location when you request your current position. During an active walk, it records latitude, longitude, and timestamps. Recorded points are stored locally on the device. Pause or stop tracking to end location collection for the walk.
