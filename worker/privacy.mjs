const privacyRights = {
  access: ['ขอดูหรือขอสำเนาข้อมูล', 'ตรวจว่าบริษัทมีข้อมูลอะไรเกี่ยวกับฉัน และขอสำเนาตามเงื่อนไขของกฎหมาย', 'มาตรา 30'],
  correct: ['ขอแก้ไขข้อมูล', 'ขอให้แก้ข้อมูลที่ผิด ไม่เป็นปัจจุบัน หรือทำให้เข้าใจผิด', 'มาตรา 35–36'],
  erase: ['ขอให้ลบข้อมูล', 'ขอให้ลบ ทำลาย หรือทำให้ระบุตัวไม่ได้เมื่อเข้าเงื่อนไข', 'มาตรา 33'],
  restrict: ['ขอระงับการใช้', 'ขอหยุดใช้ข้อมูลชั่วคราว เช่น ระหว่างตรวจความถูกต้อง', 'มาตรา 34'],
  object: ['คัดค้านการใช้ข้อมูล', 'คัดค้านการเก็บ ใช้ หรือเปิดเผยข้อมูลในกรณีที่กฎหมายกำหนด', 'มาตรา 32'],
  transfer: ['ขอรับหรือโอนข้อมูล', 'ขอรับหรือส่งต่อข้อมูลในรูปแบบที่อ่านได้ด้วยระบบอัตโนมัติเมื่อเข้าเงื่อนไข', 'มาตรา 31'],
  withdraw: ['ถอนความยินยอม', 'ใช้เมื่อการดำเนินการอาศัยความยินยอม การถอนมีผลต่อการใช้ข้อมูลหลังจากนั้นตามเงื่อนไข', 'มาตรา 19']
};

const requestStatuses = { pending: 'รอบริษัททบทวน', reviewed: 'บริษัททบทวนแล้ว', erased: 'ลบข้อมูลเดโมแล้ว' };
const crimeRules = '<a href="https://data.go.th/dataset/dataset_11_0419?is_fullscreen=1">ประกาศเรื่องการเก็บประวัติอาชญากรรม ข้อ 5–9</a>';

async function seedDemoJobs(db, space, now) {
  const examples = [
    ['warehouse', 'bangna', 'day', 'forklift', 7],
    ['packing', 'lat', 'evening', 'none', 0],
    ['security', 'phra', 'night', 'licence', 7]
  ];
  await db.batch(examples.map(([role, district, shift, evidence, retain]) =>
    db.prepare('INSERT INTO hiring_jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), role, district, shift, evidence, retain, now + 14 * day, now, space)));
}

async function writePrivacy(db, space, role, form, now) {
  const action = form.get('action');
  const kind = form.get('kind');
  if (role === 'applicant' && action === 'right-request' && owns(privacyRights, kind)) {
    const result = await db.prepare("INSERT OR IGNORE INTO demo_rights_requests VALUES (?, ?, ?, 'pending', ?, ?)")
      .bind(crypto.randomUUID(), space, kind, now, now).run();
    return Boolean(result.meta.changes);
  }
  const id = form.get('request');
  if (role !== 'company' || !['right-reviewed', 'right-erase'].includes(action)
    || !id || !/^[a-f0-9-]{36}$/.test(id)) return false;
  if (action === 'right-reviewed') {
    const result = await db.prepare("UPDATE demo_rights_requests SET status = 'reviewed', updated_at = ? WHERE id = ? AND demo_space = ? AND status = 'pending'")
      .bind(now, id, space).run();
    return Boolean(result.meta.changes);
  }
  if (form.get('confirm') !== 'yes') return false;
  const authorized = "EXISTS (SELECT 1 FROM demo_rights_requests WHERE id = ? AND demo_space = ? AND status = 'pending' AND kind = 'erase')";
  const results = await db.batch([
    db.prepare(`DELETE FROM hiring_cases WHERE job_id IN (SELECT id FROM hiring_jobs WHERE demo_space = ?) AND ${authorized}`).bind(space, id, space),
    db.prepare(`DELETE FROM demo_verifications WHERE demo_space = ? AND ${authorized}`).bind(space, id, space),
    db.prepare("UPDATE demo_rights_requests SET status = 'erased', updated_at = ? WHERE id = ? AND demo_space = ? AND status = 'pending' AND kind = 'erase'").bind(now, id, space)
  ]);
  return Boolean(results[2].meta.changes);
}

function rightsRequests(data, company) {
  return `<section class="panel hiring-panel" id="requests"><h2>${company ? 'คิวคำขอใช้สิทธิ' : 'ติดตามคำขอของฉัน'}</h2>
  <p>คำขอมีผลเฉพาะพื้นที่เดโมนี้ และเก็บสถานะไว้ 30 วันนับจากรายการล่าสุด</p>
  ${data.requests.map(row => {
    const fields = hiddenField('request', row.id);
    const pending = company && row.status === 'pending';
    const erase = pending && row.kind === 'erase' ? `<form method="post" action="/hiring" class="hiring-form">
      ${hiddenField('action', 'right-erase')}${fields}
      <label class="hiring-check"><input type="checkbox" name="confirm" value="yes" required> ยืนยันลบใบสมัคร ผลทบทวน และสถานะการรับรองทั้งหมดของผู้สมัครในพื้นที่นี้</label>
      <button class="primary-button">ลบข้อมูลเดโมตามคำขอ</button></form>` : '';
    return `<div class="hiring-row"><div><strong>${privacyRights[row.kind][0]}</strong><p>${requestStatuses[row.status]} · ${dateThai.format(row.updated_at)}</p></div>
      <div>${pending && row.kind !== 'erase' ? actionButton('right-reviewed', 'บันทึกว่าทบทวนแล้ว', fields) : ''}${erase}</div></div>`;
  }).join('') || '<p>ยังไม่มีคำขอ</p>'}</section>`;
}

function applicantRights(data) {
  const pending = new Set(data.requests.filter(row => row.status === 'pending').map(row => row.kind));
  return `<section class="panel hiring-panel"><h2>ก่อนสมัครและหลังเริ่มงาน</h2>
    <div class="hiring-job-grid">
      <div><h3>รู้ว่าข้อมูลจะถูกใช้อย่างไร</h3><p>ก่อนส่งใบสมัคร เปิดหัวข้อ “ข้อมูลที่ใช้” ในประกาศเพื่อดูวัตถุประสงค์ ผู้เข้าถึง และระยะเก็บ คุณมีสิทธิได้รับแจ้งรายละเอียดตามมาตรา 23</p></div>
      <div><h3>เช็กเงื่อนไขการจ้าง</h3><p>ขอรายละเอียดค่าจ้าง ค่าล่วงเวลา เวลาทำงาน วันหยุด และวันลา ตรวจสิทธิที่ใช้กับงานของคุณได้ที่ <a href="https://eservice.labour.go.th/">กรมสวัสดิการและคุ้มครองแรงงาน</a></p></div>
      <div><h3>ตรวจสถานะประกันสังคม</h3><p>ดูการขึ้นทะเบียนและสิทธิของตนเองที่ <a href="https://eself.sso.go.th/">สำนักงานประกันสังคม</a></p></div>
    </div></section>
    <section class="panel hiring-panel"><h2>สิทธิในข้อมูลส่วนบุคคล</h2><p>แต่ละสิทธิมีเงื่อนไขตามกฎหมาย คำขอในหน้านี้ส่งเข้าคิวบริษัทในเดโม <a href="https://www.dol.go.th/PDPA/Documents/PDPA/PDPA-Act2019.pdf">อ่านกฎหมายฉบับเต็ม</a></p>
    ${Object.entries(privacyRights).map(([id, [label, detail, section]]) => `<div class="hiring-row"><div><strong>${label}</strong><p>${detail} · ${section}</p></div>
      ${pending.has(id) ? chip('ส่งแล้ว · รอทบทวน', 'amber') : actionButton('right-request', 'ยื่นคำขอเดโม', hiddenField('kind', id))}</div>`).join('')}</section>
    ${rightsRequests(data, false)}`;
}

function sixMonthDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value) return null;
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 6);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDay));
  return date;
}

function retentionPanel(url) {
  const basis = url.searchParams.get('basis');
  const finish = url.searchParams.get('finish') ?? '';
  const date = sixMonthDate(finish);
  const dateLabel = date && new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeZone: 'Asia/Bangkok' }).format(date);
  const outcome = {
    none: 'ยังไม่มีฐานที่รองรับ ให้หยุดการขอข้อมูลและส่งทบทวนก่อน',
    standard: dateLabel ? 'วันที่อ้างอิงครบ 6 เดือน: ' + dateLabel + ' หากหมดความจำเป็นก่อน ให้จัดการข้อมูลเมื่อหมดความจำเป็น' : 'ระบุวันที่สิ้นสุดการดำเนินการเกี่ยวกับข้อมูลของบุคคลนั้นก่อน จึงจะแสดงวันที่อ้างอิงได้',
    exception: 'ส่งให้ผู้รับผิดชอบตรวจฐานและขอบเขตข้อยกเว้น พร้อมบันทึกเหตุผลและวันทบทวนก่อนเก็บต่อ'
  };
  return `<section class="panel hiring-panel" id="retention"><h2>เช็กกำหนดเก็บประวัติอาชญากรรม</h2>
  <p>ใช้คำนวณจากวันที่สมมติ ตามข้อ 9 โดยทั่วไปให้เก็บเท่าที่จำเป็นและไม่เกิน 6 เดือนนับจากเสร็จสิ้นการดำเนินการเกี่ยวกับข้อมูลของบุคคลนั้น เว้นแต่มีข้อยกเว้นที่เข้าเงื่อนไข ${crimeRules}</p>
  <form class="hiring-form" action="/company/privacy#retention" method="get"><div class="hiring-fields">
  <label>กรณีที่ทบทวน<select name="basis" required>
  ${Object.entries({none:'ยังไม่ยืนยันฐานการเก็บ', standard:'ยืนยันฐานแล้ว และใช้กรอบทั่วไป', exception:'มีเหตุที่อาจเข้าข้อยกเว้น'}).map(([id, label]) => `<option value="${id}"${basis === id ? ' selected' : ''}>${label}</option>`).join('')}</select></label>
  <label>วันที่เสร็จสิ้นการดำเนินการ (ถ้าทราบ)<input type="date" name="finish" value="${date ? finish : ''}"></label>
  </div><button class="secondary-button">ประเมินระยะเก็บ</button></form>
  ${owns(outcome, basis) ? `<p class="hiring-note" role="status">${outcome[basis]}</p>` : ''}
  <details class="hiring-plan"><summary>เช็กลิสต์ก่อนขอข้อมูลอ่อนไหว</summary><ol>
  <li>ระบุเหตุที่จำเป็นต่อหน้าที่งานและตรวจฐานที่รองรับ รวมถึงมาตรการสำหรับข้อมูลประวัติอาชญากรรม</li>
  <li>แจ้งวัตถุประสงค์และระยะเก็บ จำกัดการเข้าถึงให้เฉพาะผู้มีหน้าที่ และพิจารณาใช้ข้อมูลที่เปิดเผยน้อยกว่า</li>
  <li>บันทึกวันที่สิ้นสุดการดำเนินการ ตรวจข้อยกเว้น และลบ ทำลาย หรือทำให้ระบุตัวไม่ได้เมื่อครบกำหนดหรือหมดความจำเป็น</li></ol></details>
  </section>`;
}

function companyPrivacy(data, url, now) {
  const entries = data.jobs.filter(job => data.cases[job.id]).map(job => [
    occupations[job.occupation].label, 'สถานะใบสมัครและผลทบทวนเพื่อคัดเลือก',
    'ทีมสรรหาและผู้สมัครในเดโม', job.selection_end + job.retain_days * day
  ]);
  for (const row of Object.values(data.verifications)) entries.push([
    evidenceTypes[row.category], 'สถานะคำขอรับรองเพื่อเช็กคุณสมบัติ', 'ผู้ตรวจและผู้สมัครในเดโม', row.updated_at + 30 * day
  ]);
  return `${retentionPanel(url)}
  <section class="panel hiring-panel"><h2>ทะเบียนข้อมูลที่เก็บในพื้นที่นี้</h2><p>เดโมเก็บเฉพาะสถานะและเวลา รายการที่ครบกำหนดจะถูกลบในการใช้งานครั้งถัดไป</p>
  ${entries.map(([title, purpose, recipient, expiry]) => `<div class="hiring-row"><div><strong>${title}</strong>
    <p>${purpose} · ผู้เข้าถึง: ${recipient}</p><p>กำหนดลบตามแผน ${dateThai.format(expiry)}</p></div>
    ${expiry - now <= 7 * day ? chip('ครบกำหนดภายใน 7 วัน', 'amber') : chip('อยู่ในระยะเก็บ', 'green')}</div>`).join('') || '<p>ยังไม่มีใบสมัครหรือสถานะการรับรอง</p>'}</section>
  ${rightsRequests(data, true)}`;
}
