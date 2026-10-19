# TLS bench

A throwaway bench used to check TLS with certificate pinning between `react-native-tcp-socket` and a Node host before building it into Heimdall. It lives on the `spike/tls` branch only and is never merged.

## Parts

| File | What it is |
|---|---|
| `host.mjs` | Host: TLS or plaintext on one port (by the first byte), token check on the first line, `helloAck`. Serves `http://<ip>:<port+1>/config` (certificate, token, pins) and an impostor TLS host with a foreign certificate on `<port+2>` |
| `client.mjs` | Node client to check the host without a phone |
| `gcd/main.m` | Native macOS client on GCDAsyncSocket (SecureTransport) with the settings `react-native-tcp-socket` uses on iOS |
| `../src/tls-spike.tsx` | Screen in the example app: connect, pin, send load |

Certificates are generated on the first run into `certs-*/` (ignored by git).

## Run

```sh
cd example
node tls-spike/host.mjs                 # RSA-2048 with extensions (works)
node tls-spike/host.mjs --key ec        # ECDSA P-256: getPeerCertificate fails on Android
node tls-spike/host.mjs --bare          # no extensions: SecureTransport fails on iOS

node tls-spike/client.mjs tls           # tls | impostor | badtoken | plain

clang -fobjc-arc -w -Iios/Pods/CocoaAsyncSocket/Source/GCD tls-spike/gcd/main.m \
  ios/Pods/CocoaAsyncSocket/Source/GCD/GCDAsyncSocket.m \
  -framework Foundation -framework Security -framework CFNetwork -o tls-spike/gcd/gcdclient
./tls-spike/gcd/gcdclient 127.0.0.1 35690 tls-spike/certs-rsa/host.pem
```

In the app (`yarn ios` / `yarn android`): type the Mac address (`127.0.0.1` on the iOS simulator, `10.0.2.2` on the Android emulator), press **config**, then **tls**, **impostor**, **bad token**, **plain** and the load buttons. Lines go to the on-screen log and to the console with a `[tls-spike]` prefix.

## Results (2026-10-19, `react-native-tcp-socket` 6.4.3)

iPhone 15 Pro (iOS 26.6.2) and Android emulator: TLS 1.2/1.3, pinning, rejecting the impostor (it receives 0 bytes), `rejected/auth`, plaintext on the same port, 10k × 2 KB and 5 × 5 MB. TLS is as fast as plaintext; the ~3 MB/s ceiling is the React Native bridge.

## Findings

1. **A certificate without extensions breaks SecureTransport.** `@peculiar/x509` writes an empty `[3] SEQUENCE {}` when no extensions are given (invalid DER, OpenSSL tolerates it); iOS aborts the handshake with `errSSLInternal` (alert 80). Always set `basicConstraints CA:FALSE`, `keyUsage digitalSignature`, `extKeyUsage serverAuth`.
2. **iOS ignores `ca`.** In `TcpSocketClient.m` `_checkValidity` is never set to `YES`, so `didReceiveTrust` trusts any certificate. Pin in JS instead: after connecting read `getPeerCertificate().pubkey` and compare before sending anything.
3. **Android `getPeerCertificate()` throws on non-RSA keys** (`getModulus` casts to `RSAPublicKey`). Use an RSA host key; on Android compare `fingerprint256`. Native `ca` pinning works on Android.
4. **`secureConnect` on 6.3.x fires on TCP connect**, before the handshake. Do not treat it as success: poll `getPeerCertificate()` and wait for the host answer.
