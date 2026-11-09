import assert from 'node:assert/strict';
import { openLocalD1 } from './local-d1.mjs';
import worker from '../dist/server/index.js';

const origin = 'https://demo.example';
const env = {
  DB: openLocalD1(),
  DEMO_SESSION_SECRET: 'local-test-only',
  COMPANY_DEMO_PASSWORD: 'local-company',
  APPLICANT_DEMO_PASSWORD: 'local-applicant'
};
const request = (path, options) => worker.fetch(new Request(origin + path, options), env);
const post = (path, body, cookie = '') => request(path, {
  method: 'POST', headers: { origin, cookie }, body: new URLSearchParams(body)
});
async function signIn(role) {
  const reply = await post('/login/' + role, { username: role + '-demo', password: 'local-' + role });
  assert.equal(reply.headers.get('location'), '/' + role);
  return reply.headers.get('set-cookie').split(';')[0];
}
const company = await signIn('company');
const applicant = await signIn('applicant');
assert.equal((await request('/company', { headers: { cookie: applicant } })).headers.get('location'), '/applicant');
const act = async (cookie, body, outcome = 'done') => {
  const reply = await post('/hiring', body, cookie);
  assert.equal(reply.status, 303);
  assert.match(reply.headers.get('location'), new RegExp('result=' + outcome));
};
const listing = { action: 'post', district: 'bangna', shift: 'day', duration: '7', retention: '0', notice: 'yes' };
const screening = { notice: 'yes', schedule: 'yes' };
await act(applicant, { ...listing, occupation: 'warehouse', evidence: 'none' }, 'blocked');
await act(company, { ...listing, occupation: 'warehouse', evidence: 'criminal-record' }, 'blocked');
await act(company, { ...listing, occupation: 'warehouse', evidence: 'forklift' });
await act(company, { ...listing, occupation: 'security', evidence: 'licence' });
const job = occupation => env.DB.prepare('SELECT id FROM hiring_jobs WHERE occupation = ?').bind(occupation).first().id;
const warehouse = job('warehouse');
const security = job('security');
const page = async (role, cookie) => {
  const reply = await request('/' + role, { headers: { cookie } });
  assert.equal(reply.status, 200);
  return reply.text();
};
assert.match(await page('applicant', applicant), /ยังขาดผลรับรอง/);
await act(applicant, { action: 'apply', job: warehouse, ...screening }, 'blocked');
for (const category of ['forklift', 'licence']) {
  await act(applicant, { action: 'verify', category });
  assert.match(await page('company', company), /รอตรวจ/);
  await act(applicant, { action: 'verify-result', category, result: 'verified' }, 'blocked');
  await act(company, { action: 'verify-result', category, result: 'verified' });
}
await act(applicant, { action: 'apply', job: warehouse, notice: 'yes' }, 'blocked');
await act(applicant, { action: 'apply', job: warehouse, ...screening });
await act(applicant, { action: 'apply', job: warehouse, ...screening }, 'blocked');
await act(applicant, { action: 'apply', job: security, ...screening }, 'blocked');
await act(applicant, { action: 'request-review', job: security, ...screening });
await act(company, { action: 'case-result', job: security, result: 'clear' }, 'blocked');
await act(company, { action: 'case-result', job: security, result: 'hold', reviewed: 'yes' });
await act(applicant, { action: 'apply', job: security, ...screening }, 'blocked');
await act(applicant, { action: 'request-review', job: security, ...screening });
await act(company, { action: 'case-result', job: security, result: 'clear', reviewed: 'yes' });
await act(applicant, { action: 'apply', job: security, ...screening });
assert.match(await page('company', company), /ส่งใบสมัครแล้ว/);
await act(company, { action: 'close', job: security });
await page('company', company);
assert.equal(env.DB.prepare('SELECT status FROM hiring_cases WHERE job_id = ?').bind(security).first(), null);
await act(applicant, { action: 'apply', job: security, ...screening }, 'blocked');
console.log('Verified role access, evidence, occupational review, submission and expiry.');
