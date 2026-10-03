import { configureConnectPrompt } from '@rnzeus/heimdall-sdk';
import { Platform } from 'react-native';

const HOST = Platform.select({ android: '10.0.2.2', default: '127.0.0.1' });
const CLOUD_URL = Platform.select({ android: 'http://10.0.2.2:8787', default: 'http://localhost:8787' });

export function setupHeimdall() {
  configureConnectPrompt({
    host: HOST,
    port: 35678,
    platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'other',
    deviceName: 'Heimdall Example',
    appId: 'dev.rnzeus.heimdall.example',
    captureEarlyEvents: true,
    keepAlive: true,
    cloud: { url: CLOUD_URL },
  });
}
