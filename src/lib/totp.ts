import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = '';
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, '0');
  }
  let base32 = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5);
    if (chunk.length < 5) {
      base32 += BASE32_ALPHABET[parseInt(chunk.padEnd(5, '0'), 2)];
    } else {
      base32 += BASE32_ALPHABET[parseInt(chunk, 2)];
    }
  }
  // Add padding
  while (base32.length % 8 !== 0) {
    base32 += '=';
  }
  return base32;
}

export function base32Decode(base32: string): Buffer {
  const cleaned = (base32 || '')
    .toUpperCase()
    .replace(/=+$/, '')
    .replace(/\s+/g, '');
  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (val === -1) {
      throw new Error(`Invalid Base32 character: ${cleaned[i]}`);
    }
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * 20 baytlık (160 bit) standart ve güvenli bir TOTP Base32 secret anahtarı üretir.
 */
export function generateTOTPSecret(): string {
  const randomBytes = crypto.randomBytes(20);
  return base32Encode(randomBytes).replace(/=+$/, '');
}

/**
 * RFC 6238 spesifikasyonuna uygun 6 basamaklı TOTP kodu üretir.
 */
export function generateTOTP(
  secret: string,
  timeStepSeconds = 30,
  digits = 6,
  offsetSteps = 0
): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / timeStepSeconds) + offsetSteps;
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binary % Math.pow(10, digits)).toString().padStart(digits, '0');
  return otp;
}

/**
 * Kullanıcının Google Authenticator uygulamasından girdiği 6 haneli kodu doğrular.
 * Saat kaymalarını tolere etmek için varsayılan olarak ±1 adım (±30 saniye) pencere uygular.
 */
export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  const cleanedToken = (token || '').toString().trim().replace(/\s+/g, '');
  if (cleanedToken.length !== 6 || !/^\d{6}$/.test(cleanedToken)) {
    return false;
  }
  try {
    for (let i = -window; i <= window; i++) {
      if (generateTOTP(secret, 30, 6, i) === cleanedToken) {
        return true;
      }
    }
  } catch (err) {
    console.error('[verifyTOTP] Error verifying token:', err);
    return false;
  }
  return false;
}

/**
 * Google Authenticator ve diğer 2FA uygulamalarının QR kod ile okuduğu standart otpauth:// URI'sini üretir.
 */
export function generateOTPAuthURI(opts: {
  issuer: string;
  accountName: string;
  secret: string;
}): string {
  const issuer = encodeURIComponent(opts.issuer);
  const account = encodeURIComponent(opts.accountName);
  const secret = opts.secret.replace(/=+$/, '');
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
