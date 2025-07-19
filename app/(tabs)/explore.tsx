import { Audio } from 'expo-audio';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import MapViewComponent from '../../components/MapView'; // Adjust the path as necessary
import { supabase } from '../../utils/supabase';

// Type for a single echo
interface Echo {
  id: string;
  latitude: number;
  longitude: number;
  audioUrl: string;
  timestamp: string;
  title: string;
  description: string;
  color?: string; // Optional color for map markers
  location_name: string;
}

// Function to calculate distance between two coordinates
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

export default function ExploreScreen() {
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nearbyEchoMessage, setNearbyEchoMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string | null>(null);
  const echoesRef = useRef(echoes);
  echoesRef.current = echoes;

  const fetchEchoes = useCallback(async () => {
    let query = supabase
      .from('echoes')
      .select('id, latitude, longitude, audio_url, created_at');

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching echoes:', error);
    } else if (data) {
      const formattedEchoes: Echo[] = data.map((echo: any) => ({
        id: echo.id,
        latitude: echo.latitude,
        longitude: echo.longitude,
        audioUrl: echo.audio_url,
        timestamp: echo.created_at,
        title: `Echo at ${new Date(echo.created_at).toLocaleTimeString()}`,
        description: 'Listen to this echo!',
        color: 'blue', // Default color
      }));
      setEchoes(formattedEchoes);
    }
  }, [searchQuery]);

  const checkProximity = useCallback((coords: Location.LocationObjectCoords) => {
    const currentEchoes = echoesRef.current;
    let changed = false;
    const updatedEchoes = currentEchoes.map(echo => {
      const distance = getDistance(coords.latitude, coords.longitude, echo.latitude, echo.longitude);
      if (distance < 0.1 && echo.color !== 'red') { // 100 meters
        changed = true;
        setNearbyEchoMessage(`You are near ${echo.title}`);
        return { ...echo, color: 'red' };
      }
      return echo;
    });

    if (changed) {
      setEchoes(updatedEchoes);
    }
  }, []);

  useEffect(() => {
    if (nearbyEchoMessage) {
      const timer = setTimeout(() => {
        setNearbyEchoMessage(null);
      }, 3000); // Message disappears after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [nearbyEchoMessage]);

  useEffect(() => {
    const watchLocation = async () => {
      console.log('Requesting location permissions...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status);

      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        setIsLoading(false);
        return;
      }

      console.log('Location permission granted. Watching position...');
      Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 }, (location) => {
        console.log('User location updated:', location.coords);
        setUserLocation(location.coords);
        checkProximity(location.coords);
        setIsLoading(false);
      });
    };

    watchLocation();
    fetchEchoes();
  }, [fetchEchoes, checkProximity]);

  const playSound = useCallback(async (audioUrl: string) => {
    if (sound) {
      await sound.unloadAsync();
    }
    console.log('Loading Sound');
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl }
      );
      setSound(newSound);

      console.log('Playing Sound');
      await newSound.playAsync();
    } catch (error) {
      console.error("Error playing sound:", error);
      Alert.alert("Playback Error", "Could not play the audio.");
    }
  }, [sound]);

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handleMarkerPress = useCallback((marker: Echo) => {
    if (marker.audioUrl) {
      playSound(marker.audioUrl);
      Alert.alert("Playing Echo", `Now playing echo from ${new Date(marker.timestamp).toLocaleTimeString()}`);
    } else {
      Alert.alert("No Audio", "This echo does not have an audio URL.");
    }
  }, [playSound]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#0000ff" />
      ) : locationPermissionStatus === 'denied' ? (
        <Text style={styles.permissionDeniedText}>Location permission denied. Please enable location services in your device settings to use the map.</Text>
      ) : (
        <>
          <TextInput
            style={styles.searchInput}
            placeholder="Search echoes..."n            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchEchoes} // Trigger search on submit
          />
          <MapViewComponent markers={echoes} onMarkerPress={handleMarkerPress} userLocation={userLocation} />
          {nearbyEchoMessage && (
            <View style={styles.nearbyMessageContainer}>
              <Text style={styles.nearbyMessageText}>{nearbyEchoMessage}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyMessageContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  nearbyMessageText: {
    color: 'white',
    fontSize: 16,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  permissionDeniedText: {
    textAlign: 'center',
    margin: 20,
    fontSize: 16,
    color: 'red',
  },
});

