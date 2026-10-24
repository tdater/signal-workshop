// Downloads every current, published release artifact and checks its size, ZIP/APK magic bytes
// and SHA-256 against the release file in src/content/releases. Run it after editing a release
// file and before deploying. Exits non-zero on any mismatch.
//
//   npm run verify:downloads            # current releases only
//   npm run verify:downloads -- --all   # every release with an artifact
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';

const dir = new URL('../src/content/releases/', import.meta.url);
const all = process.argv.includes('--all');
const files = (await readdir(dir)).filter((f) => f.endsWith('.yaml'));
let failures = 0;
let checked = 0;

for (const f of files.sort()) {
  const r = parse(await readFile(new URL(f, dir), 'utf8'));
  if (!r.publicationApproved || !r.artifact || (!all && !r.current)) continue;
  const { url, bytes, sha256 } = r.artifact;
  checked++;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const problems = [];
    if (buf.length !== bytes) problems.push(`size ${buf.length} != ${bytes}`);
    if (buf.subarray(0, 4).toString('hex') !== '504b0304') problems.push('not a ZIP/APK');
    const got = createHash('sha256').update(buf).digest('hex');
    if (got !== sha256) problems.push(`sha256 ${got} != ${sha256}`);
    if (problems.length) {
      failures++;
      console.log(`FAIL ${f}: ${problems.join('; ')}`);
    } else console.log(`ok   ${f}: ${bytes} bytes, sha256 matches`);
  } catch (e) {
    failures++;
    console.log(`FAIL ${f}: ${e.message}`);
  }
}

console.log(`${checked} artifact(s) checked, ${failures} failure(s).`);
process.exit(failures ? 1 : 0);
