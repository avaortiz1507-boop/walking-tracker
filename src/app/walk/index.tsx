import PermissionsButton, {PauseWalkButton,ResumeWalkButton,StopWalkButton,WalkStatusText,WalkGoalText,PauseReminderText} from "@/components/permissions-button";
import { sampleWalks } from "@/components/sample-walks";
import { WalkDetailsScreen } from "@/components/WalkDetailsScreen";
import Constants from "expo-constants";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View, Button } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("myNotificationChannel", {
      name: "A channel is needed for the permissions prompt to appear",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    alert("Notifications are disabled. Reminders will not appear.");
    return;
  } alert("Permission approved: Notifications are enabled.");



  // Learn more about projectId:
  // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
  // EAS projectId is used here.
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      throw new Error("Project ID not found");
    }
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    console.log(token);
  } catch (e) {
    token = `${e}`;
  }

  return token;
}
async function schedulePushNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "You've got mail! 📬",
      body: 'Here is the notification body',
      data: { data: 'goes here', test: { test1: 'more data' } },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}


export default function WalkScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState("");
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
    [],
  );
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);

  useEffect(() => {
    // A link like http://localhost:8081/walk/ or mywalks://walk/ has no walk
    // ID. The trailing slash means someone asked for a walk but didn't say
    // which one, so show the missing-ID message.
    if (Platform.OS === "web" && window.location.pathname.endsWith("/walk/")) {
      setLinkError("A walk ID is required.");
    }

    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log(location);
      const { latitude, longitude } = location.coords;
      console.log(latitude, longitude);
      setLocation(location);
    }
    

    async function setupNotification() {
      registerForPushNotificationsAsync().then(
        (token) => token && setExpoPushToken(token),
      );

      if (Platform.OS === "android") {
        Notifications.getNotificationChannelsAsync().then((value) =>
          setChannels(value ?? []),
        );
      }
      const notificationListener =
        Notifications.addNotificationReceivedListener((notification) => {
          setNotification(notification);
        });

      const responseListener =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log(response);
        });

      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    }
    

    getCurrentLocation();
    setupNotification();
  }, []);

  let text = "Waiting...";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    const { latitude, longitude } = location?.coords ?? {
      latitude: "N/A",
      longitude: "N/A",
    };

    text = `Latitude: ${latitude}, Longitude: ${longitude}`;
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
    >
      {linkError && <Text style={styles.linkError}>{linkError}</Text>}
         <Text>Your expo push token: {expoPushToken}</Text>
      <Text>{`Channels: ${JSON.stringify(
        channels.map(c => c.id),
        null,
        2
      )}`}</Text>
      <PermissionsButton title="Start Walk" />
      <PauseWalkButton title="Pause Walk" />
      <ResumeWalkButton title="Resume Walk" />
      <StopWalkButton title="Stop Walk" />
      <WalkStatusText />
      <WalkGoalText />
      <PauseReminderText />
      <Text style={styles.paragraph}>{text}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {/* hide button on web platform */}
        {Platform.OS !== "web" && (
          <Button
            title="Press to schedule a notification"
            onPress={async () => {
              await schedulePushNotification();
            }}
          />
        )}
        <Text>Title: {notification && notification.request.content.title} </Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  linkError: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 120,
  },
  paragraph: {
    fontSize: 18,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
});