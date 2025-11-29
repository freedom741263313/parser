export function cleanHex(input: string): string {
  return input.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '');
}

export function formatHex(input: string): string {
  const cleaned = cleanHex(input);
  const chunks = cleaned.match(/.{1,2}/g) || [];
  return chunks.join(' ');
}

export function hexToBuffer(input: string): Uint8Array {
  const cleaned = cleanHex(input);
  if (cleaned.length % 2 !== 0) {
    throw new Error('Hex 字符串长度无效');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}
