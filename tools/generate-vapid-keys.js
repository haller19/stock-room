const { generateKeyPairSync } = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromJwkCoordinate(value) {
  return Buffer.from(
    value.replace(/-/g, '+').replace(/_/g, '/'),
    'base64',
  );
}

const { publicKey, privateKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
});

const publicJwk = publicKey.export({ format: 'jwk' });
const privateJwk = privateKey.export({ format: 'jwk' });

const rawPublicKey = Buffer.concat([
  Buffer.from([0x04]),
  fromJwkCoordinate(publicJwk.x),
  fromJwkCoordinate(publicJwk.y),
]);

console.log('PUSH_VAPID_PUBLIC_KEY=' + base64url(rawPublicKey));
console.log('VAPID_PUBLIC_KEY=' + base64url(rawPublicKey));
console.log('VAPID_PRIVATE_KEY=' + privateJwk.d);
console.log('VAPID_SUBJECT=mailto:your-email@example.com');
