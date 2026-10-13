export class BodyTooLarge extends Error {}
export async function readLimitedBody(stream: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<string> {
  if (!stream) throw new Error('Body required');
  const reader = stream.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new BodyTooLarge('Body exceeds limit'); }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
  } finally { reader.releaseLock(); }
}
