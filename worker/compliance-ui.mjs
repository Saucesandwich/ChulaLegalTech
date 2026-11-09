const complianceSteps = [
  ['01', 'ก่อนประกาศ', 'ตรวจว่าข้อมูลที่ขอจำเป็นกับตำแหน่ง และผู้สมัครจะเห็นคำแจ้งก่อนส่งข้อมูล', '/company/jobs#policy', 'ตรวจประกาศ'],
  ['02', 'ระหว่างคัดเลือก', 'ใช้ผลรับรองเท่าที่จำเป็น ส่งเคสที่มีข้อกำหนดเฉพาะให้ทบทวน', '/company/jobs#jobs', 'ดูเคสที่ต้องทบทวน'],
  ['03', 'หลังจบคัดเลือก', 'แยกข้อมูลคัดเลือกออกจากข้อมูลลูกจ้าง แล้วติดตามวันลบและคำขอใช้สิทธิ', '/company/privacy#inventory', 'ดูทะเบียนข้อมูล']
];

function policyResult({ data, basis, notice, period }) {
  if (data === 'criminal') return basis === 'unconfirmed'
    ? { label: 'พักการขอข้อมูล', color: 'red', detail: 'ยังไม่ยืนยันฐานตามมาตรา 26 และมาตรการที่ใช้ อย่าเปิดช่องขอประวัติอาชญากรรม ให้ทบทวนว่าผลรับรองเฉพาะคุณสมบัติใช้แทนได้ไหม' }
    : { label: 'ส่งทบทวนก่อนเก็บ', color: 'amber', detail: 'ให้ผู้รับผิดชอบตรวจว่าฐานที่ระบุใช้ได้กับงานและข้อมูลชุดนี้ รวมถึงข้อกำหนดในประกาศและมาตรการคุ้มครองเฉพาะ เดโมไม่เปิดรับเอกสารประวัติอาชญากรรม' };
  if (data === 'idcopy') return { label: 'ลดข้อมูลที่ขอ', color: 'red', detail: 'แม่แบบเดโมใช้สถานะยืนยันตัวตนแทนสำเนาบัตร ให้ตรวจความจำเป็นเฉพาะกรณีก่อนขอข้อมูลหรือเอกสารเพิ่ม' };
  if (basis === 'unconfirmed') return { label: 'ทบทวนฐานก่อนเก็บ', color: 'amber', detail: 'ระบุฐานการใช้ข้อมูลที่เหมาะสมกับวัตถุประสงค์ก่อนเริ่มเก็บ' };
  if (notice !== 'ready' || period === 'unset') return { label: 'แก้คำแจ้งและระยะเก็บ', color: 'amber', detail: 'แจ้งประเภทข้อมูล วัตถุประสงค์ ผู้รับ และระยะเก็บหรือเกณฑ์ที่ใช้กำหนด ก่อนเริ่มเก็บข้อมูล' };
  const retention = period === '0' ? 'ลบเมื่อจบการคัดเลือก' : `เก็บตามแผนเดโม ${period} วันหลังจบการคัดเลือก`;
  return { label: 'รายการตรวจเบื้องต้นครบ', color: 'green', detail: `ใช้ผลรับรองเท่าที่จำเป็น · ${retention} หากหมดความจำเป็นก่อนให้ลบก่อน ให้ตรวจฐานและความเหมาะสมกับหน้าที่งานก่อนใช้จริง` };
}

function postingAudit(url) {
  const fields = {
    data: ['ข้อมูลที่ต้องการขอ', { skill:'เฉพาะผลรับรองทักษะ', idcopy:'สำเนาบัตรประชาชน', criminal:'ประวัติอาชญากรรม' }],
    basis: ['ฐานการใช้ข้อมูล', { unconfirmed:'ยังไม่ได้ทบทวน', review:'ระบุฐานแล้ว รอตรวจความเหมาะสม' }],
    notice: ['คำแจ้งก่อนเก็บ', { missing:'ยังไม่ได้เตรียม', ready:'เตรียมประเภทข้อมูล วัตถุประสงค์ ผู้รับ และระยะเก็บแล้ว' }],
    period: ['นโยบายเก็บหลังจบคัดเลือกในเดโม', { unset:'ยังไม่กำหนด', 0:'ลบเมื่อจบคัดเลือก', 7:'7 วันหลังจบคัดเลือก', 30:'30 วันหลังจบคัดเลือก' }]
  };
  const values = Object.fromEntries(Object.entries(fields).map(([name, [, options]]) => {
    const value = url.searchParams.get(name);
    return [name, owns(options, value) ? value : name === 'period' ? 'unset' : Object.keys(options)[0]];
  }));
  const result = url.searchParams.has('audit') ? policyResult(values) : null;
  return `<section class="panel hiring-panel" id="policy">
    <div class="section-kicker">01 · ก่อนเปิดรับสมัคร</div><h2>ประกาศนี้ขอข้อมูลได้แค่ไหน?</h2>
    <p class="section-intro">เลือกสถานการณ์เพื่อดูสิ่งที่ต้องแก้ก่อนเก็บข้อมูล แบบตรวจนี้ไม่บันทึกข้อมูลของผู้สมัคร</p>
    <form class="hiring-form" action="/company/jobs#policy" method="get">
      ${hiddenField('audit', '1')}<div class="hiring-fields">
      ${Object.entries(fields).map(([name, [label, options]]) => `<label>${label}<select name="${name}">
        ${Object.entries(options).map(([id, text]) => `<option value="${id}"${values[name] === id ? ' selected' : ''}>${text}</option>`).join('')}
      </select></label>`).join('')}</div><button class="primary-button">ตรวจรายการก่อนประกาศ</button>
    </form>
    ${result ? `<div class="audit-result audit-${result.color}" role="status"><strong>${result.label}</strong><p>${result.detail}</p></div>`
      : '<div class="audit-result"><strong>ตัวอย่าง · งานคลังสินค้า</strong><p>ใช้ผลรับรองทักษะรถยกเพื่อดูคุณสมบัติ แทนการขอเอกสารทั้งชุด</p></div>'}
    <p class="section-intro">กรอบที่ใช้ตรวจ: ความจำเป็น คำแจ้ง ข้อมูลอ่อนไหว และการลบตามวัตถุประสงค์ · ${legalSources}</p>
  </section>`;
}

function complianceFlow() {
  return `<section class="panel hiring-panel"><div class="section-kicker">ขั้นตอนตามวงจรข้อมูล</div><h2>จากประกาศถึงวันลบข้อมูล</h2>
  <div class="compliance-steps">${complianceSteps.map(([number, title, body, href, label]) => `<article>
    <span class="step-index">${number}</span><h3>${title}</h3><p>${body}</p><a href="${href}">${label} →</a></article>`).join('')}</div></section>`;
}

function daysRemaining(expiry, now) {
  const days = Math.ceil((expiry - now) / day);
  return days > 0 ? `เหลือ ${days} วัน` : 'ถึงกำหนดแล้ว';
}

function employeeExamples(now) {
  const finished = now - 3 * day;
  const due = finished + 7 * day;
  return `<section class="panel hiring-panel" id="employees">
    <div class="section-kicker">ข้อมูลจำลอง · ผู้สมัครที่เริ่มงานแล้ว</div><h2>รับเข้าทำงานแล้ว เก็บอะไรต่อได้บ้าง?</h2>
    <p class="section-intro">คนเดียวกันอาจมีข้อมูลหลายชุด ให้กำหนดแยกตามวัตถุประสงค์และข้อกำหนดที่ใช้กับแต่ละชุด</p>
    <div class="retention-cards">
      <article class="retention-card">${chip(daysRemaining(due, now), 'amber')}
        <h3>พนักงานตัวอย่าง จ-024 · ข้อมูลคัดเลือก</h3>
        <dl><dt>รายการ</dt><dd>สถานะใบสมัครและผลรับรองทักษะ</dd><dt>ผู้เข้าถึง</dt><dd>ทีมสรรหา</dd>
        <dt>เริ่มนับจาก</dt><dd>จบการคัดเลือก ${dateThai.format(finished)}</dd>
        <dt>กำหนดตามนโยบายตัวอย่าง</dt><dd>7 วัน · ลบ ${dateThai.format(due)}</dd></dl>
        <p>นำเข้าระบบงานบุคคลเฉพาะรายการที่จำเป็นกับการจ้าง</p>
      </article>
      <article class="retention-card">${chip('กำหนดแยกตามหน้าที่', 'blue')}
        <h3>พนักงานตัวอย่าง จ-024 · ข้อมูลการจ้าง</h3>
        <dl><dt>รายการ</dt><dd>ข้อมูลสัญญา เงินเดือน และประกันสังคม</dd><dt>ผู้เข้าถึง</dt><dd>ทีมบุคคลหรือเงินเดือนตามหน้าที่</dd>
        <dt>ระยะเก็บ</dt><dd>ตรวจวัตถุประสงค์และกฎหมายของรายการนั้นก่อนกำหนดวันลบ</dd></dl>
        <p>กำหนด 7 วันของข้อมูลคัดเลือกใช้กับรายการนี้ไม่ได้</p>
      </article>
    </div></section>`;
}
