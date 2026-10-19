import { HeimdallConnectPrompt, disconnect, showSDKConnectPrompt } from '@rnzeus/heimdall-sdk';
import { Component, useCallback, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import { CONSOLE_SCENARIOS, NETWORK_SCENARIOS, WEBSOCKET_SCENARIOS, runAllNetworkScenarios } from './src/scenarios';
import { TlsSpike } from './src/tls-spike';
import { getLateCounterStore, useCartStore, useEarlyCounterStore, useStressStore, useTodoStore } from './src/stores';

const MAX_LOG_LINES = 30;

function Button({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.button, pressed && styles.button_pressed]} onPress={onPress}>
      <Text style={styles.button_text}>{title}</Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.section_title}>{title}</Text>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

function RenderBomb({ armed }: { armed: boolean }) {
  if (armed) throw new Error('Example render error');
  return null;
}

class RenderErrorBoundary extends Component<
  { children: React.ReactNode; onReset: () => void },
  { message: string | null }
> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  reset = () => {
    this.props.onReset();
    this.setState({ message: null });
  };

  render() {
    if (this.state.message) {
      return <Button title={`Caught: ${this.state.message} · reset`} onPress={this.reset} />;
    }
    return this.props.children;
  }
}

function App() {
  const [lines, setLines] = useState<{ id: number; text: string }[]>([]);
  const [renderBombArmed, setRenderBombArmed] = useState(false);
  const log = useCallback((line: string) => {
    const text = `${new Date().toLocaleTimeString()}  ${line}`;
    setLines(prev => [{ id: (prev[0]?.id ?? 0) + 1, text }, ...prev].slice(0, MAX_LOG_LINES));
  }, []);

  const early = useEarlyCounterStore();
  const late = useStore(getLateCounterStore());
  const cart = useCartStore();
  const todo = useTodoStore();
  const stress = useStressStore();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Heimdall SDK Example</Text>

          <TlsSpike log={log} />

          <Section title="Connection">
            <Button title="Connect prompt" onPress={showSDKConnectPrompt} />
            <Button
              title="Disconnect"
              onPress={() => {
                disconnect();
                log('disconnect called');
              }}
            />
          </Section>

          <Section title="Network">
            <Button title="Run all" onPress={() => runAllNetworkScenarios(log)} />
            {NETWORK_SCENARIOS.map(scenario => (
              <Button key={scenario.title} title={scenario.title} onPress={() => scenario.run(log)} />
            ))}
          </Section>

          <Section title="Console">
            {CONSOLE_SCENARIOS.map(scenario => (
              <Button key={scenario.title} title={scenario.title} onPress={() => scenario.run(log)} />
            ))}
            <RenderErrorBoundary onReset={() => setRenderBombArmed(false)}>
              <Button title="Render error" onPress={() => setRenderBombArmed(true)} />
              <RenderBomb armed={renderBombArmed} />
            </RenderErrorBoundary>
          </Section>

          <Section title="WebSocket">
            {WEBSOCKET_SCENARIOS.map(scenario => (
              <Button key={scenario.title} title={scenario.title} onPress={() => scenario.run(log)} />
            ))}
          </Section>

          <Section title={`Zustand · early ${early.count} · late ${late.count}`}>
            <Button title="early +1" onPress={early.increment} />
            <Button title="early reset" onPress={early.reset} />
            <Button title="late +1" onPress={late.increment} />
            <Button title="late reset" onPress={late.reset} />
          </Section>

          <Section
            title={`Zustand cart · ${cart.totals.count} items · ${cart.totals.sum.toFixed(2)}${cart.coupon ? ` · ${cart.coupon}` : ''}`}
          >
            <Button title="add item" onPress={cart.add} />
            <Button title="remove last" onPress={cart.removeLast} />
            <Button title="toggle coupon" onPress={cart.toggleCoupon} />
            <Button title="clear" onPress={cart.clear} />
          </Section>

          <Section title={`Zustand async · ${todo.status}`}>
            <Button title="load" onPress={todo.load} />
            <Button title="load failing" onPress={todo.loadFailing} />
          </Section>

          <Section title={`Zustand stress · tick ${stress.tick} · rows ${stress.rows.length}`}>
            <Button title="100 updates" onPress={stress.burst} />
            <Button title="fill 2000 rows" onPress={stress.fill} />
            <Button title="reset" onPress={stress.reset} />
          </Section>

          <View style={styles.log}>
            {lines.map(line => (
              <Text key={line.id} style={styles.log_line}>
                {line.text}
              </Text>
            ))}
          </View>
        </ScrollView>
        <HeimdallConnectPrompt />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  section: { gap: 8 },
  section_title: { fontSize: 13, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { backgroundColor: '#1F6FEB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  button_pressed: { opacity: 0.6 },
  button_text: { color: '#FFF', fontWeight: '600' },
  log: { backgroundColor: '#111', borderRadius: 8, padding: 12, minHeight: 120, gap: 2 },
  log_line: { color: '#9FE870', fontFamily: 'Menlo', fontSize: 11 },
});

export default App;
