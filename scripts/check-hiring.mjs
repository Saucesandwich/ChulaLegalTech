import assert from 'node:assert/strict';
import { openLocalD1 } from './local-d1.mjs';
import worker from '../dist/server/index.js';

const origin = 'https://demo.example';
const env = {
  DB: openLocalD1(),
  DEMO_SESSION_SECRET: 'local-test-only'
};
const request = (path, options) => worker.fetch(new Request(origin + path, options), env);
const post = (path, body, cookie = '') => request(path, {
  method: 'POST', headers: { origin, cookie }, body: new URLSearchParams(body)
});
async function signIn(role, cookie) {
  const reply = await post('/login/' + role, {}, cookie);
  assert.equal(reply.headers.get('location'), '/' + role + '/overview');
  return reply.headers.get('set-cookie').split(';')[0];
}
const company = await signIn('company');
const applicant = await signIn('applicant', company);
const outsider = await signIn('company');
const space = company.split('.')[1];
assert.equal((await request('/company/overview', { headers: { cookie: applicant } })).headers.get('location'), '/applicant/overview');
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
const job = occupation => env.DB.prepare('SELECT id FROM hiring_jobs WHERE occupation = ? AND retain_days = 0 AND demo_space = ?')
  .bind(occupation, space).first().id;
const warehouse = job('warehouse');
const security = job('security');
const page = async (path, cookie) => {
  const reply = await request('/' + path, { headers: { cookie } });
  assert.equal(reply.status, 200);
  return reply.text();
};
assert.match(await page('company/overview', company), /ภาพรวมการสรรหา/);
assert.doesNotMatch(await page('company/overview', company), /name="occupation"/);
assert.match(await page('applicant/overview', applicant), /ภาพรวมการหางาน/);
assert.doesNotMatch(await page('applicant/overview', applicant), /name="q"/);
assert.match(await page('applicant/jobs?district=lat', applicant), /พบ 1 รายการ/);
await act(outsider, { action: 'close', job: warehouse }, 'blocked');
assert.match(await page('applicant/jobs', applicant), /ยังขาดผลรับรอง/);
await act(applicant, { action: 'apply', job: warehouse, ...screening }, 'blocked');
for (const category of ['forklift', 'licence']) {
  await act(applicant, { action: 'verify', category });
  assert.match(await page('company/jobs', company), /รอตรวจ/);
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
assert.match(await page('company/jobs', company), /ส่งใบสมัครแล้ว/);
await act(company, { action: 'close', job: security });
await page('company/overview', company);
assert.equal(env.DB.prepare('SELECT status FROM hiring_cases WHERE job_id = ?').bind(security).first(), null);
await act(applicant, { action: 'apply', job: security, ...screening }, 'blocked');
await act(applicant, { action: 'right-request', kind: 'erase' });
await act(applicant, { action: 'right-request', kind: 'erase' }, 'blocked');
const removal = env.DB.prepare("SELECT id FROM demo_rights_requests WHERE demo_space = ? AND kind = 'erase'").bind(space).first().id;
await act(outsider, { action: 'right-erase', request: removal, confirm: 'yes' }, 'blocked');
await act(company, { action: 'right-erase', request: removal }, 'blocked');
await act(company, { action: 'right-erase', request: removal, confirm: 'yes' });
assert.match(await page('applicant/rights', applicant), /ลบข้อมูลเดโมแล้ว/);
assert.equal(env.DB.prepare('SELECT status FROM hiring_cases WHERE job_id = ?').bind(warehouse).first(), null);
assert.match(await page('company/privacy?basis=standard&finish=2025-08-31', company), /28 กุมภาพันธ์ 2569/);
assert.doesNotMatch(await page('company/privacy?basis=exception&finish=2025-08-31', company), /28 กุมภาพันธ์ 2569/);
assert.match(await page('company/privacy', company), /พนักงานตัวอย่าง จ-024/);
assert.match(await page('company/jobs?audit=1&data=criminal&basis=unconfirmed', company), /พักการขอข้อมูล/);
assert.match(await page('company/jobs?audit=1&data=skill&basis=review&notice=ready&period=7', company), /เก็บตามแผนเดโม 7 วันหลังจบการคัดเลือก/);
console.log('Verified passwordless roles, workspace isolation, hiring, search, privacy requests and retention.');
