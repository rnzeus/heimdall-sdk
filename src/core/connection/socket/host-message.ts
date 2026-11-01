import type { HostConfigFrames } from "@rnzeus/heimdall-protocol";

/** A host message of wire version 1, or null when the line is not one. */
export function parseHostMessage(
  line: string
): Record<string, unknown> | null {
  let json: unknown;
  try {
    json = JSON.parse(line);
  } catch {
    return null;
  }
  if (!json || typeof json !== "object") return null;
  const message = json as Record<string, unknown>;
  return typeof message.kind === "string" && message.v === 1 ? message : null;
}

export type HostConfig = { frames?: HostConfigFrames };

const optionalNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

// Hand-written on purpose, like parseHostAnswer: mirrors the tolerant HostConfigWireMessageV1Schema,
// unknown sections and fields are ignored.
export function parseHostConfig(line: string): HostConfig | null {
  const message = parseHostMessage(line);
  if (message?.kind !== "hostConfig") return null;
  const { frames } = message;
  if (frames === undefined) return {};
  if (!frames || typeof frames !== "object") return null;
  const { enabled, fps, maxWidth } = frames as Record<string, unknown>;
  if (typeof enabled !== "boolean") return null;
  return {
    frames: { enabled, fps: optionalNumber(fps), maxWidth: optionalNumber(maxWidth) },
  };
}

const configListeners = new Set<(config: HostConfig) => void>();

/** Notified with every `hostConfig` the host sends; the latest one wins. */
export function subscribeHostConfig(
  listener: (config: HostConfig) => void
): () => void {
  configListeners.add(listener);
  return () => {
    configListeners.delete(listener);
  };
}

const captureListeners = new Set<() => void>();

/** Notified when the host asks for a frame of the screen now (`captureScreen`). */
export function subscribeCaptureScreen(listener: () => void): () => void {
  captureListeners.add(listener);
  return () => {
    captureListeners.delete(listener);
  };
}

export function handleHostLine(line: string) {
  const config = parseHostConfig(line);
  if (config) {
    for (const listener of configListeners) listener(config);
    return;
  }
  if (parseHostMessage(line)?.kind === "captureScreen") {
    for (const listener of captureListeners) listener();
  }
}
