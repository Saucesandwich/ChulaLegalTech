const applications = [
  { id:'A-014', initials:'SK', name:'Somchai K.', role:'Warehouse Associate', status:'action', score:68, color:'#ee8355', issue:'Training confirmation missing', next:'Request from CARE Bang Na', owner:'May S.', ownerInitials:'MS', due:'Today' },
  { id:'A-016', initials:'PT', name:'Pong T.', role:'Night Shift Picker', status:'action', score:54, color:'#ee8355', issue:'Proposed hours need review', next:'Confirm compatible schedule', owner:'Pat N.', ownerInitials:'PN', due:'Today' },
  { id:'A-019', initials:'NW', name:'Niran W.', role:'Delivery Assistant', status:'waiting', score:62, color:'#4f7fbb', issue:'Waiting on role details', next:'Employer to confirm duties', owner:'May S.', ownerInitials:'MS', due:'Tomorrow' },
  { id:'A-021', initials:'AS', name:'Anan S.', role:'Packing Operator', status:'action', score:76, color:'#ee8355', issue:'Processing purpose missing', next:'Record purpose and notice', owner:'Pat N.', ownerInitials:'PN', due:'Today' },
  { id:'A-023', initials:'SC', name:'Sakda C.', role:'Forklift Operator', status:'waiting', score:58, color:'#4f7fbb', issue:'Partner verification pending', next:'CARE review in progress', owner:'CARE', ownerInitials:'CA', due:'12 Nov' },
  { id:'A-024', initials:'WP', name:'Wichai P.', role:'Inventory Clerk', status:'ready', score:100, color:'#0d7a66', issue:'Assessment completed', next:'Proceed to interview', owner:'Pat N.', ownerInitials:'PN', due:'Ready' },
  { id:'A-027', initials:'KS', name:'Krit S.', role:'Warehouse Associate', status:'action', score:46, color:'#765b98', issue:'Outside reviewed scope', next:'Assign legal review', owner:'Legal', ownerInitials:'LR', due:'13 Nov' },
  { id:'A-028', initials:'TT', name:'Tana T.', role:'Cleaning Assistant', status:'waiting', score:71, color:'#4f7fbb', issue:'Identity evidence pending', next:'Partner upload requested', owner:'Restart', ownerInitials:'RA', due:'14 Nov' },
  { id:'A-030', initials:'NP', name:'Nop P.', role:'Goods Receiver', status:'action', score:61, color:'#ee8355', issue:'Job location unclear', next:'Confirm work site', owner:'May S.', ownerInitials:'MS', due:'14 Nov' },
  { id:'A-031', initials:'CK', name:'Chai K.', role:'Packing Operator', status:'action', score:73, color:'#ee8355', issue:'Notice evidence missing', next:'Attach notice record', owner:'Pat N.', ownerInitials:'PN', due:'15 Nov' },
  { id:'A-032', initials:'NK', name:'Nat K.', role:'Warehouse Associate', status:'waiting', score:64, color:'#4f7fbb', issue:'Skills verification pending', next:'Partner action', owner:'CARE', ownerInitials:'CA', due:'16 Nov' },
  { id:'A-034', initials:'VS', name:'Viroj S.', role:'Delivery Assistant', status:'action', score:52, color:'#765b98', issue:'Work condition review', next:'Confirm route and hours', owner:'Legal', ownerInitials:'LR', due:'17 Nov' }
];

const thaiCases = {
  'A-014':['สมชาย ก.','พนักงานคลังสินค้า','ขาดหลักฐานการอบรม','ขอการยืนยันจาก CARE บางนา','วันนี้'],
  'A-016':['พงษ์ ท.','พนักงานจัดสินค้ากะกลางคืน','ต้องทบทวนเวลาทำงาน','ยืนยันตารางเวลาที่เหมาะสม','วันนี้'],
  'A-019':['นิรันดร์ ว.','ผู้ช่วยจัดส่ง','รอรายละเอียดหน้าที่งาน','นายจ้างยืนยันหน้าที่งาน','พรุ่งนี้'],
  'A-021':['อนันต์ ส.','พนักงานแพ็กสินค้า','ยังไม่ระบุวัตถุประสงค์ใช้ข้อมูล','บันทึกวัตถุประสงค์และคำแจ้ง','วันนี้'],
  'A-023':['ศักดา ช.','พนักงานรถยก','รอภาคีตรวจสอบ','CARE กำลังตรวจสอบ','12 พ.ย.'],
  'A-024':['วิชัย พ.','เจ้าหน้าที่สินค้าคงคลัง','ประเมินเสร็จแล้ว','ดำเนินการสัมภาษณ์','พร้อม'],
  'A-027':['กฤต ส.','พนักงานคลังสินค้า','อยู่นอกขอบเขตที่ตรวจแล้ว','ส่งฝ่ายกฎหมายตรวจสอบ','13 พ.ย.'],
  'A-028':['ธนา ท.','ผู้ช่วยงานทำความสะอาด','รอหลักฐานยืนยันตัวตน','ขอให้ภาคีเพิ่มข้อมูล','14 พ.ย.'],
  'A-030':['นพ พ.','พนักงานรับสินค้า','สถานที่ทำงานไม่ชัดเจน','ยืนยันสถานที่ทำงาน','14 พ.ย.'],
  'A-031':['ชัย ก.','พนักงานแพ็กสินค้า','ขาดหลักฐานคำแจ้งข้อมูล','แนบหลักฐานคำแจ้ง','15 พ.ย.'],
  'A-032':['ณัฐ ก.','พนักงานคลังสินค้า','รอตรวจสอบทักษะ','รอภาคีดำเนินการ','16 พ.ย.'],
  'A-034':['วิโรจน์ ส.','ผู้ช่วยจัดส่ง','ทบทวนเงื่อนไขการทำงาน','ยืนยันเส้นทางและเวลา','17 พ.ย.']
};

const priorityIds = ['A-014','A-016','A-021','A-027'];
const priorityList = document.querySelector('#priority-list');
const table = document.querySelector('#application-table');
let activeFilter = 'all';
let currentLang = 'th';

function localized(app, field) {
  if (currentLang === 'en') return app[field];
  const values = thaiCases[app.id];
  return values[{name:0,role:1,issue:2,next:3,due:4}[field]] || app[field];
}

function tagFor(app) {
  if (app.status === 'ready') return `<span class="tag green">${currentLang === 'th' ? 'พร้อมดำเนินการต่อ' : 'Ready to progress'}</span>`;
  if (app.status === 'waiting') return `<span class="tag blue">${currentLang === 'th' ? 'รอภาคีเครือข่าย' : 'Waiting on partner'}</span>`;
  const review = app.issue.includes('scope') || app.issue.includes('condition');
  return `<span class="tag ${review ? 'grey' : 'amber'}">${currentLang === 'th' ? (review ? 'ต้องทบทวน' : 'ต้องดำเนินการ') : (review ? 'Review required' : 'Needs action')}</span>`;
}

function renderPriority() {
  priorityList.innerHTML = priorityIds.map(id => {
    const a = applications.find(item => item.id === id);
    return `<div class="action-row" data-case="${a.id}" role="button" tabindex="0"><span class="initials">${a.initials}</span><div class="action-copy"><strong>${localized(a,'name')} · ${localized(a,'role')}</strong><p>${localized(a,'issue')} · ${currentLang === 'th' ? 'ขั้นตอนถัดไป' : 'Next'}: ${localized(a,'next')}</p></div><div class="action-side">${tagFor(a)}<small>${localized(a,'due')}</small></div></div>`;
  }).join('');
}

function renderTable() {
  const q = document.querySelector('#application-search').value.toLowerCase();
  const filtered = applications.filter(a => (activeFilter === 'all' || a.status === activeFilter) && `${a.id} ${a.name} ${a.role} ${localized(a,'name')} ${localized(a,'role')}`.toLowerCase().includes(q));
  table.innerHTML = filtered.length ? filtered.map(a => `<div class="application-row" data-case="${a.id}" role="button" tabindex="0">
    <div class="person-cell"><span class="initials">${a.initials}</span><div><strong>${localized(a,'name')}</strong><small>${a.id} · ${localized(a,'role')}</small></div></div>
    <div class="readiness"><i style="--score:${a.score}%;--bar:${a.color}"></i><b>${a.score}%</b></div>
    <div class="next-cell"><strong>${localized(a,'issue')}</strong><small>${localized(a,'next')}</small></div>
    <div class="owner-cell"><span class="avatar tiny">${a.ownerInitials}</span>${a.owner}</div>
    <div class="due-cell">${localized(a,'due')}</div><span class="row-arrow">›</span>
  </div>`).join('') : `<div class="empty-state">${currentLang === 'th' ? 'ไม่พบใบสมัครที่ตรงกับตัวกรอง' : 'No applications match this view.'}</div>`;
}

function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  document.querySelector(`#${name}-view`).classList.add('active');
  const selectedNav = document.querySelector(`.nav-item[data-view="${name}"]`);
  document.querySelector('#page-name').textContent = selectedNav?.dataset[currentLang] || name;
  document.querySelector('.sidebar').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}

function openDrawer(id) {
  const app = applications.find(a => a.id === id) || applications[0];
  document.querySelector('#drawer-name').textContent = localized(app,'name');
  document.querySelector('#drawer-role').textContent = `${localized(app,'role')} · บางนา`;
  document.querySelector('.case-id').textContent = `${currentLang === 'th' ? 'ใบสมัคร' : 'APPLICATION'} ${app.id}`;
  document.querySelector('#case-drawer').classList.add('open');
  document.querySelector('#drawer-backdrop').classList.add('open');
  document.querySelector('#case-drawer').setAttribute('aria-hidden','false');
}

function closeDrawer() {
  document.querySelector('#case-drawer').classList.remove('open');
  document.querySelector('#drawer-backdrop').classList.remove('open');
  document.querySelector('#case-drawer').setAttribute('aria-hidden','true');
}

function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-th][data-en]').forEach(el => {
    const value = el.dataset[lang];
    if (el.classList.contains('nav-item')) {
      const label = el.querySelector('.nav-label'); if (label) label.textContent = value;
    } else {
      el.textContent = value;
    }
  });
  const toggle = document.querySelector('#language-toggle');
  toggle.classList.toggle('english', lang === 'en');
  document.querySelector('#application-search').placeholder = lang === 'th' ? 'ค้นหาชื่อ ตำแหน่ง หรือรหัส' : 'Search name, role or ID';
  const activeView = document.querySelector('.view.active')?.id.replace('-view','') || 'overview';
  const activeNav = document.querySelector(`.nav-item[data-view="${activeView}"]`);
  document.querySelector('#page-name').textContent = activeNav?.dataset[lang] || activeView;
  renderPriority(); renderTable();
}

function showToast(title, detail) {
  const toast = document.querySelector('#toast');
  toast.querySelector('strong').textContent = title;
  toast.querySelector('small').textContent = detail;
  toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3200);
}

document.addEventListener('click', e => {
  const nav = e.target.closest('[data-view]'); if (nav) switchView(nav.dataset.view);
  const go = e.target.closest('[data-go]'); if (go) switchView(go.dataset.go);
  const row = e.target.closest('[data-case]'); if (row) openDrawer(row.dataset.case);
  const filter = e.target.closest('[data-filter]');
  if (filter) { document.querySelectorAll('.filter').forEach(f => f.classList.remove('active')); filter.classList.add('active'); activeFilter = filter.dataset.filter; renderTable(); }
});
document.addEventListener('keydown', e => { const row = e.target.closest?.('[data-case]'); if (row && (e.key === 'Enter' || e.key === ' ')) openDrawer(row.dataset.case); if(e.key === 'Escape') closeDrawer(); });
document.querySelector('#application-search').addEventListener('input', renderTable);
document.querySelector('#close-drawer').addEventListener('click', closeDrawer);
document.querySelector('#drawer-backdrop').addEventListener('click', closeDrawer);
document.querySelector('.menu-button').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
document.querySelector('#add-application').addEventListener('click', () => { switchView('applications'); document.querySelector('#application-search').focus(); });
document.querySelector('#language-toggle').addEventListener('click', () => applyLanguage(currentLang === 'th' ? 'en' : 'th'));
document.querySelector('#mark-requested').addEventListener('click', e => {
  e.currentTarget.textContent = currentLang === 'th' ? '✓ ส่งคำขอแล้ว' : '✓ Request sent'; e.currentTarget.disabled = true;
  showToast(currentLang === 'th' ? 'บันทึกคำขอแล้ว' : 'Request recorded', currentLang === 'th' ? 'CARE บางนาจะได้รับงานนี้' : 'CARE Bang Na will appear as the action owner.');
});
document.querySelector('#upload-training').addEventListener('click', () => showToast(currentLang === 'th' ? 'พร้อมเพิ่มหลักฐาน' : 'Ready to add evidence', currentLang === 'th' ? 'ต้นแบบจะเปิดขั้นตอนอัปโหลดแบบปลอดภัยในระบบจริง' : 'The full product will open a secure evidence flow.'));
document.querySelectorAll('.save-job').forEach(button => button.addEventListener('click', () => { button.classList.toggle('saved'); button.textContent = button.classList.contains('saved') ? '♥' : '♡'; showToast(currentLang === 'th' ? 'บันทึกงานแล้ว' : 'Job saved', currentLang === 'th' ? 'คุณดูงานนี้ได้อีกครั้งในรายการที่บันทึก' : 'You can revisit it in your saved jobs.'); }));
document.querySelector('#appointment-detail').addEventListener('click', () => showToast(currentLang === 'th' ? 'นัดหมาย 12 พ.ย. 10:30 น.' : 'Appointment · 12 Nov, 10:30', currentLang === 'th' ? 'เตรียมสัมภาษณ์กับคุณเมย์ที่ CARE บางนา' : 'Interview preparation with May at CARE Bang Na.'));
document.querySelector('#privacy-manage').addEventListener('click', () => showToast(currentLang === 'th' ? 'การเข้าถึงข้อมูล' : 'Information access', currentLang === 'th' ? 'ขณะนี้แชร์ 3 รายการกับ Acme Logistics' : '3 items are currently shared with Acme Logistics.'));
document.querySelector('#contact-coach').addEventListener('click', () => showToast(currentLang === 'th' ? 'แจ้งพี่เลี้ยงแล้ว' : 'Coach notified', currentLang === 'th' ? 'คุณเมย์จะติดต่อกลับผ่านช่องทางที่คุณเลือก' : 'May will contact you through your preferred channel.'));

applyLanguage('th');
