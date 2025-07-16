import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import MapViewComponent from './components/MapView'; // Import your MapViewComponent

export default function App() {
  useEffect(() => {
    const getOrCreateAnonymousUserId = async () => {
      let userId = await AsyncStorage.getItem('anonymousUserId');
      if (!userId) {
        userId = uuidv4();
        await AsyncStorage.setItem('anonymousUserId', userId);
      }
    };
    getOrCreateAnonymousUserId();
  }, []);

  return (
    <View style={styles.container}>
      <MapViewComponent /> {/* Render the MapViewComponent */}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});