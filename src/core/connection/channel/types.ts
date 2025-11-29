export const CHANNEL_SCHEME = "heimdall://";

export type Channel = string & { readonly __brand: "HeimdallChannel" };

export type ChannelParts = {
  scheme: "heimdall://";
  slug: string;
  shortId: string;
};
