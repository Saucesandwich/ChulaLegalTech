import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const entries = {
  company: 'web/index.html',
  applicant: 'web/candidate.html',
  companyScript: 'web/app.js',
  applicantScript: 'web/candidate.js',
  styles: 'web/styles.css'
};
const assets = Object.fromEntries(await Promise.all(Object.entries(entries).map(async ([key, path]) =>
  [key, await readFile(new URL(path, root), 'utf8')]
)));
const worker = (await Promise.all(['hiring-data.mjs', 'privacy.mjs', 'hiring-ui.mjs', 'demo.mjs'].map(file =>
  readFile(new URL('worker/' + file, root), 'utf8')
))).join('\n');
await mkdir(new URL('dist/server/', root), { recursive: true });
await writeFile(new URL('dist/server/index.js', root), `const assets = ${JSON.stringify(assets)};\n${worker}`);
