import { StyleSheet, Image, Platform } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context'; // Import SafeAreaView

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { HelloWave } from '@/components/HelloWave';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const gradientColors = colorScheme === 'light'
    ? ['#E0F7FA', '#B2EBF2'] // Light blue gradient
    : ['#263238', '#455A64']; // Dark blue-gray gradient

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.overlay}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title" style={styles.mainTitle}>Welcome to Echoes!</ThemedText>
            <HelloWave />
          </ThemedView>
          <ThemedText type="subtitle" style={styles.tagline}>Discover and share audio memories tied to places around you.</ThemedText>

          <ThemedView style={styles.buttonContainer}>
            <Link href="/(tabs)/explore" style={styles.button}>
              <ThemedText type="link" style={styles.buttonText}>Explore Echoes</ThemedText>
            </Link>
            <Link href="/(tabs)/record" style={styles.button}>
              <ThemedText type="link" style={styles.buttonText}>Record Your Echo</ThemedText>
            </Link>
          </ThemedView>

          {/* Adjust footerText to be part of the flex layout */}
          <ThemedText type="default" style={styles.footerText}>
            Your world, in sound.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute space between elements
    paddingVertical: 20, // Add vertical padding
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // Make overlay transparent to show gradient
    paddingHorizontal: 20, // Use horizontal padding
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.light.text, // Use a specific color for contrast
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 40,
    color: Colors.light.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 20,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: Colors.light.tint, // Use tint color for buttons
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footerText: {
    // Removed absolute positioning, now part of flex layout
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 'auto', // Push to the bottom within the flex container
  },
});