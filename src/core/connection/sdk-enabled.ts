let sdkEnabled = false;

export function resolveEnabled(flag: boolean | undefined): boolean {
  return flag ?? __DEV__;
}

export function setSdkEnabled(value: boolean) {
  sdkEnabled = value;
}

export function isSdkEnabled(): boolean {
  return sdkEnabled;
}
