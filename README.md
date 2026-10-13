# Heimdall SDK

React Native client for **Heimdall** — a desktop debug inspector for dev and stage builds. The SDK streams what your app is doing to the Heimdall desktop app over your local network:

- **Network** — every XHR / `fetch` request with headers, bodies, status and timing
- **WebSocket** — open, messages in both directions, close
- **Zustand** — state snapshots per store, with the action that caused them
- **Console** — `console.*`, uncaught JS errors and unhandled promise rejections
- **App and device info** — version, build, environment, OS, model

![Heimdall desktop app: network inspector](https://heimdall.rnzeus.dev/readme/network.png)

It is built for development and stage builds only and is off by default in production.

## Requirements

| Package | Version | |
|---|---|---|
| `react-native` | `>=0.72` | |
| `react` | `>=18` | |
| `react-native-tcp-socket` | `>=6` | transport |
| `react-native-mmkv` | `>=3` | remembers the last connection |
| `zustand` | `>=3` | optional, only for the Zustand middleware |

`react-native-tcp-socket` and `react-native-mmkv` are native modules. With Expo you need a [development build](https://docs.expo.dev/develop/development-builds/introduction/) — Expo Go will not work.

## Install

```sh
yarn add @rnzeus/heimdall-sdk react-native-tcp-socket react-native-mmkv
cd ios && pod install
```

You also need the Heimdall desktop app for macOS or Windows — [download it here](https://heimdall.rnzeus.dev/download).

## Quick start

**1. Configure once, as early as possible** (for example in `index.js`):

```ts
import { configureConnectPrompt } from "@rnzeus/heimdall-sdk";
import { Platform } from "react-native";

configureConnectPrompt({
  host: Platform.select({ android: "10.0.2.2", default: "127.0.0.1" }),
  port: 35678,
  appId: "com.example.app",
  captureEarlyEvents: true,
  keepAlive: true,
});
```

**2. Mount the connect prompt** at the root of your app:

```tsx
import { HeimdallConnectPrompt } from "@rnzeus/heimdall-sdk";

export function App() {
  return (
    <>
      <RootNavigator />
      <HeimdallConnectPrompt />
    </>
  );
}
```

**3. Open it** from anywhere — a dev menu item, a hidden gesture, a button:

```ts
import { showSDKConnectPrompt } from "@rnzeus/heimdall-sdk";

showSDKConnectPrompt();
```

**4. Connect.** Start the server in Heimdall, copy the channel it shows (`heimdall://…`) into the prompt and connect.

Host to use:

| Where the app runs | Host |
|---|---|
| iOS simulator | `127.0.0.1` |
| Android emulator | `10.0.2.2` |
| Real device | LAN IP of the machine running Heimdall |

On a real iOS device the first connection triggers the Local Network permission dialog, so `NSLocalNetworkUsageDescription` must be set in `Info.plist`.

## Zustand

Wrap a store creator with the middleware and give the store a name:

```ts
import { create } from "zustand";
import { heimdallZustand } from "@rnzeus/heimdall-sdk/zustand";

export const useCart = create(
  heimdallZustand("cart", (set) => ({
    items: [],
    add: (item) => set((state) => ({ items: [...state.items, item] })),
  }))
);
```

Heimdall receives a snapshot on every change, tagged with the name of the store action that triggered it, and highlights what changed. When the SDK is disabled the middleware returns your creator untouched.

![Zustand inspector: changed fields highlighted](https://heimdall.rnzeus.dev/readme/zustand.png)

## Recorded sessions

Heimdall can record everything it receives and save it as a single `.edda` file. A tester attaches the file to a bug report; a developer opens it and sees the network, WebSocket, state and console events on one timeline, exactly as they happened.

![A recorded session opened on the timeline](https://heimdall.rnzeus.dev/readme/session.png)

Tokens, cookies and passwords can be masked on export, so the file is safe to pass around.

![Export dialog with masking of sensitive data](https://heimdall.rnzeus.dev/readme/export.png)

Recording and playback live in the desktop app — nothing extra is needed in your code.

## Without the prompt

```ts
import { connect, disconnect } from "@rnzeus/heimdall-sdk";

connect({ host: "127.0.0.1", port: 35678, channel: "heimdall://my-app-x7k2p9" });

disconnect();
```

## Options

`configureConnectPrompt` takes everything below except `channel`; `connect` takes all of it.

| Option | Type | Default | |
|---|---|---|---|
| `host` | `string` | — | where Heimdall is running |
| `port` | `number` | — | Heimdall listens on `35678` by default |
| `channel` | `string` | — | `heimdall://…` channel shown in Heimdall |
| `enabled` | `boolean` | `__DEV__` | set `true` explicitly to use the SDK in a stage build |
| `platform` | `"ios" \| "android" \| "macos" \| "windows" \| "other"` | — | |
| `deviceName` | `string` | — | name shown in Heimdall |
| `appId` | `string` | — | bundle id or any identifier |
| `app` | `{ version?, build?, environment? }` | — | app details shown in Heimdall |
| `allowedHosts` | `(string \| RegExp)[]` | — | capture only these hosts |
| `ignoreUrls` | `(string \| RegExp)[]` | — | skip by full URL or path |
| `captureEarlyEvents` | `boolean` | `false` | buffer events that happen before the connection is up |
| `keepAlive` | `boolean` | `false` | reconnect to the last channel on app start |
| `captureConsole` | `boolean` | `true` | console, uncaught errors, unhandled rejections |
| `cloud` | `{ url: string }` | — | optional, see [Connecting without typing an address](#connecting-without-typing-an-address) |

`<HeimdallConnectPrompt />` accepts `onCopyToClipboard?: (text: string) => void` to plug in your clipboard library.

## Connecting without typing an address

By default you copy the host and the channel into the prompt by hand. Heimdall Cloud removes that step for testers: a device is linked to an account once, and after that the app finds the desktop on its own.

```ts
configureConnectPrompt({
  // ...
  cloud: { url: "https://heimdall.rnzeus.dev" },
});
```

With `cloud` set, the prompt gets a second mode:

1. **Find me** opens a browser page where the tester signs in and picks (or creates) a device. This is done once per device.
2. In the desktop app the tester signs in to the same account and starts the server for that device.
3. **Connect** in the prompt asks the cloud where that desktop is and connects to it directly.

The cloud only stores accounts, devices and the current address of the desktop. Captured traffic never goes through it. Without `cloud` the prompt works in manual mode only.

## Production safety

- `enabled` defaults to `__DEV__`. In a release build the SDK does nothing unless you pass `enabled: true`.
- When disabled there are no patches, no sockets and no subscriptions.
- Patches are transparent: original behaviour and return values are preserved, and SDK errors never reach your app.
- Payloads are capped: JSON bodies at 500 KB, text at 200 KB, everything else at 50 KB, console messages at 8 KB.

## Your data

- Events go **directly** from the app to the Heimdall desktop app over TCP on your network. Nothing is sent to us or to any third party.
- Headers and bodies are sent **as they are**, including auth tokens. Use the SDK in dev and stage builds, and narrow the capture with `allowedHosts` / `ignoreUrls` where needed.
- `cloud` is optional and never sees captured traffic — see [Connecting without typing an address](#connecting-without-typing-an-address).

## Testing with Jest

The SDK ships as ES modules, and Jest does not transform `node_modules` by default. Add the package to `transformIgnorePatterns`:

```js
// jest.config.js
module.exports = {
  preset: "react-native",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|@rnzeus/heimdall-sdk)/)",
  ],
};
```

`react-native-tcp-socket` is a native module, so mock it in your Jest setup file:

```js
jest.mock("react-native-tcp-socket", () => ({ createConnection: jest.fn() }));
```

## Example app

[`example/`](./example) is a minimal React Native app with ready-made network, WebSocket, Zustand and console scenarios.

## License

MIT
