# Heimdall SDK Debug Logging

## Usage

Enable debug logging for specific modules by setting the global debug config:

### Browser Console / React Native Debugger

```javascript
// Enable both WebSocket and Network debug logs
globalThis.__HEIMDALL_SDK_DEBUG__ = { ws: true, network: true };

// Enable only WebSocket debug logs
globalThis.__HEIMDALL_SDK_DEBUG__ = { ws: true, network: false };

// Enable only Network debug logs
globalThis.__HEIMDALL_SDK_DEBUG__ = { ws: false, network: true };

// Disable all debug logs
globalThis.__HEIMDALL_SDK_DEBUG__ = { ws: false, network: false };
// or
delete globalThis.__HEIMDALL_SDK_DEBUG__;
```

### What Gets Logged

**WebSocket (`ws: true`):**

- `patchWebSocket called` - when patch is applied
- `WebSocket patching in progress...` - patching started
- `WebSocket patched successfully` - patching completed
- `attach connectionId=... url=...` - new WebSocket connection
- `open connectionId=...` - connection opened
- `close connectionId=... code=... reason=...` - connection closed
- `error connectionId=... msg=...` - connection error
- `frame(in/out) connectionId=... bytes=... data=...` - incoming/outgoing frames (detailed)
- `sendEvent: [kind] connectionId=...` - when event is sent to Heimdall

**Network (`network: true`):**

- `patchXHR called, allowedHosts=... ignoreUrls=...` - when patch is applied
- `XHR interceptor enabled successfully` - patching completed
- `sendEvent: [METHOD] [URL] status=... ok=...` - when network event is sent to Heimdall

## Example Output

```
[Heimdall][ws] patchWebSocket called, allowedHosts=["example.com"], ignoreUrls=[]
[Heimdall][ws] WebSocket patching in progress...
[Heimdall][ws] WebSocket patched successfully
[Heimdall][ws] attach connectionId=abc123 url=wss://example.com/ws
[Heimdall][ws] open connectionId=abc123
[Heimdall][ws] sendEvent: open connectionId=abc123 url=wss://example.com/ws
[Heimdall][ws] frame(in) connectionId=abc123 bytes=123 truncated=false ct=application/json data={"type":"hello"}
[Heimdall][ws] sendEvent: frame(in) connectionId=abc123 bytes=123

[Heimdall][network] patchXHR called, allowedHosts=["api.example.com"], ignoreUrls=[]
[Heimdall][network] XHR interceptor enabled successfully
[Heimdall][network] sendEvent: GET https://api.example.com/users status=200 ok=true
```

## Notes

- Debug logs are **only** printed when the respective module is enabled
- All logs are prefixed with `[Heimdall][module]` for easy filtering
- The debug system is safe for production - it checks `globalThis.__HEIMDALL_SDK_DEBUG__` at runtime
- Setting the debug config to `undefined` or `{}` disables all debug logs
