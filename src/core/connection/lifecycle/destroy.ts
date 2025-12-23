import { restoreXHR } from "../../network";
import { destroySocket } from "../socket";
import { setSdkEnabled } from "../sdk-enabled";

export function destroy() {
  restoreXHR();
  destroySocket();
  setSdkEnabled(false);
}
