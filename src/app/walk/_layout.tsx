import { Stack } from "expo-router";

// The Walk tab is a stack: the tracker screen sits at the bottom and the
// Walk Details screen ([id].tsx) pushes on top when a deep link arrives.
// Both screens hide the stack header; the details screen renders its own
// back button below the tab bar.
export default function WalkLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
