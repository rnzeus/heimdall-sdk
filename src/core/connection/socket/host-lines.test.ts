import { describe, expect, it, vi } from "vitest";

import { readHostLines } from "./host-lines";

const fakeSocket = () => {
  const handlers = new Set<(data: unknown) => void>();
  return {
    on: (_event: string, handler: (data: unknown) => void) => handlers.add(handler),
    off: (_event: string, handler: (data: unknown) => void) => handlers.delete(handler),
    push: (data: unknown) => handlers.forEach((handler) => handler(data)),
  };
};

describe("readHostLines", () => {
  it("joins chunks and splits several lines in one chunk", () => {
    const socket = fakeSocket();
    const onLine = vi.fn();
    readHostLines({ socket, onLine });
    socket.push('{"a":');
    socket.push('1}\r\n{"b":2}\r\n{"c"');
    expect(onLine.mock.calls).toEqual([['{"a":1}'], ['{"b":2}']]);
    socket.push(":3}\r\n");
    expect(onLine).toHaveBeenLastCalledWith('{"c":3}');
  });

  it("stops after unsubscribing", () => {
    const socket = fakeSocket();
    const onLine = vi.fn();
    const stop = readHostLines({ socket, onLine });
    stop();
    socket.push("{}\r\n");
    expect(onLine).not.toHaveBeenCalled();
  });
});
