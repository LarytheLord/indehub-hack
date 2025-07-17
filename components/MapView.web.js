import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const libraries = ['places'];

const MapViewComponent = ({ markers = [], onMarkerPress, userLocation }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY, // Ensure your API key is set in environment variables
    libraries,
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  if (loadError) {
    return <Text>Error loading maps</Text>;
  }

  if (!isLoaded) {
    return <Text>Loading Maps...</Text>;
  }

  let text = 'Waiting...';
  if (!userLocation) {
    text = 'User location not available.';
  }

  return (
    <View style={styles.container}>
      {userLocation ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={{
            lat: userLocation.latitude,
            lng: userLocation.longitude,
          }}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={{
                lat: marker.latitude,
                lng: marker.longitude,
              }}
              title={marker.title}
              onClick={() => onMarkerPress && onMarkerPress(marker)}
            />
          ))}
        </GoogleMap>
      ) : (
        <Text>{text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default MapViewComponent;
