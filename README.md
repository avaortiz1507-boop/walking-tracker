# Walking Tracker

Walking Tracker is an Expo and React Native app for recording walks with device location. The Walk tab displays the current coordinates and a timestamped list of recorded location points.

## Features

- Check the device's current location.
- Start, pause, resume, and stop a walk.
- Record latitude, longitude, and timestamp for each location update.
- Save recorded location points to local device storage.
- Track in the background on Android and iOS. On web, tracking runs while the page is active.

The Home and Explore tabs currently contain Expo starter content.

## Requirements

- Node.js and npm
- A device or simulator with location services for location tracking

## Getting started

Install dependencies and start the Expo development server:

```bash
npm install
npx expo start
```

Use the terminal prompts to open the app in an Android emulator, iOS simulator, or web browser. To start a platform directly, use one of these commands:

```bash
npm run android
npm run ios
npm run web
```

Location permission must be granted to use tracking. Android and iOS request background location permission when a walk starts; web requests foreground location permission. Native background tracking may require a development build depending on the device and Expo environment.

## Privacy

Location is collected only when the user requests their current position or starts a walk. Each recorded point includes latitude, longitude, and time, and is stored locally on the device. The app currently does not upload this data to a server. Tracking can be paused or stopped in the Walk tab.

## Development

Routes are defined in `src/app/`, and the location tracking implementation is in `src/components/location-tracker.tsx`.

Run the project's lint command with:

```bash
npm run lint
```

For more information, see the [Expo documentation](https://docs.expo.dev/) and [Expo Router documentation](https://docs.expo.dev/router/introduction/).
