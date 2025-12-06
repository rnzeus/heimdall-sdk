import { restoreFetch } from "../../network";
import { disconnectSocket } from "../socket";

export function disconnect() {
  restoreFetch();
  disconnectSocket();
}
