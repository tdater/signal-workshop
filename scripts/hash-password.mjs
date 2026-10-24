// Prints an ADMIN_PASSWORD_HASH value. The password is read from stdin (not argv, so it stays out
// of shell history): `npm run admin:hash`, type the password, press Enter.
import { createInterface } from 'node:readline';
import { hashPassword } from '../functions/_lib/crypto.ts';

const rl = createInterface({
  input: process.stdin,
  output: process.stderr,
  terminal: process.stdin.isTTY,
});
const ask = () =>
  new Promise((resolve) => {
    if (process.stdin.isTTY) process.stderr.write('Admin password (min 12 chars): ');
    rl.once('line', (l) => resolve(l));
  });
const pw = await ask();
rl.close();
if (pw.length < 12) {
  console.error('\nUse at least 12 characters.');
  process.exit(1);
}
console.log(await hashPassword(pw));
