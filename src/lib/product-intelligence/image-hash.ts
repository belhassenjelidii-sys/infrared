/** Hamming distance between two 64-bit hexadecimal perceptual hashes. */
export function hammingDistance(hashA: string, hashB: string): number {
  const a = BigInt(`0x${hashA}`);
  const b = BigInt(`0x${hashB}`);
  let xor = a ^ b;
  let count = 0;
  const zero = BigInt(0);
  const one = BigInt(1);

  while (xor > zero) {
    count += Number(xor & one);
    xor >>= one;
  }
  return count;
}
