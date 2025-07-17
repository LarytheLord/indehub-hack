
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-audio';
import * as Location from 'expo-location';
import React, { useEffect, useState, useRef } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../utils/supabase';

export default function RecordEchoScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  async function startRecording() {
    try {
      if (permissionResponse && permissionResponse.status !== 'granted') {
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);

      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
      setRecording(null);
    }
  }

  async function playSound() {
    if (recordingUri) {
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(sound);
      await sound.playAsync();
    }
  }

  function handleRecordAgain() {
    setRecordingUri(null);
    setRecordingDuration(0);
  }

  async function saveEcho() {
    if (!recordingUri || !location) {
      Alert.alert('Error', 'No recording or location data available.');
      return;
    }

    setIsUploading(true);

    try {
      const anonymousUserId = await AsyncStorage.getItem('anonymousUserId');
      if (!anonymousUserId) {
        Alert.alert('Error', 'Anonymous user ID not found.');
        setIsUploading(false);
        return;
      }

      const response = await fetch(recordingUri);
      const blob = await response.blob();
      const fileExtension = recordingUri.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${anonymousUserId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('echoes')
        .upload(filePath, blob, {
          contentType: `audio/${fileExtension}`,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const publicUrl = supabase.storage.from('echoes').getPublicUrl(filePath).data.publicUrl;

      const { error: insertError } = await supabase.from('echoes').insert([
        {
          anonymous_user_id: anonymousUserId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          audio_url: publicUrl,
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      Alert.alert('Success', 'Your echo has been saved!');
      handleRecordAgain(); // Reset the screen
    } catch (error) {
      console.error('Failed to save echo', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Echo</Text>
      <Text style={styles.timerText}>{formatDuration(recordingDuration)}</Text>

      <View style={styles.buttonContainer}>
        {!isRecording && !recordingUri ? (
          <Button title="Record" onPress={startRecording} />
        ) : isRecording ? (
          <Button title="Stop" onPress={stopRecording} />
        ) : null}

        {recordingUri && (
          <View style={styles.buttonRow}>
            <Button title="Replay" onPress={playSound} disabled={isUploading} />
            <Button title="Submit" onPress={saveEcho} disabled={isUploading} />
            <Button title="Record Again" onPress={handleRecordAgain} disabled={isUploading} />
          </View>
        )}
      </View>

      {isUploading && <Text>Uploading...</Text>}
      {errorMsg && <Text>{errorMsg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 40,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
});
