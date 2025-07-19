
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-audio';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Platform, StyleSheet, Text, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../utils/supabase';

export default function RecordEchoScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
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
      if (Platform.OS !== 'web') {
        const { status: audioStatus } = await Audio.requestPermissionsAsync();
        if (audioStatus !== 'granted') {
          setErrorMsg('Permission to access microphone is required!');
          return;
        }
      }

      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
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
      setErrorMsg('Failed to start recording');
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
    setErrorMsg(null);

    try {
      const anonymousUserId = await AsyncStorage.getItem('anonymousUserId');
      if (!anonymousUserId) {
        throw new Error('Anonymous user ID not found. Please restart the app.');
      }

      const response = await fetch(recordingUri);
      if (!response.ok) {
        throw new Error('Failed to fetch recording data.');
      }
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
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage.from('echoes').getPublicUrl(filePath);
      if (!publicUrlData) {
        throw new Error('Failed to get public URL.');
      }
      const publicUrl = publicUrlData.publicUrl;
      console.log('Public URL generated:', publicUrl);

      const { error: insertError } = await supabase.from('echoes').insert([
        {
          anonymous_user_id: anonymousUserId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          audio_url: publicUrl,
        },
      ]);

      if (insertError) {
        throw new Error(`Failed to save echo metadata: ${insertError.message}`);
      }

      Alert.alert('Success', 'Your echo has been saved!');
      handleRecordAgain(); // Reset the screen
    } catch (error) {
      console.error('Failed to save echo', error);
      setErrorMsg(error.message || 'An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recording is not available on the web.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Echo</Text>
      <Text style={[styles.timerText, isRecording && styles.recordingTimer]}>
        {formatDuration(recordingDuration)}
      </Text>

      <View style={styles.buttonContainer}>
        {!isRecording && !recordingUri ? (
          <Button title="Record" onPress={startRecording} disabled={isUploading} />
        ) : isRecording ? (
          <Button title="Stop" onPress={stopRecording} disabled={isUploading} />
        ) : null}

        {recordingUri && (
          <View style={styles.buttonRow}>
            <Button title="Replay" onPress={playSound} disabled={isUploading || isRecording} />
            <Button title="Submit" onPress={saveEcho} disabled={isUploading || isRecording} />
            <Button
              title="Record Again"
              onPress={handleRecordAgain}
              disabled={isUploading || isRecording}
            />
          </View>
        )}
      </View>

      {isUploading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Uploading your echo...</Text>
        </View>
      )}
      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#333',
  },
  recordingTimer: {
    color: 'red',
  },
  buttonContainer: {
    marginTop: 20,
    width: '80%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    color: 'red',
  },
});
