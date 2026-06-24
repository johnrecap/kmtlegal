import { createHmac, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase32(secret: string) {
  const normalized = secret.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";
  for (const char of normalized) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error("Invalid base32 character in TOTP secret.");
    }
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number, digits: number) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(code % 10 ** digits).padStart(digits, "0");
}

export function generateTotpCode(
  secret: string,
  options: { now?: Date; stepSeconds?: number; digits?: number } = {}
) {
  const now = options.now ?? new Date();
  const stepSeconds = options.stepSeconds ?? 30;
  const digits = options.digits ?? 6;
  return hotp(secret, Math.floor(now.getTime() / 1000 / stepSeconds), digits);
}

export function verifyTotpCode(
  secret: string,
  code: string,
  options: { now?: Date; stepSeconds?: number; digits?: number; window?: number } = {}
) {
  const digits = options.digits ?? 6;
  const sanitized = code.replace(/\s+/g, "");
  if (!new RegExp(`^\\d{${digits}}$`).test(sanitized)) {
    return false;
  }

  const now = options.now ?? new Date();
  const stepSeconds = options.stepSeconds ?? 30;
  const window = options.window ?? 1;
  const currentCounter = Math.floor(now.getTime() / 1000 / stepSeconds);

  for (let offset = -window; offset <= window; offset += 1) {
    const expected = hotp(secret, currentCounter + offset, digits);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(sanitized))) {
      return true;
    }
  }
  return false;
}
