type CloudTarget = { channel: string; hostName?: string };

let lastCloudTarget: CloudTarget | null = null;

export function setLastCloudTarget(target: CloudTarget | null) {
  lastCloudTarget = target;
}

export function getCloudHostName(channel: string | null): string | null {
  if (!channel || lastCloudTarget?.channel !== channel) return null;
  return lastCloudTarget.hostName ?? null;
}
