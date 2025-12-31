import { restoreXHR } from "../../network";
import { restoreWebSocket } from "../../websocket";
import { disconnectSocket } from "../socket";

export function disconnect() {
  restoreXHR();
  restoreWebSocket();
  disconnectSocket();
}
