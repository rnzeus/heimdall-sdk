import {
  addFrameListener,
  addStatusListener,
  addTapListener,
  isFramesAvailable,
  startFrames,
  stopFrames,
} from "@rnzeus/heimdall-lens";
import { registerFramesSource } from "../core/frames";

export type HeimdallFramesOptions = {
  /** upper bound for the rate the host may ask for; 2 by default */
  maxFps?: number;
  /** upper bound for the frame width in pixels; 480 by default */
  maxWidth?: number;
};

const DEFAULT_MAX_FPS = 2;
const DEFAULT_MAX_WIDTH = 480;

/**
 * Lets Heimdall attach the last seconds of the screen to a bug report. Call once at startup; capture
 * runs only while Heimdall is connected and asks for frames. Needs `@rnzeus/heimdall-lens` in the app.
 */
export function heimdallFrames(options: HeimdallFramesOptions = {}) {
  if (!isFramesAvailable()) {
    if (__DEV__) {
      console.warn(
        "[Heimdall] heimdallFrames: @rnzeus/heimdall-lens is not linked, rebuild the app after installing it."
      );
    }
    return;
  }
  registerFramesSource({
    capability: {
      maxFps: options.maxFps ?? DEFAULT_MAX_FPS,
      maxWidth: options.maxWidth ?? DEFAULT_MAX_WIDTH,
    },
    start: ({ fps, maxWidth }) => startFrames({ fps, maxWidth }),
    stop: () => {
      stopFrames().catch(() => {});
    },
    subscribe: ({ onFrame, onStatus, onTap }) => {
      const subscriptions = [addFrameListener(onFrame), addStatusListener(onStatus), addTapListener(onTap)];
      return () => {
        for (const subscription of subscriptions) subscription.remove();
      };
    },
  });
}
