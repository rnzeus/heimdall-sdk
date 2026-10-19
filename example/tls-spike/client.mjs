import { connect as connectTcp } from 'node:net';
import { connect as connectTls } from 'node:tls';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    port: { type: 'string', default: '35690' },
    count: { type: 'string', default: '10000' },
    size: { type: 'string', default: '2000' },
  },
});
const kase = positionals[0] ?? 'tls';
const PORT = Number(values.port);
const COUNT = Number(values.count);
const SIZE = Number(values.size);

const config = await (
  await fetch(`http://127.0.0.1:${PORT + 1}/config`)
).json();

const hello = {
  kind: 'hello',
  v: 1,
  channel: 'heimdall://local-tls-spike',
  clientId: 'node',
  sessionId: 'node',
  sdkVersion: 'tls-spike',
  ...(kase === 'plain'
    ? {}
    : { auth: { token: kase === 'badtoken' ? 'nope' : config.token } }),
};

const body = 'x'.repeat(SIZE);
const event = i =>
  `${JSON.stringify({
    ...hello,
    auth: undefined,
    kind: 'event',
    event: {
      type: 'console',
      id: String(i),
      ts: Date.now(),
      level: 'log',
      args: [body],
    },
  })}\r\n`;

const socket =
  kase === 'plain'
    ? connectTcp({ host: '127.0.0.1', port: PORT })
    : connectTls({
        host: '127.0.0.1',
        port: kase === 'impostor' ? PORT + 2 : PORT,
        ca: config.cert,
        checkServerIdentity: () => undefined,
      });

socket.on(kase === 'plain' ? 'connect' : 'secureConnect', () => {
  console.log(`${kase}: connected`);
  socket.write(`${JSON.stringify(hello)}\r\n`);
  if (kase === 'plain') send();
});

let acked = false;
socket.on('data', chunk => {
  const line = chunk.toString('utf8').trim();
  console.log(`${kase}: host says ${line}`);
  if (!acked && line.includes('"accepted"')) {
    acked = true;
    send();
  }
});

function send() {
  const started = performance.now();
  let i = 0;
  const pump = () => {
    while (i < COUNT) {
      if (!socket.write(event(i++))) {
        socket.once('drain', pump);
        return;
      }
    }
    socket.end(() =>
      console.log(
        `${kase}: sent ${COUNT} x ${SIZE} B in ${(
          performance.now() - started
        ).toFixed(0)} ms`,
      ),
    );
  };
  pump();
}

socket.on('error', error =>
  console.log(`${kase}: error ${error.code ?? ''} ${error.message}`),
);
socket.on('close', () => console.log(`${kase}: closed`));
