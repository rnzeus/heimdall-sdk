import { heimdallZustand } from '@rnzeus/heimdall-sdk/zustand';
import { create } from 'zustand';

type CounterState = {
  count: number;
  increment: () => void;
  reset: () => void;
};

const counter =
  (name: string) =>
  () =>
    create<CounterState>()(
      heimdallZustand(name, set => ({
        count: 0,
        increment: () => set(state => ({ count: state.count + 1 })),
        reset: () => set({ count: 0 }),
      })),
    );

export const useEarlyCounterStore = counter('early-counter')();

let lateCounterStore: ReturnType<ReturnType<typeof counter>> | undefined;

export function getLateCounterStore() {
  lateCounterStore ??= counter('late-counter')();
  return lateCounterStore;
}
