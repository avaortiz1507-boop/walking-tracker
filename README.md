# Walking Tracker

A mobile walking tracker built with Expo and React Native. Check your current location, record a walk, and review its saved location points. Added pause reminders and notifications when reaches a walking goal.

## Features

- View your current latitude and longitude.
- Start, pause, resume, and stop location tracking.
- See the current tracking status: idle, tracking, or paused.
- Review recorded location points.
- Receive location updates in the background on mobile while a walk is active.
- Request permission to display notifications
- Pausing timer to remind
- Walking goal of 60 seconds with a notification once you walked for 60 seconds

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

## Using on Mobile

1. Download Expo Go App and sign in with the same email you used for GitHub/VsCode.
2. Make sure your mobile device and the enviornment(computer used to run this program) you used to set up is connected to the same wifi.
3. Run npx expo start in terminal.
4. Scroll until you see the QR code, scan it with your phone camera, and viola! App
   should be running on your phone.

## Manual Checks

- **Current location:** Allow permission and confirm that coordinates appear. Denying permission should show an error message.
- **Walk tracking:** Start a walk, move with the device, and confirm that location points are recorded.
- **Tracking controls:** Pause, resume, and stop the walk using the corresponding buttons.

## Built With

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- `expo-location`
- `expo-task-manager`
- `expo-linking`

## Privacy

The app reads your location when you request your current position. During an active walk, it records latitude, longitude, and timestamps. Recorded points are stored locally on the device. Pause or stop tracking to end location collection for the walk.

# Edit 10/26/26 Testing Newly Added Timers and Goal Notifications

1. Approve notification permission and confirm that the status message changes.
   Yes. I have approved permission on mobile device. Remembers permissions.
2. Deny notification permission and confirm that the app explains that reminders are disabled.
   Yes. I have declined permission on web.
3. Pause a walk and wait for the reminder to appear.
   This works.
4. Pause and then resume the walk before the reminder appears.
   I didn't get notification. Counted 9 seconds before resuming.
5. Confirm that the reminder does not appear after the walk is resumed.
   Yes.
6. Pause and then stop the walk before the reminder appears.
   Yup.
7. Confirm that the reminder does not appear after the walk is stopped.
   Yes.
8. Complete the 60-second walking goal.
   Completed.
9. Confirm that the goal notification appears.
   Yes, it does.
10. Confirm that the goal notification appears only once during the walking session.
    Yes, it does.
11. Minimize the app and confirm that a notification can still appear.
    Yes, it does.

# Project Working

![Project Screenshot](src/app/images/Screenshot_26-10-2026_32928_localhost.jpeg)
![Project Screenshot](src/app/images/Screenshot_26-10-2026_33042_localhost.jpeg)

## Greatest Problems/Challenges

The biggest challenge so far was adding the simple walking goal. When I looked it up and
started researching on how I can do this, the code made little sense to me so I had to
go down a rabbit hole on things like what ReturnType<typeof setInterval> is. At first, I was overwhelmed because I didn't know where to start but then it started to make more sense
once I started reading the code because I've worked with it in the past.

The second biggest challenge was how can I make an ID for the pause reminder? Luckily, after looking it up, it was straight forward. Had to make a key, which can be translated into an ID
(learned this from HashTable). Then the rest started to make more sense and I was understanding.

The third biggest challenge was that Expo Go App decided to update to SDK version 58.0.0
while my VsCode was still on 57.0.0 so I was getting annoyed as to why my code suddenly
stopped working or was showing red lines. Thats when I asked AI to help me solve the issue, and it did.


# 11/5/26 Deep Links

## Schemes
Computer(web):http://localhost:8081/walk/1
iPhone: mywalks://walk/1
Android: walkingtracker://walk/1
Expo Go: exp://10.0.0.200:8081/--/walk/1

## Valid Deep Link Example

```
mywalks://walk/1
```

Opens the app to the Walk Details screen for walk 1 (October 1, 2026 at 10:00 AM,
47.6062, -122.3321, Completed).

## Invalid Deep Link Examples

```
mywalks://walk/999     → Walk not found. Please check the walk ID.
mywalks://walk/        → A walk ID is required.
mywalks://banana       → This link cannot be opened by the Mobile Walking Tracker.
```

## How to Test the Deep Link

- **Web:** run `npx expo start`, then open `http://localhost:8081/walk/1` in a browser.
- **Expo Go (iPhone):** run `npx expo start --tunnel`, then put
  `exp://<tunnel-url>/--/walk/1` in the Notes app and tap it (Safari blocks typed
  custom schemes, and Expo Go only registers the `exp://` scheme).
- **Standalone build:** `mywalks://walk/1` works once the app is installed as a
  development build (EAS Build), which registers the custom scheme with iOS.

## Deep Links Situations
1. A valid deep link opens the correct saved walk.
Yes, this works. This is what handleDeepLink() does in src/components/WalkDetailsScreen.tsx.
2. A deep link works while the app is already open.
Yes, this works. This is what Linking.addEventListener() does in src/app/_layout.tsx.
3. A deep link works while the app is running in the background.
Yes, this works.
4. A deep link works when the app is completely closed.
Yes, this works. This is what Linking.getInitialURL() does in src/app/_layout.tsx.
5. A deep link with an invalid walk ID is handled safely.
Yes, this works. This is what if (!walk) {} is used for in src/app/walk/[id].tsx
6. A deep link with a missing walk ID is handled safely.
Yes, this works. This is what if (Platform.OS === "web" && window.location.pathname.endsWith("/walk/")) {
      setLinkError("A walk ID is required.");
    } in src/app/walk/index.tsx is for.
7. The Maps button uses the selected walk's coordinates.
Yes, this works. This is what openMaps = async () =>{} is used for in src/components/WalkDetailsScreen.tsx.
8. The web map button uses the selected walk's coordinates.
Yes, this works. This is what  openWebLocation = async () =>{}is used for in src/components/WalkDetailsScreen.tsx.
9. The app displays an error message when an action cannot be opened.
Yes, this works.
10. The app continues running after an external action fails.
Yes, this works. This is used for the Maps, the OpenStreetMap and handleDeepLink as to not
crash the app.

## Problems Encountered

1. **First adding the deep link** After completed steps 1-5, I was stumped on step 6. I didn't know what to do, so I looked on Google and asked CoPilot for help. Luckily, they were both able to help and from starting the project all the way to the end, it was making sense.
2. **/walk/2 kept closing and redirecting to the Home tab.** At first, whenever I tried out http://localhost:8081/walk/2, it automatically closed itself out. What I found out was that the tab navigator only recognizes its own tabs, so /walk/2 had nowhere to render. AI was able to fix it by turning the walk tab into a stack (walk/_layout.tsx) with the tracker as index and [id].tsx pushing on top.


![Project Screenshot](src/app/images/Screenshot_5-11-2026_01616_www.google.com.jpeg)
![Project Screenshot](src/app/images/Screenshot_5-11-2026_0164_localhost.jpeg)