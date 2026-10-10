import { restoreXHR } from "../../network";
import { restoreWebSocket } from "../../websocket";
import { restoreConsole } from "../../console";
import { disconnectSocket } from "../socket";

export function disconnect() {
  restoreXHR();
  restoreWebSocket();
  restoreConsole();
  disconnectSocket();
}
