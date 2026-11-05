import { useLocalSearchParams } from "expo-router";

import { sampleWalks } from "@/components/sample-walks";
import { ThemedText } from "@/components/themed-text";
import { WalkDetailsScreen } from "@/components/WalkDetailsScreen";

// Deep link target: walkingtracker://walk/<id> (or /walk/<id> on web).
// expo-router reads the ID from the end of the URL and passes it as a param.
export default function WalkDetailsRoute() {
  //finds the walk ID from the URL parameters
  //for example, walkingtracker://walk/2 will have id "2"
  const { id } = useLocalSearchParams<{ id: string }>();

  // Search the saved walks for a matching ID.
  const walk = sampleWalks.find((w) => w.id === id);

  if (!walk) {
    return <ThemedText>No walk found with ID: {id}</ThemedText>;
  }

  return <WalkDetailsScreen walk={walk} />;
}
