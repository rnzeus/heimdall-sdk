import { restoreXHR } from "../../network";
import { restoreWebSocket } from "../../websocket";
import { destroySocket } from "../socket";
import { setSdkEnabled } from "../sdk-enabled";

export function destroy() {
  restoreXHR();
  restoreWebSocket();
  destroySocket();
  setSdkEnabled(false);
}
