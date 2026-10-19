import {
  createHash,
  createPublicKey,
  randomBytes,
  timingSafeEqual,
  webcrypto,
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'node:net';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import {
  createSecureContext,
  createServer as createTlsServer,
  TLSSocket,
} from 'node:tls';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import * as x509 from '@peculiar/x509';
import {
  safeParseHostWireMessageV1,
  safeParseWireMessageV1,
} from '@rnzeus/heimdall-protocol';

x509.cryptoProvider.set(webcrypto);

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: '35690' },
    key: { type: 'string', default: 'rsa' },
    bare: { type: 'boolean', default: false },
    regen: { type: 'boolean', default: false },
  },
});
const PORT = Number(values.port);
const RSA = values.key !== 'ec';
const certDir = join(
  dirname(fileURLToPath(import.meta.url)),
  `certs-${values.key}${values.bare ? '-bare' : ''}`,
);

const ALGORITHM = RSA
  ? {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
      publicExponent: new Uint8Array([1, 0, 1]),
      modulusLength: 2048,
    }
  : { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' };

async function makeCert(cn) {
  const keys = await webcrypto.subtle.generateKey(ALGORITHM, true, [
    'sign',
    'verify',
  ]);
  const notBefore = new Date(Date.now() - 24 * 3600 * 1000);
  const notAfter = new Date(notBefore);
  notAfter.setFullYear(notAfter.getFullYear() + 20);
  const cert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: `01${randomBytes(15).toString('hex')}`,
    name: `CN=${cn}`,
    notBefore,
    notAfter,
    signingAlgorithm: ALGORITHM,
    keys,
    extensions: values.bare
      ? []
      : [
          new x509.BasicConstraintsExtension(false, undefined, true),
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.digitalSignature,
            true,
          ),
          new x509.ExtendedKeyUsageExtension([
            x509.ExtendedKeyUsage.serverAuth,
          ]),
        ],
  });
  const pkcs8 = Buffer.from(
    await webcrypto.subtle.exportKey('pkcs8', keys.privateKey),
  );
  const key = `-----BEGIN PRIVATE KEY-----\n${pkcs8
    .toString('base64')
    .match(/.{1,64}/g)
    .join('\n')}\n-----END PRIVATE KEY-----\n`;
  return { cert: `${cert.toString('pem')}\n`, key };
}

async function loadCerts() {
  if (!existsSync(certDir) || values.regen) {
    mkdirSync(certDir, { recursive: true });
    for (const name of ['host', 'impostor']) {
      const { cert, key } = await makeCert(`Heimdall ${name}`);
      writeFileSync(join(certDir, `${name}.pem`), cert);
      writeFileSync(join(certDir, `${name}.key`), key);
    }
  }
  const read = name => readFileSync(join(certDir, name), 'utf8');
  return {
    cert: read('host.pem'),
    key: read('host.key'),
    impostor: read('impostor.pem'),
    impostorKey: read('impostor.key'),
  };
}

const { cert, key, impostor, impostorKey } = await loadCerts();
const secureContext = createSecureContext({ cert, key });
const token = randomBytes(32).toString('base64url');
const parsedCert = new x509.X509Certificate(cert);
// iOS getPeerCertificate().pubkey: PKCS#1 DER for RSA, the raw EC point for ECDSA.
const pubkey = RSA
  ? createPublicKey(cert)
      .export({ type: 'pkcs1', format: 'der' })
      .toString('base64')
  : Buffer.from(parsedCert.publicKey.rawData).subarray(-65).toString('base64');
const fingerprint256 = createHash('sha256')
  .update(Buffer.from(parsedCert.rawData))
  .digest('hex')
  .toUpperCase()
  .match(/../g)
  .join(':');

const ack = (socket, status, reason) => {
  const message = {
    kind: 'helloAck',
    v: 1,
    status,
    ...(reason ? { reason } : {}),
    hostVersion: 'tls-spike',
  };
  if (!safeParseHostWireMessageV1(message).success)
    throw new Error('invalid ack');
  socket.write(`${JSON.stringify(message)}\r\n`);
};

const tokenOk = candidate => {
  if (typeof candidate !== 'string') return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
};

let nextId = 1;

function handle(socket, mode, remote) {
  const id = nextId++;
  const log = (...message) =>
    console.log(`[#${id} ${mode} ${remote}]`, ...message);
  let buffer = Buffer.alloc(0);
  let greeted = false;
  let events = 0;
  let bytes = 0;
  let firstAt = 0;
  let lastAt = 0;
  log('connected');

  if (mode === 'tls') {
    socket.on('secure', () =>
      log('handshake ok', socket.getProtocol(), socket.getCipher()?.name),
    );
  }

  socket.on('data', chunk => {
    buffer = buffer.length ? Buffer.concat([buffer, chunk]) : chunk;
    let index;
    while ((index = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.subarray(0, index);
      buffer = buffer.subarray(index + 2);
      onLine(line);
    }
  });

  function onHello(line) {
    let parsed;
    try {
      parsed = safeParseWireMessageV1(JSON.parse(line.toString('utf8')));
    } catch {
      parsed = { success: false };
    }
    if (!parsed.success || parsed.data.kind !== 'hello') {
      log('first line is not a valid hello');
      if (mode === 'tls') {
        ack(socket, 'rejected', 'version');
        socket.end();
      }
      return;
    }
    const hello = parsed.data;
    if (mode === 'plain' && !hello.auth) {
      log('plaintext hello without auth (older SDK)', hello.sdkVersion ?? '');
      return;
    }
    if (!tokenOk(hello.auth?.token)) {
      log('hello rejected: bad token');
      ack(socket, 'rejected', 'auth');
      socket.end();
      return;
    }
    ack(socket, 'accepted');
    log('hello accepted', hello.sdkVersion ?? '', hello.deviceName ?? '');
  }

  function onLine(line) {
    if (!greeted) {
      greeted = true;
      onHello(line);
      return;
    }
    events++;
    bytes += line.length + 2;
    const now = performance.now();
    if (!firstAt) firstAt = now;
    lastAt = now;
  }

  const timer = setInterval(() => {
    if (!events) return;
    const seconds = Math.max((lastAt - firstAt) / 1000, 0.001);
    log(
      `events=${events} MB=${(bytes / 1e6).toFixed(2)} span=${seconds.toFixed(
        2,
      )}s rate=${(bytes / 1e6 / seconds).toFixed(2)}MB/s`,
    );
  }, 2000);

  socket.on('error', error =>
    log('error', error.code ?? '', error.message.split('\n')[0]),
  );
  socket.on('close', () => {
    clearInterval(timer);
    log(`closed; events=${events} MB=${(bytes / 1e6).toFixed(2)}`);
  });
}

createServer(socket => {
  const remote = `${socket.remoteAddress}:${socket.remotePort}`;
  socket.once('readable', () => {
    const head = socket.read(1);
    if (!head) return;
    socket.unshift(head);
    if (head[0] === 0x16)
      handle(
        new TLSSocket(socket, { isServer: true, secureContext }),
        'tls',
        remote,
      );
    else handle(socket, 'plain', remote);
  });
}).listen(PORT, () => {
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter(
      address => address && address.family === 'IPv4' && !address.internal,
    )
    .map(address => address.address);
  console.log(
    `TCP ${PORT} (${RSA ? 'RSA-2048' : 'ECDSA P-256'}${
      values.bare ? ', no extensions' : ''
    })`,
  );
  console.log(`addresses: ${addresses.join(', ')}`);
  console.log(`fingerprint SHA-256: ${fingerprint256}`);
  console.log(
    `config: http://<ip>:${PORT + 1}/config, impostor: <ip>:${PORT + 2}`,
  );
});

createHttpServer((req, res) => {
  if (req.url !== '/config') {
    res.writeHead(404).end();
    return;
  }
  res
    .writeHead(200, { 'content-type': 'application/json' })
    .end(JSON.stringify({ cert, token, fingerprint256, pubkey }));
}).listen(PORT + 1);

createTlsServer({ cert: impostor, key: impostorKey }, socket => {
  console.log(`[impostor ${socket.remoteAddress}] handshake ok`);
  socket.on('data', chunk =>
    console.log(`[impostor] !!! RECEIVED ${chunk.length} bytes`),
  );
  socket.on('error', () => undefined);
  socket.on('close', () => console.log('[impostor] closed'));
}).listen(PORT + 2);
