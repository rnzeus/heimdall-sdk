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

type CartItem = { id: number; title: string; price: number; qty: number };

type CartState = {
  items: CartItem[];
  coupon: string | null;
  user: { id: string; tier: 'free' | 'pro' };
  totals: { count: number; sum: number };
  add: () => void;
  removeLast: () => void;
  toggleCoupon: () => void;
  clear: () => void;
};

const totalsOf = ({ items, coupon }: { items: CartItem[]; coupon: string | null }) => {
  const count = items.reduce((acc, item) => acc + item.qty, 0);
  const sum = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  return { count, sum: coupon ? Math.round(sum * 0.9 * 100) / 100 : sum };
};

export const useCartStore = create<CartState>()(
  heimdallZustand('cart', set => ({
    items: [],
    coupon: null,
    user: { id: 'u1', tier: 'free' },
    totals: { count: 0, sum: 0 },
    add: () =>
      set(state => {
        const id = state.items.length + 1;
        const items = [...state.items, { id, title: `Item ${id}`, price: 9.99 * id, qty: 1 }];
        return { items, totals: totalsOf({ items, coupon: state.coupon }) };
      }),
    removeLast: () =>
      set(state => {
        const items = state.items.slice(0, -1);
        return { items, totals: totalsOf({ items, coupon: state.coupon }) };
      }),
    toggleCoupon: () =>
      set(state => {
        const coupon = state.coupon ? null : 'SAVE10';
        return { coupon, totals: totalsOf({ items: state.items, coupon }) };
      }),
    clear: () => set({ items: [], coupon: null, totals: { count: 0, sum: 0 } }),
  })),
);

type TodoState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: { id: number; title: string; completed: boolean } | null;
  error: string | null;
  load: () => Promise<void>;
  loadFailing: () => Promise<void>;
};

export const useTodoStore = create<TodoState>()(
  heimdallZustand('todo', set => {
    const run = async ({ url }: { url: string }) => {
      set({ status: 'loading', error: null });
      try {
        const response = await fetch(url);
        set({ status: 'success', data: await response.json() });
      } catch (error) {
        set({ status: 'error', data: null, error: error instanceof Error ? error.message : String(error) });
      }
    };

    return {
      status: 'idle',
      data: null,
      error: null,
      load: () => run({ url: `https://jsonplaceholder.typicode.com/todos/${1 + Math.floor(Math.random() * 100)}` }),
      loadFailing: () => run({ url: 'https://heimdall-example.invalid/todos/1' }),
    };
  }),
);

type StressState = {
  tick: number;
  rows: { id: number; label: string }[];
  burst: () => void;
  fill: () => void;
  reset: () => void;
};

export const useStressStore = create<StressState>()(
  heimdallZustand('stress', set => ({
    tick: 0,
    rows: [],
    burst: () => {
      for (let i = 0; i < 100; i++) set(state => ({ tick: state.tick + 1 }));
    },
    fill: () => set({ rows: Array.from({ length: 2000 }, (_, id) => ({ id, label: `Row ${id}` })) }),
    reset: () => set({ tick: 0, rows: [] }),
  })),
);
