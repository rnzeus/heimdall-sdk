import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import {
  getLastError,
  getSocket,
  hidePrompt,
  isConnected,
  setLastError,
  subscribeSocketState,
} from "../../core/connection";
import {
  LOCAL_NETWORK,
  localNetworkError,
  localNetworkNotice,
  shouldWaitForLocalNetwork,
} from "./local-network";

type State = { isConnecting: boolean; notice: string | null };

const IDLE: State = { isConnecting: false, notice: null };

/**
 * Keeps the prompt open while connecting: closes it only on success, leaves it open with the error otherwise.
 * On iOS a first connection that the Local Network question holds back is tried again until the user answers.
 */
const useConnectAwaiter = ({ visible }: { visible: boolean }) => {
  const [state, setState] = useState<State>(IDLE);
  const awaitingRef = useRef(false);
  const attemptRef = useRef<{
    connectFn: () => void;
    startedAt: number;
  } | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    awaitingRef.current = false;
    attemptRef.current = null;
    if (retryRef.current) clearTimeout(retryRef.current);
    retryRef.current = null;
    setState(IDLE);
  }, []);

  useEffect(
    () =>
      subscribeSocketState(() => {
        if (!awaitingRef.current) return;
        if (isConnected()) {
          finish();
          hidePrompt();
          return;
        }
        const error = getLastError();
        const attempt = attemptRef.current;
        if (!error) return;
        if (
          attempt &&
          shouldWaitForLocalNetwork({
            platform: Platform.OS,
            error,
            startedAt: attempt.startedAt,
            now: Date.now(),
          })
        ) {
          if (retryRef.current) return;
          setState({
            isConnecting: true,
            notice: localNetworkNotice({
              startedAt: attempt.startedAt,
              now: Date.now(),
            }),
          });
          retryRef.current = setTimeout(() => {
            retryRef.current = null;
            if (!awaitingRef.current) return;
            setLastError(null);
            attempt.connectFn();
          }, LOCAL_NETWORK.retryMs);
          return;
        }
        const message = localNetworkError({ platform: Platform.OS, error });
        if (message !== error) setLastError(message);
        finish();
      }),
    [finish]
  );

  useEffect(() => {
    if (!visible) finish();
  }, [visible, finish]);

  useEffect(() => finish, [finish]);

  const startConnecting = useCallback(
    (connectFn: () => void) => {
      awaitingRef.current = true;
      attemptRef.current = { connectFn, startedAt: Date.now() };
      setState({ isConnecting: true, notice: null });
      connectFn();
      if (!awaitingRef.current) return;
      if (isConnected()) {
        finish();
        hidePrompt();
      } else if (!getSocket() && !getLastError()) {
        setLastError("Heimdall SDK is disabled in this build.");
      }
    },
    [finish]
  );

  return {
    isConnecting: state.isConnecting,
    notice: state.notice,
    startConnecting,
  };
};

export default useConnectAwaiter;
