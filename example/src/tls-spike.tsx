// TLS bench (branch spike/tls, never merged): talks to tls-spike/host.mjs, see tls-spike/README.md.
import { useCallback, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import TcpSocket from 'react-native-tcp-socket';

type Config = {
  cert: string;
  token: string;
  fingerprint256: string;
  pubkey: string;
};
type Case = 'tls' | 'impostor' | 'badtoken' | 'plain';
type PeerCertificate = { pubkey?: string; fingerprint256?: string } | null;
type Load = { count: number; size: number };

const PORT = 35690;
const DEFAULT_HOST = Platform.select({
  android: '10.0.2.2',
  default: '127.0.0.1',
});

function Btn({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.button_text}>{title}</Text>
    </Pressable>
  );
}

function watchFrames() {
  let max = 0;
  let last = Date.now();
  let running = true;
  const tick = () => {
    const now = Date.now();
    max = Math.max(max, now - last);
    last = now;
    if (running) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return () => {
    running = false;
    return max;
  };
}

export function TlsSpike({
  log: logOnScreen,
}: {
  log: (line: string) => void;
}) {
  const [host, setHost] = useState(DEFAULT_HOST);
  const log = useCallback(
    (line: string) => {
      console.log('[tls-spike]', line);
      logOnScreen(line);
    },
    [logOnScreen],
  );
  const config = useRef<Config | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch(`http://${host}:${PORT + 1}/config`);
      config.current = (await response.json()) as Config;
      log(`config ok, cert ${config.current.cert.length} chars`);
    } catch (error) {
      log(`config failed: ${String(error)}`);
    }
  }, [host, log]);

  const run = useCallback(
    ({ kase, load }: { kase: Case; load?: Load }) => {
      const cfg = config.current;
      if (!cfg) {
        log('fetch config first');
        return;
      }
      const started = Date.now();
      const ms = () => `${(Date.now() - started).toFixed(0)}ms`;
      const tag = `${kase}${load ? ` ${load.count}x${load.size}` : ''}`;

      const socket =
        kase === 'plain'
          ? TcpSocket.createConnection({ host, port: PORT }, () =>
              onOpen('connect'),
            )
          : TcpSocket.connectTLS(
              {
                host,
                port: kase === 'impostor' ? PORT + 2 : PORT,
                ca: cfg.cert,
              },
              () => onOpen('secureConnect'),
            );

      const hello = {
        kind: 'hello',
        v: 1,
        channel: 'heimdall://local-spike',
        clientId: Platform.OS,
        sessionId: String(Date.now()),
        deviceName: `spike ${Platform.OS}`,
        sdkVersion: 'spike',
        ...(kase === 'plain'
          ? {}
          : { auth: { token: kase === 'badtoken' ? 'nope' : cfg.token } }),
      };

      const ackTimeout = setTimeout(
        () => log(`${tag}: no ack in 5s (${ms()})`),
        5000,
      );

      async function readPeer(): Promise<PeerCertificate> {
        for (let attempt = 0; attempt < 30; attempt++) {
          try {
            const peer = (await (
              socket as ReturnType<typeof TcpSocket.connectTLS>
            ).getPeerCertificate()) as PeerCertificate;
            if (peer && (peer.pubkey || peer.fingerprint256)) return peer;
            if (attempt === 0)
              log(
                `${tag}: peer certificate empty: ${JSON.stringify(peer)?.slice(
                  0,
                  80,
                )}`,
              );
          } catch (error) {
            if (attempt === 0)
              log(
                `${tag}: getPeerCertificate failed: ${String(
                  (error as Error)?.message ?? error,
                ).slice(0, 120)}`,
              );
          }
          await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
        }
        return null;
      }

      async function onOpen(event: string) {
        log(`${tag}: ${event} ${ms()}`);
        if (kase !== 'plain') {
          const peer = await readPeer();
          const pinned =
            Platform.OS === 'ios'
              ? peer?.pubkey === cfg!.pubkey
              : peer?.fingerprint256 === cfg!.fingerprint256;
          log(
            `${tag}: pin ${
              pinned ? 'OK' : 'MISMATCH'
            } pubkey=${peer?.pubkey?.slice(
              0,
              12,
            )} fp=${peer?.fingerprint256?.slice(0, 11)} ${ms()}`,
          );
          if (!pinned) {
            clearTimeout(ackTimeout);
            socket.destroy();
            return;
          }
        }
        socket.write(JSON.stringify(hello) + '\r\n');
        if (kase === 'plain') {
          clearTimeout(ackTimeout);
          send();
        }
      }

      let acked = false;
      socket.on('data', data => {
        const text = typeof data === 'string' ? data : data.toString('utf8');
        log(`${tag}: host says ${text.trim()} ${ms()}`);
        if (!acked && text.includes('"accepted"')) {
          acked = true;
          clearTimeout(ackTimeout);
          send();
        }
      });
      socket.on('error', error =>
        log(
          `${tag}: error ${String((error as Error)?.message ?? error)} ${ms()}`,
        ),
      );
      socket.on('close', () => {
        clearTimeout(ackTimeout);
        log(`${tag}: closed ${ms()}`);
      });

      function send() {
        if (!load) {
          socket.end();
          return;
        }
        const body = 'x'.repeat(load.size);
        const stop = watchFrames();
        const sendStarted = Date.now();
        for (let i = 0; i < load.count; i++) {
          const line =
            JSON.stringify({
              kind: 'event',
              v: 1,
              channel: hello.channel,
              clientId: hello.clientId,
              sessionId: hello.sessionId,
              event: {
                type: 'console',
                id: String(i),
                ts: Date.now(),
                level: 'log',
                args: [body],
              },
            }) + '\r\n';
          const last = i === load.count - 1;
          socket.write(line, 'utf8', last ? () => finish() : undefined);
        }
        const queued = Date.now() - sendStarted;
        function finish() {
          const maxFrame = stop();
          log(
            `${tag}: queued ${queued.toFixed(0)}ms, written ${(
              Date.now() - sendStarted
            ).toFixed(0)}ms, max frame ${maxFrame.toFixed(0)}ms`,
          );
          socket.end();
        }
      }
    },
    [host, log],
  );

  return (
    <View style={styles.box}>
      <Text style={styles.title}>TLS spike</Text>
      <TextInput
        style={styles.input}
        value={host}
        onChangeText={setHost}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.row}>
        <Btn title="config" onPress={fetchConfig} />
        <Btn title="tls" onPress={() => run({ kase: 'tls' })} />
        <Btn title="impostor" onPress={() => run({ kase: 'impostor' })} />
        <Btn title="bad token" onPress={() => run({ kase: 'badtoken' })} />
        <Btn title="plain" onPress={() => run({ kase: 'plain' })} />
      </View>
      <View style={styles.row}>
        <Btn
          title="tls 10k×2KB"
          onPress={() =>
            run({ kase: 'tls', load: { count: 10000, size: 2000 } })
          }
        />
        <Btn
          title="plain 10k×2KB"
          onPress={() =>
            run({ kase: 'plain', load: { count: 10000, size: 2000 } })
          }
        />
        <Btn
          title="tls 5×5MB"
          onPress={() =>
            run({ kase: 'tls', load: { count: 5, size: 5_000_000 } })
          }
        />
        <Btn
          title="plain 5×5MB"
          onPress={() =>
            run({ kase: 'plain', load: { count: 5, size: 5_000_000 } })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8, padding: 12, borderRadius: 8, backgroundColor: '#FFF3E6' },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: 'Menlo',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    backgroundColor: '#C2410C',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pressed: { opacity: 0.6 },
  button_text: { color: '#FFF', fontWeight: '600', fontSize: 12 },
});
