/** The host writes one JSON message per line; calls `onLine` for every complete line until unsubscribed. */
export function readHostLines({
  socket,
  onLine,
}: {
  socket: any;
  onLine: (line: string) => void;
}): () => void {
  let pending = "";
  const onData = (data: unknown) => {
    pending += typeof data === "string" ? data : String(data);
    let end = pending.indexOf("\r\n");
    while (end !== -1) {
      const line = pending.slice(0, end);
      pending = pending.slice(end + 2);
      onLine(line);
      end = pending.indexOf("\r\n");
    }
  };
  socket.on("data", onData);
  return () => socket.off?.("data", onData);
}
