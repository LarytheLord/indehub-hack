
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
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

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
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
        console.log('Requesting permission..');
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      intervalRef.current = setInterval(() => {
        setRecordingDuration((prevDuration) => prevDuration + 1);
      }, 1000);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      setRecordingUri(uri);
      setIsRecording(false);
      setRecording(null);
    }
  }

  async function saveEcho() {
    if (!recordingUri) {
      Alert.alert('No recording', 'Please record an echo first.');
      return;
    }

    if (!location) {
      Alert.alert('Location not available', 'Cannot save echo without location data.');
      return;
    }

    setIsUploading(true);

    try {
      const anonymousUserId = await AsyncStorage.getItem('anonymousUserId');
      if (!anonymousUserId) {
        Alert.alert('User ID not found', 'Anonymous user ID not found. Please restart the app.');
        setIsUploading(false);
        return;
      }

      const fileExtension = recordingUri.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${anonymousUserId}/${fileName}`;

      const response = await fetch(recordingUri);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('echoes')
        .upload(filePath, blob, {
          contentType: `audio/${fileExtension}`,
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading audio:', uploadError);
        Alert.alert('Upload Failed', 'Failed to upload audio. Please try again.');
        setIsUploading(false);
        return;
      }

      const publicUrl = supabase.storage
        .from('echoes')
        .getPublicUrl(filePath).data.publicUrl;

      const { data, error: insertError } = await supabase
        .from('echoes')
        .insert([
          {
            anonymous_user_id: anonymousUserId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            audio_url: publicUrl,
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        console.error('Error inserting echo metadata:', insertError);
        Alert.alert('Save Failed', 'Failed to save echo metadata. Please try again.');
      } else {
        Alert.alert('Echo Saved!', 'Your echo has been successfully saved.');
        console.log('Echo saved successfully:', data);
        setRecordingUri(null);
        setRecordingDuration(0);
      }
    } catch (error) {
      console.error('Failed to save echo', error);
      Alert.alert('Error', 'An unexpected error occurred while saving the echo.');
    }
    setIsUploading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Echo</Text>
      {isRecording && <Text style={styles.timerText}>{formatDuration(recordingDuration)}</Text>}
      <View style={styles.buttonContainer}>
        <Button
          title={isRecording ? 'Stop' : 'Record'}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isUploading}
        />
        {recordingUri && (
          <Button title="Save" onPress={saveEcho} disabled={isUploading} />
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginTop: 20,
  },
  timerText: {
    fontSize: 30,
    fontWeight: 'bold',
    marginVertical: 20,
  },
});
