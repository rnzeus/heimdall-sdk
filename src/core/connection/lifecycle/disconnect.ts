import { restoreFetch } from "@core/network";
import { disconnectSocket } from "../socket";

export function disconnect() {
  restoreFetch();
  disconnectSocket();
}
