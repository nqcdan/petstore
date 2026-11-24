import { MAX_IMAGE_BYTES } from './limits'

export type ImageProblem = 'type' | 'size'

// The server checks the real content (magic bytes), so do the same here instead of trusting the file name.
function sniff(b: Uint8Array): boolean {
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  const webp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  return png || jpeg || webp
}

export async function checkImage(file: File): Promise<ImageProblem | null> {
  if (file.size > MAX_IMAGE_BYTES) return 'size'
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  return sniff(head) ? null : 'type'
}
