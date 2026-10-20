import type { InstallDevice } from "../system";

const REQUEST_TIMEOUT_MS = 10_000;

export class CloudUnauthorizedError extends Error {
  constructor() {
    super("Device is not linked anymore");
  }
}

export type CloudClaim = { code: string; url: string; expiresAt: number };

export type CloudClaimStatus =
  | { status: "pending" }
  | { status: "expired" }
  | { status: "approved"; token: string; device: { id: string; name: string } };

export type CloudConnection = {
  host: string;
  addresses: string[];
  port: number;
  channel: string;
  hostName: string;
  tls?: { cert: string; pubkey: string; fingerprint256: string };
  token?: string;
};

async function request({
  baseUrl,
  path,
  method = "GET",
  token,
  body,
}: {
  baseUrl: string;
  path: string;
  method?: "GET" | "POST" | "DELETE";
  token?: string;
  body?: unknown;
}): Promise<{ status: number; data: any }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/v1${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
  } finally {
    clearTimeout(timeout);
  }
}

export async function createClaim({
  baseUrl,
  appId,
  platform,
  installId,
  device,
}: {
  baseUrl: string;
  appId?: string;
  platform?: string;
  installId?: string;
  device?: InstallDevice;
}): Promise<CloudClaim> {
  const { status, data } = await request({
    baseUrl,
    path: "/claims",
    method: "POST",
    body: { appId, platform, installId, device },
  });
  if (status !== 201) throw new Error(`Cloud error ${status}`);
  return data as CloudClaim;
}

export async function pollClaim({
  baseUrl,
  code,
}: {
  baseUrl: string;
  code: string;
}): Promise<CloudClaimStatus> {
  const { status, data } = await request({
    baseUrl,
    path: `/claims/${encodeURIComponent(code)}`,
  });
  if (status === 410) return { status: "expired" };
  if (status !== 200) throw new Error(`Cloud error ${status}`);
  return data as CloudClaimStatus;
}

export async function fetchConnection({
  baseUrl,
  token,
}: {
  baseUrl: string;
  token: string;
}): Promise<CloudConnection | null> {
  const { status, data } = await request({
    baseUrl,
    path: "/device/connection",
    token,
  });
  if (status === 204) return null;
  if (status === 401) throw new CloudUnauthorizedError();
  if (status !== 200) throw new Error(`Cloud error ${status}`);
  return data as CloudConnection;
}

export async function unlinkDevice({
  baseUrl,
  token,
}: {
  baseUrl: string;
  token: string;
}): Promise<void> {
  await request({ baseUrl, path: "/device", method: "DELETE", token });
}
