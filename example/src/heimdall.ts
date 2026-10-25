import { configureConnectPrompt } from '@rnzeus/heimdall-sdk';
import { Platform } from 'react-native';

// Production heimdall-cloud, or the local one with HEIMDALL_CLOUD=local (see scripts/cloud-url.cjs)
import { CLOUD_URL } from './cloud-url.generated';

const HOST = Platform.select({ android: '10.0.2.2', default: '127.0.0.1' });

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
    app: { version: '1.0.0', build: '1', environment: 'example' },
  });
}
