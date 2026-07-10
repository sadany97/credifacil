const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.transformer = {
  ...config.transformer,
  minifierPath: undefined,
  minifierConfig: undefined,
};
module.exports = config;
