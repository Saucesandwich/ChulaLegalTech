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

const priorityIds = ['A-014','A-016','A-021','A-027'];
const priorityList = document.querySelector('#priority-list');
const table = document.querySelector('#application-table');
let activeFilter = 'all';

function tagFor(app) {
  if (app.status === 'ready') return '<span class="tag green">Ready to progress</span>';
  if (app.status === 'waiting') return '<span class="tag blue">Waiting on partner</span>';
  return app.issue.includes('scope') || app.issue.includes('condition') ? '<span class="tag grey">Review required</span>' : '<span class="tag amber">Needs action</span>';
}

function renderPriority() {
  priorityList.innerHTML = priorityIds.map(id => {
    const a = applications.find(item => item.id === id);
    return `<div class="action-row" data-case="${a.id}" role="button" tabindex="0"><span class="initials">${a.initials}</span><div class="action-copy"><strong>${a.name} · ${a.role}</strong><p>${a.issue} · Next: ${a.next}</p></div><div class="action-side">${tagFor(a)}<small>${a.due}</small></div></div>`;
  }).join('');
}

function renderTable() {
  const q = document.querySelector('#application-search').value.toLowerCase();
  const filtered = applications.filter(a => (activeFilter === 'all' || a.status === activeFilter) && `${a.id} ${a.name} ${a.role}`.toLowerCase().includes(q));
  table.innerHTML = filtered.length ? filtered.map(a => `<div class="application-row" data-case="${a.id}" role="button" tabindex="0">
    <div class="person-cell"><span class="initials">${a.initials}</span><div><strong>${a.name}</strong><small>${a.id} · ${a.role}</small></div></div>
    <div class="readiness"><i style="--score:${a.score}%;--bar:${a.color}"></i><b>${a.score}%</b></div>
    <div class="next-cell"><strong>${a.issue}</strong><small>${a.next}</small></div>
    <div class="owner-cell"><span class="avatar tiny">${a.ownerInitials}</span>${a.owner}</div>
    <div class="due-cell">${a.due}</div><span class="row-arrow">›</span>
  </div>`).join('') : '<div class="empty-state">No applications match this view.</div>';
}

function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  document.querySelector(`#${name}-view`).classList.add('active');
  document.querySelector('#page-name').textContent = name[0].toUpperCase() + name.slice(1);
  document.querySelector('.sidebar').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}

function openDrawer(id) {
  const app = applications.find(a => a.id === id) || applications[0];
  document.querySelector('#drawer-name').textContent = app.name;
  document.querySelector('#drawer-role').textContent = `${app.role} · Bang Na`;
  document.querySelector('.case-id').textContent = `APPLICATION ${app.id}`;
  document.querySelector('#case-drawer').classList.add('open');
  document.querySelector('#drawer-backdrop').classList.add('open');
  document.querySelector('#case-drawer').setAttribute('aria-hidden','false');
}

function closeDrawer() {
  document.querySelector('#case-drawer').classList.remove('open');
  document.querySelector('#drawer-backdrop').classList.remove('open');
  document.querySelector('#case-drawer').setAttribute('aria-hidden','true');
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
document.querySelector('#mark-requested').addEventListener('click', e => {
  e.currentTarget.textContent = '✓ Request sent'; e.currentTarget.disabled = true;
  const toast = document.querySelector('#toast'); toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3200);
});

renderPriority();
renderTable();
