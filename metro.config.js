const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  'react-native-maps': require.resolve('@teovilla/react-native-web-maps'),
};

module.exports = config;