import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';
import { setupHeimdall } from './src/heimdall';

// Called after imports on purpose: stores created at import time reproduce the typical consumer order.
setupHeimdall();

AppRegistry.registerComponent(appName, () => App);
