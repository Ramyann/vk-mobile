import { useFonts } from "expo-font";
import { View } from "react-native";
import { AppRoot } from "./src/App";
import { colors } from "./src/styles/tokens";
import { fontFiles } from "./src/styles/typography";

/**
 * Builds embed Gilroy through the expo-font plugin; this also loads it in
 * Expo Go and the web preview. If loading fails the app still opens, in the
 * system font, rather than hanging on a blank screen.
 */
export default function App() {
  const [loaded, error] = useFonts(fontFiles);
  if (!loaded && !error)
    return <View style={{ backgroundColor: colors.white, flex: 1 }} />;
  return <AppRoot />;
}
