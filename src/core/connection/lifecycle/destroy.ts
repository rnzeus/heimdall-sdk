import { restoreXHR } from "../../network";
import { restoreWebSocket } from "../../websocket";
import { restoreConsole } from "../../console";
import { destroySocket } from "../socket";
import { setSdkEnabled } from "../sdk-enabled";

export function destroy() {
  restoreXHR();
  restoreWebSocket();
  restoreConsole();
  destroySocket();
  setSdkEnabled(false);
}
