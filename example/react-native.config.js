const production = process.env.APP_ENV === 'production';

module.exports = {
  dependencies: production
    ? { 'react-native-tcp-socket': { platforms: { ios: null, android: null } } }
    : {},
};
