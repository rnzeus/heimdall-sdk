import { restoreXHR } from "../../network";
import { disconnectSocket } from "../socket";

export function disconnect() {
  restoreXHR();
  disconnectSocket();
}
