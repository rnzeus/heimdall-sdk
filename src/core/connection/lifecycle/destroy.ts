import { restoreFetch } from "../../network";
import { destroySocket } from "../socket";
import { setSdkEnabled } from "../sdk-enabled";

export function destroy() {
  restoreFetch();
  destroySocket();
  setSdkEnabled(false);
}
