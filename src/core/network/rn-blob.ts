export async function readRNBlobAsText(blob: any): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("react-native/Libraries/Blob/FileReader");
  const BlobFileReader = mod.default ?? mod;

  const reader = new BlobFileReader();
  reader.readAsText(blob);

  return await new Promise<string>((resolve, reject) => {
    const onLoad = () => resolve(String(reader.result ?? ""));
    const onErr = () => reject(reader.error ?? new Error("blob_read_error"));

    reader.addEventListener("load", onLoad);
    reader.addEventListener("error", onErr);
    reader.addEventListener("abort", onErr);
  });
}
