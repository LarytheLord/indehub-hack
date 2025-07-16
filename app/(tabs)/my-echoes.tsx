
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../utils/supabase';

interface Echo {
  id: string;
  anonymous_user_id: string;
  latitude: number;
  longitude: number;
  audio_url: string;
  created_at: string;
}

export default function MyEchoesScreen() {
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEchoes();
  }, []);

  const fetchEchoes = async () => {
    setIsLoading(true);
    const anonymousUserId = await AsyncStorage.getItem('anonymousUserId');
    if (!anonymousUserId) {
      Alert.alert('User ID not found', 'Anonymous user ID not found. Please restart the app.');
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('echoes')
      .select('*')
      .eq('anonymous_user_id', anonymousUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching echoes:', error);
      Alert.alert('Error', 'Failed to fetch your echoes.');
    } else {
      setEchoes(data as Echo[]);
    }
    setIsLoading(false);
  };

  async function playSound(audioUrl: string) {
    try {
      console.log('Loading Sound');
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(sound);

      console.log('Playing Sound');
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert('Playback Error', 'Could not play the echo. Please try again.');
    }
  }

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const renderItem = ({ item }: { item: Echo }) => (
    <View style={styles.item}>
      <Text>Echo recorded at:</Text>
      <Text>Lat: {item.latitude.toFixed(4)}, Lon: {item.longitude.toFixed(4)}</Text>
      <Text>Time: {new Date(item.created_at).toLocaleString()}</Text>
      <Button title="Play" onPress={() => playSound(item.audio_url)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Echoes</Text>
      <Button title="Refresh" onPress={fetchEchoes} disabled={isLoading} />
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : echoes.length === 0 ? (
        <Text style={styles.noEchoesText}>You haven't recorded any echoes yet.</Text>
      ) : (
        <FlatList
          data={echoes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onRefresh={fetchEchoes}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  noEchoesText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
