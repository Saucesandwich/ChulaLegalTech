const dateThai = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' });
const choice = (name, entries) => `<select name="${name}" required>${Object.entries(entries).map(([id, label]) =>
  `<option value="${id}">${label}</option>`).join('')}</select>`;
const chip = (label, color = 'blue') => `<span class="tag ${color}">${label}</span>`;
const hiddenField = (name, value) => `<input type="hidden" name="${name}" value="${value}">`;
const actionButton = (action, label, fields = '', style = 'secondary-button') =>
  `<form method="post" action="/hiring">${hiddenField('action', action)}${fields}<button class="${style}">${label}</button></form>`;
const occupationsLabels = Object.fromEntries(Object.entries(occupations).map(([id, row]) => [id, row.label]));
const legalSources = `<a href="https://www.mdes.go.th/law/detail/3830-%E0%B8%AB%E0%B8%99%E0%B8%B1%E0%B8%87%E0%B8%AA%E0%B8%B7%E0%B8%AD-%E0%B8%9E-%E0%B8%A3-%E0%B8%9A-%E0%B8%84%E0%B8%B8%E0%B9%89%E0%B8%A1%E0%B8%84%E0%B8%A3%E0%B8%AD%E0%B8%87%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%AA%E0%B9%88%E0%B8%A7%E0%B8%99%E0%B8%9A%E0%B8%B8%E0%B8%84%E0%B8%84%E0%B8%A5-%E0%B8%9E-%E0%B8%A8--2562">พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล มาตรา 22, 23, 26 และ 37</a>`;

function dataPlan(job) {
  const evidence = job.evidence === 'none' ? '' :
    `<li>สถานะการรับรอง “${evidenceTypes[job.evidence]}” เพื่อเช็กคุณสมบัติ ระบบตรวจสถานะก่อนดำเนินการและไม่แนบไฟล์กับใบสมัคร</li>`;
  const review = occupations[job.occupation].review ?
    '<li>สถานะการทบทวนของตำแหน่งนี้ เพื่อดูว่าดำเนินการต่อในเดโมได้หรือไม่</li>' : '';
  return `<details class="hiring-plan"><summary>ข้อมูลที่ใช้ เหตุผล ผู้เข้าถึง และระยะเวลาเก็บ</summary>
    <ul><li>รหัสบัญชีเดโมโดยนัย ตำแหน่งที่เลือก สถานะและเวลาที่ทำรายการ เพื่อจัดการใบสมัคร</li>
    <li>ยืนยันว่าเวลางานและสถานที่เหมาะกับตนเอง ใช้คัดกรองในขั้นตอนนี้ ระบบไม่บันทึกเงื่อนไขส่วนบุคคล</li>${evidence}${review}</ul>
    <p>ผู้เข้าถึงเคส: ผู้สมัครและทีมสรรหาบริษัทในเดโม ไม่มีช่องขอประวัติอาชญากรรม เอกสารพ้นโทษ เลขบัตรประชาชน หรือสำเนาใบรับรอง</p>
    <p>สิ้นสุดการคัดเลือกตามแผน ${dateThai.format(job.selection_end)} · เก็บเคส ${job.retain_days} วันหลังจบการคัดเลือก · ครบกำหนด ${dateThai.format(job.selection_end + job.retain_days * day)} หากปิดก่อน ระบบนับใหม่จากเวลาที่ปิด</p>
    <p>ระบบลบเคสที่ครบกำหนดเมื่อมีการใช้งานครั้งถัดไป หากต้องการตรวจสอบรายการ ติดต่อผู้ดูแลการทดสอบ</p>
    <p>${legalSources} · <a href="https://data.go.th/dataset/dataset_11_0419?is_fullscreen=1">ประกาศเกี่ยวกับการเก็บประวัติอาชญากรรม</a></p></details>`;
}

function publishPanel(url) {
  const selected = url.searchParams.get('occupation');
  const occupation = owns(occupations, selected) ? selected : 'warehouse';
  const options = Object.fromEntries(jobEvidenceOptions(occupation).map(id => [id, evidenceTypes[id] ?? 'ไม่ขอหลักฐานเพิ่ม']));
  return `<section class="panel hiring-panel" id="publish"><h2>เปิดรับสมัครงาน</h2>
    <nav class="hiring-options" aria-label="เลือกตำแหน่ง">${Object.entries(occupations).map(([id, row]) =>
      `<a href="/company/jobs?occupation=${id}#publish"${id === occupation ? ' aria-current="true"' : ''}>${row.label}</a>`).join('')}</nav>
    <form class="hiring-form" method="post" action="/hiring">
      ${hiddenField('action', 'post')}${hiddenField('occupation', occupation)}
      <h3>${occupations[occupation].label}</h3>
      <div class="hiring-fields">
        <label>พื้นที่ทำงาน${choice('district', districts)}</label>
        <label>เวลาทำงาน${choice('shift', shifts)}</label>
        <label>หลักฐานที่ต้องมีเพื่อสมัคร${choice('evidence', options)}</label>
        <label>รับสมัครและคัดเลือกให้เสร็จภายใน${choice('duration', {7:'7 วัน', 14:'14 วัน', 30:'30 วัน'})}</label>
        <label>เก็บใบสมัครหลังจบการคัดเลือก${choice('retention', {0:'ลบเมื่อสิ้นสุดการคัดเลือก', 7:'7 วัน', 30:'30 วัน'})}</label>
      </div>
      <div class="hiring-note"><strong>ผลประเมินข้อมูลสำหรับตำแหน่งนี้</strong>
      <p>${occupations[occupation].review ? 'ขอผลรับรองคุณสมบัติวิชาชีพ และส่งให้ผู้ทบทวนพิจารณาเป็นรายตำแหน่งก่อนเปิดปุ่มสมัคร' : 'ใช้เพียงสถานะหลักฐานทักษะที่บริษัทเลือกและคำยืนยันว่าทำงานตามกะและพื้นที่ได้'}</p>
      <p>เดโมไม่รับประวัติอาชญากรรมหรือเอกสารอ่อนไหว การตรวจจริงต้องให้ผู้รับผิดชอบทบทวนข้อกำหนด ฐานการใช้ข้อมูล และมาตรการที่เกี่ยวข้องก่อน</p></div>
      <label class="hiring-check"><input type="checkbox" name="notice" value="yes" required> เลือกหลักฐานเท่าที่จำเป็นและยืนยันให้แสดงประกาศข้อมูลก่อนส่งใบสมัคร</label>
      <button class="primary-button">เปิดรับสมัคร</button>
    </form></section>`;
}

function verificationPanel(role, rows) {
  const applicant = role === 'applicant';
  return `<section class="panel hiring-panel" id="verify"><h2>${applicant ? 'การรับรองของฉัน' : 'คำขอรับรองที่รอตรวจ'}</h2>
    <p>${applicant ? 'เลือกหัวข้อที่ต้องการยื่น ระบบส่งเฉพาะหัวข้อและสถานะให้ผู้ตรวจในเดโม ไม่มีการอัปโหลดเอกสาร สถานะครบกำหนด 30 วันนับจากรายการล่าสุด' : 'คุณกำลังจำลองผู้ตรวจหลักฐาน ผลที่บันทึกใช้กับหัวข้อนี้เท่านั้น'}</p>
    <div class="hiring-list">${Object.entries(evidenceTypes).map(([id, label]) => {
      const row = rows[id];
      if (!applicant && row?.status !== 'pending') return '';
      const fields = hiddenField('category', id);
      const controls = applicant
        ? (!row || row.status === 'revise' ? actionButton('verify', 'ยื่นขอรับรอง', fields) : '')
        : actionButton('verify-result', 'รับรองในเดโม', fields + hiddenField('result', 'verified'), 'primary-button')
          + actionButton('verify-result', 'ขอให้ยื่นใหม่', fields + hiddenField('result', 'revise'));
      return `<div class="hiring-row"><div><strong>${label}</strong>
        <p>${row ? verificationLabels[row.status] + ' · ' + dateThai.format(row.updated_at) : 'ยังไม่ยื่น'}</p></div>
        <div class="hiring-actions">${controls}</div></div>`;
    }).join('') || '<p>ยังไม่มีคำขอที่รอตรวจ</p>'}</div></section>`;
}

function applicantJobAction(job, verification, hiringCase, now) {
  const gate = applyGate(job, verification, hiringCase, now);
  if (gate === 'evidence') return `<p>${chip('ยังขาดผลรับรอง', 'amber')} <a href="#verify">ไปยื่นขอรับรอง</a></p>`;
  if (gate === 'review' || gate === 'applied') return `<p>${chip(caseLabels[gate], gate === 'applied' ? 'green' : 'amber')}</p>`;
  if (gate === 'closed') return chip('ปิดการคัดเลือก', 'grey');
  const review = gate === 'request';
  return `${hiringCase?.status === 'hold' ? '<p>ผลล่าสุดยังสรุปไม่ได้ ยื่นขอทบทวนอีกครั้งได้เมื่อพร้อม</p>' : ''}
    <form method="post" action="/hiring" class="hiring-form">
    ${hiddenField('action', review ? 'request-review' : 'apply')}${hiddenField('job', job.id)}
    <label class="hiring-check"><input type="checkbox" name="schedule" value="yes" required> ฉันตรวจแล้วว่าสามารถทำงานในพื้นที่และเวลาที่ระบุได้</label>
    <label class="hiring-check"><input type="checkbox" name="notice" value="yes" required> ฉันอ่านรายละเอียดการใช้และเก็บข้อมูลแล้ว</label>
    <button class="primary-button">${review ? 'ขอทบทวนเงื่อนไขตำแหน่ง' : 'ส่งใบสมัครเดโม'}</button></form>`;
}

function companyJobAction(job, hiringCase, now) {
  const fields = hiddenField('job', job.id);
  const closed = job.selection_end <= now;
  return `<p>${hiringCase ? chip(caseLabels[hiringCase.status], hiringCase.status === 'applied' ? 'green' : 'amber') : 'ยังไม่มีคำขอหรือใบสมัคร'}</p>
    ${hiringCase?.status === 'review' && !closed ? `
    <form method="post" action="/hiring" class="hiring-form">
      ${hiddenField('action', 'case-result')}${fields}
      <label class="hiring-check"><input type="checkbox" name="reviewed" value="yes" required> ยืนยันว่าได้ทบทวนข้อกำหนดของตำแหน่ง คุณสมบัติ และความเหมาะสมของกะ/พื้นที่ในเคสจำลองนี้</label>
      <div class="hiring-actions"><button class="primary-button" name="result" value="clear">ให้ดำเนินการสมัครในเดโม</button><button class="secondary-button" name="result" value="hold">ยังสรุปไม่ได้</button></div>
    </form>` : ''}
    ${closed ? '' : actionButton('close', 'สิ้นสุดการคัดเลือก', fields)}`;
}

function searchJobs(url, data, now) {
  const query = (url.searchParams.get('q') ?? '').trim().slice(0, 60);
  const district = url.searchParams.get('district');
  const shift = url.searchParams.get('shift');
  const scope = url.searchParams.get('scope');
  return data.jobs.filter(job => {
    if (scope === 'mine' ? !data.cases[job.id] : job.selection_end <= now) return false;
    const text = [occupations[job.occupation].label, districts[job.district], evidenceTypes[job.evidence]].join(' ');
    return text.toLowerCase().includes(query.toLowerCase())
      && (!owns(districts, district) || job.district === district)
      && (!owns(shifts, shift) || job.shift === shift);
  });
}

function jobSearchForm(url) {
  const query = (url.searchParams.get('q') ?? '').slice(0, 60).replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const field = (name, all, entries) => `<select name="${name}"><option value="">${all}</option>
    ${Object.entries(entries).map(([id, label]) =>
      `<option value="${id}"${url.searchParams.get(name) === id ? ' selected' : ''}>${label}</option>`).join('')}</select>`;
  return `<form class="job-search" action="/applicant/jobs#jobs" method="get">
    <label>คำค้น<input name="q" value="${query}" maxlength="60" placeholder="เช่น คลังสินค้า หรือ รถยก"></label>
    <label>พื้นที่${field('district', 'ทุกพื้นที่', districts)}</label>
    <label>เวลาทำงาน${field('shift', 'ทุกกะ', shifts)}</label>
    <button class="primary-button">ค้นหางาน</button>
  </form>`;
}

function jobsPanel(role, data, now, url) {
  const company = role === 'company';
  const mine = url.searchParams.get('scope') === 'mine';
  const jobs = company ? data.jobs : searchJobs(url, data, now);
  return `<section class="hiring-panel jobs-results" id="jobs"><h2>${company ? 'ประกาศและสถานะใบสมัคร' : mine ? 'ใบสมัครและคำขอทบทวนของฉัน' : 'งานที่เปิดรับ'}</h2>
    ${company ? '' : `<div class="hiring-results"><span>พบ ${jobs.length} รายการ</span><a href="/applicant/jobs#jobs">งานทั้งหมด</a><a href="/applicant/jobs?scope=mine#jobs">ใบสมัครของฉัน</a></div>`}
    <div class="hiring-job-grid">${jobs.map(job => `<article class="panel hiring-job">
      ${chip(job.selection_end > now ? 'เปิดรับ' : 'ปิดการคัดเลือก', job.selection_end > now ? 'green' : 'grey')}
      <h3>${occupations[job.occupation].label}</h3><p>บริษัทตัวอย่างปาท่องโก๋ · ${districts[job.district]} · ${shifts[job.shift]}</p>
      <p>คุณสมบัติที่ขอ: ${evidenceTypes[job.evidence] ?? 'ไม่ขอหลักฐานเพิ่มเติม'}<br>
      ${occupations[job.occupation].review ? 'ต้องทบทวนข้อกำหนดเฉพาะตำแหน่งก่อนสมัคร' : 'ตรวจความพร้อมเบื้องต้นจากเงื่อนไขประกาศ'}</p>
      ${dataPlan(job)}
      ${company ? companyJobAction(job, data.cases[job.id], now)
        : applicantJobAction(job, data.verifications[job.evidence], data.cases[job.id], now)}
    </article>`).join('') || '<p>ยังไม่มีงานตรงกับรายการนี้</p>'}</div></section>`;
}

function companyHome(data, now) {
  const counts = [
    ['งานเปิดรับ', data.jobs.filter(job => job.selection_end > now).length, '/company/jobs#jobs'],
    ['ใบสมัครที่ส่งแล้ว', Object.values(data.cases).filter(row => row.status === 'applied').length, '/company/jobs#jobs'],
    ['หลักฐานรอตรวจ', Object.values(data.verifications).filter(row => row.status === 'pending').length, '/company/jobs#verify'],
    ['เคสรอทบทวนข้อกำหนด', data.jobs.filter(job => job.selection_end > now && data.cases[job.id]?.status === 'review').length, '/company/jobs#jobs'],
    ['คำขอใช้สิทธิที่รอทบทวน', data.requests.filter(row => row.status === 'pending').length, '/company/privacy#requests']
  ];
  return `<section class="hiring-panel"><h2>งานที่ต้องติดตาม</h2><div class="hiring-job-grid">${counts.map(([label, count, href]) =>
    `<a class="panel hiring-job overview-metric" href="${href}"><strong>${count}</strong><span>${label} →</span></a>`).join('')}</div></section>
    <section class="panel hiring-panel"><h2>จัดการงานของบริษัท</h2><div class="hiring-actions">
    <a class="workflow-link primary-button" href="/company/jobs#publish">เปิดรับสมัครงาน</a>
    <a class="workflow-link secondary-button" href="/company/privacy">จัดการข้อมูลและคำขอใช้สิทธิ</a></div></section>`;
}

function applicantHome(data, now) {
  const cases = Object.values(data.cases);
  const verifications = Object.values(data.verifications);
  const counts = [
    ['งานเปิดรับ', data.jobs.filter(job => job.selection_end > now).length, '/applicant/jobs'],
    ['ใบสมัครที่ส่งแล้ว', cases.filter(row => row.status === 'applied').length, '/applicant/jobs?scope=mine#jobs'],
    ['งานที่รอทบทวน', data.jobs.filter(job => job.selection_end > now && data.cases[job.id]?.status === 'review').length, '/applicant/jobs?scope=mine#jobs'],
    ['หลักฐานที่รับรองแล้ว', verifications.filter(row => row.status === 'verified').length, '/applicant/jobs#verify'],
    ['คำขอใช้สิทธิที่รอทบทวน', data.requests.filter(row => row.status === 'pending').length, '/applicant/rights#requests']
  ];
  return `<section class="hiring-panel"><h2>สรุปสถานะของฉัน</h2><div class="hiring-job-grid">${counts.map(([label, count, href]) =>
    `<a class="panel hiring-job overview-metric" href="${href}"><strong>${count}</strong><span>${label} →</span></a>`).join('')}</div></section>
    <section class="panel hiring-panel"><h2>เริ่มจากสิ่งที่คุณต้องการ</h2><div class="hiring-actions">
    <a class="workflow-link primary-button" href="/applicant/jobs">ค้นหางาน</a>
    <a class="workflow-link secondary-button" href="/applicant/jobs#verify">ยื่นขอรับรองหลักฐาน</a>
    <a class="workflow-link secondary-button" href="/applicant/rights">ดูสิทธิของฉัน</a></div></section>`;
}

function hiringPage(role, data, url, now) {
  const company = role === 'company';
  const section = url.pathname.split('/')[2] ?? 'overview';
  const title = company ? ({ jobs:'จัดการประกาศงาน', privacy:'จัดการข้อมูลอ่อนไหว' }[section] ?? 'ภาพรวมการสรรหา')
    : ({ jobs:'ค้นหางานที่เหมาะกับคุณ', rights:'สิทธิของฉัน' }[section] ?? 'ภาพรวมการหางาน');
  const menus = company ? [['/company/overview', 'ภาพรวม'], ['/company/jobs', 'ประกาศงาน'], ['/company/privacy', 'จัดการข้อมูล']]
    : [['/applicant/overview', 'ภาพรวม'], ['/applicant/jobs', 'ค้นหางาน'], ['/applicant/jobs?scope=mine#jobs', 'ใบสมัครของฉัน'], ['/applicant/jobs#verify', 'การรับรอง'], ['/applicant/rights', 'สิทธิของฉัน']];
  const other = company ? 'applicant' : 'company';
  const event = url.searchParams.get('result');
  const notice = event === 'done' ? '<p class="hiring-note" role="status">บันทึกแล้ว</p>' :
    event === 'blocked' ? '<p class="hiring-note" role="alert">บันทึกไม่ได้ กรุณาตรวจสิทธิ์ เงื่อนไข และสถานะล่าสุดก่อนลองใหม่</p>' : '';
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} · ปาท่องโก๋</title><link rel="stylesheet" href="/styles.css?v=5"></head>
  <body class="candidate-shell hiring-shell"><main>
    <header class="topbar"><a class="portal-brand" href="/${role}/overview">ปาท่องโก๋</a><div class="header-actions">
    <form method="post" action="/login/${other}"><button class="secondary-button">สลับไปฝั่ง${company ? 'ผู้สมัคร' : 'บริษัท'}</button></form></div></header>
    <nav class="portal-nav" aria-label="เมนูหลัก">${menus.map(([href, label]) => `<a href="${href}"${href === url.pathname && !url.searchParams.has('scope') ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    <div class="hiring-content"><div class="hiring-hero"><p class="eyebrow">${company ? 'พื้นที่บริษัท' : 'พื้นที่ผู้สมัคร'}</p><h1>${title}</h1>
    <p>${company ? 'ติดตามประกาศ ใบสมัคร และการจัดการข้อมูลในพื้นที่เดโมของคุณ' : section === 'overview' ? 'ติดตามใบสมัครและการรับรอง แล้วเลือกขั้นตอนถัดไปของคุณ' : 'ดูตำแหน่งที่เปิดรับและสิทธิที่เกี่ยวข้องกับการสมัครงาน'}</p>
    ${!company && section === 'jobs' ? jobSearchForm(url) : ''}</div>
    <p class="hiring-note">พื้นที่นี้ใช้ข้อมูลจำลองและแยกตามเบราว์เซอร์ ผลทบทวนใช้เพื่อทดลองตามตำแหน่งและเคส</p>
    ${notice}${company
      ? section === 'privacy' ? companyPrivacy(data, url, now)
        : section === 'jobs' ? publishPanel(url) + verificationPanel(role, data.verifications) + jobsPanel(role, data, now, url)
        : companyHome(data, now)
      : section === 'rights' ? applicantRights(data)
        : section === 'jobs' ? jobsPanel(role, data, now, url) + verificationPanel(role, data.verifications)
        : applicantHome(data, now)}
    </div></main></body></html>`;
}

async function handleHiring(request, url, env, { role, space }) {
  if (!env.DB) return response('ยังไม่ได้เชื่อมฐานข้อมูลเดโม', 'text/plain', 503);
  const now = Date.now();
  if (request.method === 'POST') {
    if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) {
      return response('รูปแบบข้อมูลไม่ถูกต้อง', 'text/plain', 415);
    }
    const body = await request.text();
    if (body.length > 2048) return response('ข้อมูลยาวเกินกำหนด', 'text/plain', 413);
    const form = new URLSearchParams(body);
    await expireHiringData(env.DB, now);
    const action = form.get('action') ?? '';
    const rights = action.startsWith('right-');
    const changed = rights ? await writePrivacy(env.DB, space, role, form, now) : await writeHiring(env.DB, space, role, form, now);
    const path = role === 'company' ? (rights ? '/company/privacy' : '/company/jobs') : (rights ? '/applicant/rights' : '/applicant/jobs');
    const anchor = rights ? '#requests' : ['verify', 'verify-result'].includes(action) ? '#verify' : '#jobs';
    return redirect(path + '?result=' + (changed ? 'done' : 'blocked') + anchor);
  }
  return response(hiringPage(role, await readHiring(env.DB, space, now), url, now), 'text/html');
}
