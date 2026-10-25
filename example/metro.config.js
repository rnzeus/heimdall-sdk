const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withHeimdall } = require('../metro/index.cjs');
const { writeCloudUrl } = require('./scripts/cloud-url.cjs');

console.log(`heimdall-cloud: ${writeCloudUrl()}`);

const sdkRoot = path.resolve(__dirname, '..');
const exampleEntry = path.join(__dirname, 'index.js');

const SDK_ALIASES = {
  '@rnzeus/heimdall-sdk': path.join(sdkRoot, 'src/index.ts'),
  '@rnzeus/heimdall-sdk/zustand': path.join(sdkRoot, 'src/zustand/index.ts'),
};

// SDK is consumed from source: react and native peers must come from example/node_modules only,
// otherwise sdk devDependencies (react 18, react-native 0.79) leak into the bundle.
const EXAMPLE_OWNED = [
  'react',
  'react-native',
  'react-native-mmkv',
  'react-native-nitro-modules',
  'react-native-tcp-socket',
  'zustand',
];

const isExampleOwned = moduleName =>
  EXAMPLE_OWNED.some(name => moduleName === name || moduleName.startsWith(`${name}/`));

const escape = value => value.replace(/[/\\^$.*+?()[\]{}|-]/g, '\\$&');

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  watchFolders: [sdkRoot],
  resolver: {
    blockList: EXAMPLE_OWNED.map(
      name => new RegExp(`^${escape(path.join(sdkRoot, 'node_modules', name))}\\/.*$`),
    ),
    nodeModulesPaths: [path.join(__dirname, 'node_modules'), path.join(sdkRoot, 'node_modules')],
    resolveRequest: (context, moduleName, platform) => {
      if (SDK_ALIASES[moduleName]) {
        return { type: 'sourceFile', filePath: SDK_ALIASES[moduleName] };
      }
      if (isExampleOwned(moduleName)) {
        return context.resolveRequest({ ...context, originModulePath: exampleEntry }, moduleName, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = withHeimdall(mergeConfig(getDefaultConfig(__dirname), config), {
  include: process.env.APP_ENV !== 'production',
});
