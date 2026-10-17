import { clearLastConnection } from "../session";
import { handleSocketLost } from "./handle-socket-lost";

export function disconnectSocket() {
  handleSocketLost();
  clearLastConnection();
}
