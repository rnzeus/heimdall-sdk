export function parseUrl(url: string) {
  try {
    const u = new URL(url);
    return {
      url,
      host: u.host,
      path: u.pathname + u.search,
    };
  } catch {
    return {
      url,
      host: "",
      path: url,
    };
  }
}
