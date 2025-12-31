export function parseUrl(url: string) {
  try {
    const u = new URL(url);
    let host = u.host || u.hostname || "";
    let path = (u.pathname || "") + (u.search || "");

    // RN URL polyfills sometimes mis-handle ws/wss and produce empty host.
    // Fallback: parse as http/https for host/path extraction, but keep original url in output.
    if (!host && (url.startsWith("ws://") || url.startsWith("wss://"))) {
      try {
        const httpUrl = url.replace(/^ws(s?):\/\//, "http$1://");
        const u2 = new URL(httpUrl);
        host = u2.host || u2.hostname || host;
        path = (u2.pathname || path) + (u2.search || "");
      } catch {
        // ignore
      }
    }

    return {
      url,
      host,
      path,
    };
  } catch {
    return {
      url,
      host: "",
      path: url,
    };
  }
}
