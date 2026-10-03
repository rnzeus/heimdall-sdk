# Heimdall SDK — example app

Minimal React Native app to exercise `@rnzeus/heimdall-sdk` against the Heimdall macOS host — on a simulator or a real device signed with a personal team.

The SDK is consumed **from source** (`../src`) via Metro (`metro.config.js`) and TypeScript `paths` (`tsconfig.json`): edit the SDK, reload the app — no build step. `react`, `react-native` and native peers always come from `example/node_modules`.

## Run

```bash
cd example
yarn install
yarn pods        # iOS only: bundle install + pod install
yarn start
yarn ios         # or: yarn android
```

1. Start Heimdall on your Mac and press Start (port `35678`).
2. In the app tap **Connect prompt** and connect. Defaults: `127.0.0.1` (iOS simulator), `10.0.2.2` (Android emulator). On a real device use your Mac's LAN IP.

## Scenarios

- **Network** — GET/POST, 404/500, slow response, large body, unreachable host
- **WebSocket** — echo server: open → send JSON + text → receive → close
- **Zustand** — `early-counter` is created at import time *before* `configureConnectPrompt` (typical consumer order); `late-counter` is created lazily after it

## Real device (iOS)

Open `ios/HeimdallExample.xcworkspace`, select your personal team in *Signing & Capabilities*, run. The first connection triggers the *Local Network* permission dialog (`NSLocalNetworkUsageDescription` is set in `Info.plist`).
