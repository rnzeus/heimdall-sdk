import { useCallback, useEffect, useRef, useState } from "react";

import {
  getLastError,
  getSocket,
  hidePrompt,
  isConnected,
  setLastError,
  subscribeSocketState,
} from "../../core/connection";

/**
 * Keeps the prompt open while connecting: closes it only on success,
 * leaves it open with the error otherwise.
 */
const useConnectAwaiter = ({ visible }: { visible: boolean }) => {
  const [isConnecting, setConnecting] = useState(false);
  const awaitingRef = useRef(false);

  const finish = useCallback(() => {
    awaitingRef.current = false;
    setConnecting(false);
  }, []);

  useEffect(
    () =>
      subscribeSocketState(() => {
        if (!awaitingRef.current) return;
        if (isConnected()) {
          finish();
          hidePrompt();
        } else if (getLastError()) {
          finish();
        }
      }),
    [finish]
  );

  useEffect(() => {
    if (!visible) finish();
  }, [visible, finish]);

  const startConnecting = useCallback(
    (connectFn: () => void) => {
      awaitingRef.current = true;
      setConnecting(true);
      connectFn();
      if (!awaitingRef.current) return;
      if (isConnected()) {
        finish();
        hidePrompt();
      } else if (!getSocket()) {
        setLastError("Heimdall SDK is disabled in this build.");
      }
    },
    [finish]
  );

  return { isConnecting, startConnecting };
};

export default useConnectAwaiter;
