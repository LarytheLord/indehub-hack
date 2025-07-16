import MapViewWeb, { Marker } from '@teovilla/react-native-web-maps';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const MapViewComponent = ({ markers = [], onMarkerPress, userLocation }) => {
  let text = 'Waiting...';
  if (!userLocation) {
    text = 'User location not available.';
  }

  return (
    <View style={styles.container}>
      {userLocation ? (
        <MapViewWeb
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
              title={marker.title}
              description={marker.description}
              pinColor={marker.color}
              onClick={() => onMarkerPress && onMarkerPress(marker)}
            />
          ))}
        </MapViewWeb>
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
