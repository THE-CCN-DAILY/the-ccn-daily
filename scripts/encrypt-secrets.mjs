/**
 * Encrypts GitHub Actions secrets using libsodium (crypto_box_seal)
 * and outputs JSON ready to be submitted via the GitHub web form.
 *
 * Usage: node scripts/encrypt-secrets.mjs
 * Outputs JSON array of { name, encryptedB64, keyId }
 */
import _sodium from 'libsodium-wrappers';

// Repo public key (from data-public-key on the GitHub secrets form)
const PUBLIC_KEY_B64 = 'BtyMp7UWJ8drdTVac7b7ApQvFE6qTRlKMQffa7CyMVs=';
const KEY_ID = '3380204578043523366';

// Secrets to encrypt — name → plaintext value
const SECRETS = {
  CLOUDFLARE_ACCOUNT_ID: '735fd2efdcd4e3e8eb9d14485540d8b7',
  VITE_FIREBASE_API_KEY: 'AIzaSyBVD2uuzfCN0BZAQC5z6BkjfjxeIwjQrAg',
  VITE_FIREBASE_AUTH_DOMAIN: 'ccn-daily.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'ccn-daily',
  VITE_FIREBASE_APP_ID: '1:534266478713:web:ff7fe4f4795695e10cd4a8',
  VITE_FIREBASE_STORAGE_BUCKET: 'ccn-daily.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '534266478713',
  VITE_FIREBASE_VAPID_KEY: 'BM56moSqJkCHI6JK_KCOBUOpV1R_IA0IxkSST14F8hsbO1Wljc9Cn_llyYlJa-jqDqsKyCJBkyX8VELcbImJmEg',
};

await _sodium.ready;
const sodium = _sodium;

// Decode public key from base64
const recipientPublicKey = sodium.from_base64(PUBLIC_KEY_B64, sodium.base64_variants.ORIGINAL);

const results = [];
for (const [name, value] of Object.entries(SECRETS)) {
  const messageBytes = sodium.from_string(value);
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, recipientPublicKey);
  const encryptedB64 = sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);
  results.push({ name, encryptedB64, keyId: KEY_ID });
  console.error(`✓ Encrypted ${name}`);
}

// Output JSON to stdout
console.log(JSON.stringify(results, null, 2));
