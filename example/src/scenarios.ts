const JSON_API = 'https://jsonplaceholder.typicode.com';
const HTTPBIN = 'https://httpbin.org';
const ECHO_WS = 'wss://echo.websocket.org';

type Log = (line: string) => void;

const request = async ({ label, url, init, log }: { label: string; url: string; init?: RequestInit; log: Log }) => {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, init);
    await response.text();
    log(`${label}: ${response.status} in ${Date.now() - startedAt}ms`);
  } catch (error) {
    log(`${label}: failed — ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const NETWORK_SCENARIOS: { title: string; run: (log: Log) => Promise<void> }[] = [
  { title: 'GET 200', run: log => request({ label: 'GET 200', url: `${JSON_API}/todos/1`, log }) },
  {
    title: 'POST JSON',
    run: log =>
      request({
        label: 'POST JSON',
        url: `${JSON_API}/posts`,
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'heimdall', body: 'example', userId: 1 }),
        },
        log,
      }),
  },
  {
    title: 'Auth headers',
    run: log =>
      request({
        label: 'Auth headers',
        url: `${HTTPBIN}/headers?token=example-query-token&page=1`,
        init: {
          headers: {
            Authorization: 'Bearer example-access-token',
            'X-Api-Key': 'example-api-key',
            Cookie: 'session=example-session-cookie',
          },
        },
        log,
      }),
  },
  { title: 'GET 404', run: log => request({ label: 'GET 404', url: `${HTTPBIN}/status/404`, log }) },
  { title: 'GET 500', run: log => request({ label: 'GET 500', url: `${HTTPBIN}/status/500`, log }) },
  { title: 'Slow 3s', run: log => request({ label: 'Slow 3s', url: `${HTTPBIN}/delay/3`, log }) },
  { title: 'Large body', run: log => request({ label: 'Large body', url: `${JSON_API}/photos`, log }) },
  {
    title: 'Unreachable host',
    run: log => request({ label: 'Unreachable host', url: 'https://heimdall-example.invalid/', log }),
  },
];

export function runWebSocketScenario(log: Log) {
  const socket = new WebSocket(ECHO_WS);
  let sent = 0;

  socket.onopen = () => {
    log('WS: open');
    socket.send(JSON.stringify({ hello: 'heimdall', n: ++sent }));
    socket.send('plain text frame');
  };
  socket.onmessage = event => {
    log(`WS: message ${String(event.data).slice(0, 40)}`);
    if (sent === 1) {
      sent++;
      setTimeout(() => socket.close(1000, 'example done'), 500);
    }
  };
  socket.onerror = () => log('WS: error');
  socket.onclose = event => log(`WS: close ${event.code}`);
}
