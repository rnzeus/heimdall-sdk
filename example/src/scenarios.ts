const JSON_API = 'https://jsonplaceholder.typicode.com';
const HTTPBIN = 'https://httpbin.org';
const GRAPHQL_API = 'https://countries.trevorblades.com/';
const ECHO_WS = 'wss://echo.websocket.org';
const UNREACHABLE_HOST = 'heimdall-example.invalid';

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

const requestMany = async ({ label, urls, log }: { label: string; urls: string[]; log: Log }) => {
  const startedAt = Date.now();
  const results = await Promise.allSettled(urls.map(url => fetch(url).then(response => response.text())));
  const failed = results.filter(result => result.status === 'rejected').length;
  log(`${label}: ${urls.length - failed}/${urls.length} ok in ${Date.now() - startedAt}ms`);
};

const xhrWithTimeout = ({ label, url, timeoutMs, log }: { label: string; url: string; timeoutMs: number; log: Log }) =>
  new Promise<void>(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.timeout = timeoutMs;
    xhr.onload = () => {
      log(`${label}: ${xhr.status}`);
      resolve();
    };
    xhr.ontimeout = () => {
      log(`${label}: timed out after ${timeoutMs}ms`);
      resolve();
    };
    xhr.onerror = () => {
      log(`${label}: error`);
      resolve();
    };
    xhr.send();
  });

const multipartBody = () => {
  const form = new FormData();
  form.append('title', 'heimdall');
  form.append('note', 'multipart example');
  return form;
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
    title: 'PUT',
    run: log =>
      request({
        label: 'PUT',
        url: `${JSON_API}/posts/1`,
        init: {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 1, title: 'replaced', body: 'example', userId: 1 }),
        },
        log,
      }),
  },
  {
    title: 'PATCH',
    run: log =>
      request({
        label: 'PATCH',
        url: `${JSON_API}/posts/1`,
        init: {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'patched' }),
        },
        log,
      }),
  },
  {
    title: 'DELETE',
    run: log => request({ label: 'DELETE', url: `${JSON_API}/posts/1`, init: { method: 'DELETE' }, log }),
  },
  {
    title: 'Form urlencoded',
    run: log =>
      request({
        label: 'Form urlencoded',
        url: `${HTTPBIN}/post`,
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'name=heimdall&kind=example&tags=a&tags=b',
        },
        log,
      }),
  },
  {
    title: 'Multipart form',
    run: log =>
      request({
        label: 'Multipart form',
        url: `${HTTPBIN}/post`,
        init: { method: 'POST', body: multipartBody() },
        log,
      }),
  },
  {
    title: 'GraphQL',
    run: log =>
      request({
        label: 'GraphQL',
        url: GRAPHQL_API,
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operationName: 'Country',
            query: 'query Country($code: ID!) { country(code: $code) { name capital currency } }',
            variables: { code: 'GB' },
          }),
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
  { title: 'Redirect ×2', run: log => request({ label: 'Redirect ×2', url: `${HTTPBIN}/redirect/2`, log }) },
  { title: 'GET 204', run: log => request({ label: 'GET 204', url: `${HTTPBIN}/status/204`, log }) },
  { title: 'GET 401', run: log => request({ label: 'GET 401', url: `${HTTPBIN}/status/401`, log }) },
  { title: 'GET 404', run: log => request({ label: 'GET 404', url: `${HTTPBIN}/status/404`, log }) },
  { title: 'GET 500', run: log => request({ label: 'GET 500', url: `${HTTPBIN}/status/500`, log }) },
  { title: 'HTML', run: log => request({ label: 'HTML', url: `${HTTPBIN}/html`, log }) },
  { title: 'XML', run: log => request({ label: 'XML', url: `${HTTPBIN}/xml`, log }) },
  { title: 'Image', run: log => request({ label: 'Image', url: `${HTTPBIN}/image/png`, log }) },
  { title: 'Slow 3s', run: log => request({ label: 'Slow 3s', url: `${HTTPBIN}/delay/3`, log }) },
  { title: 'Large body', run: log => request({ label: 'Large body', url: `${JSON_API}/photos`, log }) },
  {
    title: 'Abort after 300ms',
    run: log => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 300);
      return request({
        label: 'Abort after 300ms',
        url: `${HTTPBIN}/delay/3`,
        init: { signal: controller.signal },
        log,
      });
    },
  },
  {
    title: 'XHR timeout 1s',
    run: log => xhrWithTimeout({ label: 'XHR timeout 1s', url: `${HTTPBIN}/delay/5`, timeoutMs: 1000, log }),
  },
  {
    title: 'XHR 200, timeout set',
    run: log => xhrWithTimeout({ label: 'XHR 200, timeout set', url: `${JSON_API}/todos/1`, timeoutMs: 10000, log }),
  },
  {
    title: 'Parallel ×20',
    run: log =>
      requestMany({
        label: 'Parallel ×20',
        urls: Array.from({ length: 20 }, (_, index) => `${JSON_API}/todos/${index + 1}`),
        log,
      }),
  },
  {
    title: 'Same request ×5',
    run: async log => {
      for (let i = 1; i <= 5; i++) {
        await request({ label: `Same request ${i}/5`, url: `${JSON_API}/users/1`, log });
      }
    },
  },
  {
    title: 'Unreachable host',
    run: log => request({ label: 'Unreachable host', url: `https://${UNREACHABLE_HOST}/`, log }),
  },
];

export async function runAllNetworkScenarios(log: Log) {
  for (const scenario of NETWORK_SCENARIOS) {
    await scenario.run(log);
  }
  log('All network scenarios finished');
}

const describeFrame = (data: unknown) => (typeof data === 'string' ? data.slice(0, 40) : '[binary]');

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

let liveSocket: WebSocket | null = null;
let liveSent = 0;

const withLiveSocket = ({ log, run }: { log: Log; run: (socket: WebSocket) => void }) => {
  if (!liveSocket || liveSocket.readyState !== WebSocket.OPEN) {
    log('WS live: not open — tap "Live: open" first');
    return;
  }
  run(liveSocket);
};

export const WEBSOCKET_SCENARIOS: { title: string; run: (log: Log) => void }[] = [
  { title: 'Echo open → send → close', run: runWebSocketScenario },
  {
    title: 'Live: open',
    run: log => {
      if (liveSocket) {
        log('WS live: already open');
        return;
      }
      const socket = new WebSocket(ECHO_WS);
      liveSocket = socket;
      socket.onopen = () => log('WS live: open');
      socket.onmessage = event => log(`WS live: message ${describeFrame(event.data)}`);
      socket.onerror = () => log('WS live: error');
      socket.onclose = event => {
        log(`WS live: close ${event.code}`);
        if (liveSocket === socket) liveSocket = null;
      };
    },
  },
  {
    title: 'Live: send JSON',
    run: log =>
      withLiveSocket({
        log,
        run: socket => {
          socket.send(JSON.stringify({ type: 'ping', n: ++liveSent, at: Date.now() }));
          log(`WS live: sent JSON #${liveSent}`);
        },
      }),
  },
  {
    title: 'Live: send binary',
    run: log =>
      withLiveSocket({
        log,
        run: socket => {
          socket.send(new Uint8Array([72, 69, 73, 77, 68, 65, 76, 76]).buffer);
          log('WS live: sent 8 bytes');
        },
      }),
  },
  {
    title: 'Live: close',
    run: log => withLiveSocket({ log, run: socket => socket.close(1000, 'closed by user') }),
  },
  {
    title: '3 sockets at once',
    run: log => {
      for (let n = 1; n <= 3; n++) {
        const socket = new WebSocket(ECHO_WS);
        socket.onopen = () => socket.send(`socket ${n} says hi`);
        socket.onmessage = event => {
          if (String(event.data).startsWith('socket')) {
            log(`WS #${n}: echo received`);
            socket.close(1000, 'example done');
          }
        };
        socket.onerror = () => log(`WS #${n}: error`);
      }
    },
  },
  {
    title: 'Unreachable host',
    run: log => {
      const socket = new WebSocket(`wss://${UNREACHABLE_HOST}`);
      socket.onerror = () => log('WS unreachable: error');
      socket.onclose = event => log(`WS unreachable: close ${event.code}`);
    },
  },
];

const circular = () => {
  const node: Record<string, unknown> = { id: 'root', children: [] };
  node.self = node;
  return node;
};

export const CONSOLE_SCENARIOS: { title: string; run: (log: Log) => void }[] = [
  {
    title: 'console.log object',
    run: log => {
      console.log('cart loaded', { items: [{ id: 1, qty: 2 }], total: 42, user: { id: 'u1' } });
      log('console.log sent');
    },
  },
  {
    title: 'console.info',
    run: log => {
      console.info('Feature flags loaded', { newCheckout: true, darkMode: false });
      log('console.info sent');
    },
  },
  {
    title: 'console.debug',
    run: log => {
      console.debug('render', { component: 'Checkout', ms: 12.4 });
      log('console.debug sent');
    },
  },
  {
    title: 'console.warn',
    run: log => {
      console.warn('Deprecated prop "foo" used in Checkout');
      log('console.warn sent');
    },
  },
  {
    title: 'console.error Error',
    run: log => {
      console.error('Payment failed', new Error('Card declined'));
      log('console.error sent');
    },
  },
  {
    title: 'Long message 20 KB',
    run: log => {
      console.log('x'.repeat(20 * 1024));
      log('20 KB console.log sent');
    },
  },
  {
    title: 'Circular object',
    run: log => {
      console.log('circular', circular());
      log('circular object sent');
    },
  },
  {
    title: 'Burst ×300',
    run: log => {
      for (let i = 0; i < 300; i++) console.log(`burst ${i}`);
      log('300 console.log sent');
    },
  },
  {
    title: 'Unhandled rejection',
    run: log => {
      Promise.reject(new Error('Example rejection'));
      log('rejected a promise');
    },
  },
  {
    title: 'Uncaught error',
    run: log => {
      log('throwing in a timer');
      setTimeout(() => {
        throw new Error('Example uncaught error');
      }, 0);
    },
  },
];
