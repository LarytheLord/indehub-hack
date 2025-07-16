// This file will contain your MapView component
// You will use MapView from 'react-native-maps' here.
// Initially, you can set up a basic map view.

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const MapViewComponent = ({ markers = [], onMarkerPress, userLocation }) => {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapViewRef = useRef(null);

  useEffect(() => {
    console.log('MapViewComponent: userLocation prop received:', userLocation);
    if (userLocation && mapViewRef.current) {
      console.log('MapViewComponent: Animating to user location', userLocation);
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      mapViewRef.current.animateToRegion(newRegion, 1000);
    }
  }, [userLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
        onRegionChangeComplete={setRegion}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            description={marker.description}
            pinColor={marker.color}
            onPress={() => onMarkerPress && onMarkerPress(marker)}
          />
        ))}
      </MapView>
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
