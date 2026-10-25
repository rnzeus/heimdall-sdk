module.exports = {
  // The example builds the SDK from its sources, outside node_modules, so React Native warns about the SDK's
  // deep imports as if they were the app's own; apps that install the SDK never see this warning.
  presets: [['module:@react-native/babel-preset', {disableDeepImportWarnings: true}]],
};
