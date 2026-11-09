const occupations = {
  warehouse: { label: 'พนักงานคลังสินค้า', review: false },
  packing: { label: 'พนักงานแพ็กสินค้า', review: false },
  security: { label: 'พนักงานรักษาความปลอดภัย', review: true },
  transport: { label: 'พนักงานขับรถขนส่ง', review: true },
  spa: { label: 'ผู้ให้บริการนวดในสถานประกอบการเพื่อสุขภาพ', review: true }
};
const districts = { bangna: 'บางนา', phra: 'พระโขนง', lat: 'ลาดกระบัง' };
const shifts = { day: '08:00–17:00 น.', evening: '14:00–22:00 น.', night: '22:00–06:00 น.' };
const evidenceTypes = {
  identity: 'ยืนยันตัวตน',
  warehouse: 'อบรมพื้นฐานงานคลังสินค้า',
  forklift: 'อบรมความปลอดภัยในการใช้รถยก',
  licence: 'ใบอนุญาตหรือคุณสมบัติวิชาชีพ'
};
const verificationLabels = { pending: 'รอตรวจ', verified: 'รับรองแล้วในเดโม', revise: 'ต้องยื่นใหม่' };
const caseLabels = { review: 'รอผู้ทบทวน', clear: 'ทบทวนแล้ว · ดำเนินการสมัครได้ในเดโม', hold: 'ยังสรุปผลไม่ได้', applied: 'ส่งใบสมัครแล้ว' };
const day = 86_400_000;
const owns = (entries, key) => Object.hasOwn(entries, key);

function jobEvidenceOptions(occupation) {
  if (occupations[occupation].review) return ['licence'];
  return occupation === 'warehouse' ? ['none', 'warehouse', 'forklift'] : ['none'];
}

function applyGate(job, verification, hiringCase, now) {
  if (job.selection_end <= now) return 'closed';
  if (hiringCase?.status === 'applied') return 'applied';
  if (job.evidence !== 'none' && verification?.status !== 'verified') return 'evidence';
  if (!occupations[job.occupation].review || hiringCase?.status === 'clear') return 'ready';
  if (hiringCase?.status === 'review') return 'review';
  return 'request';
}

async function expireHiringData(db, now) {
  await db.batch([
    db.prepare('DELETE FROM hiring_verifications WHERE updated_at + ? <= ?').bind(30 * day, now),
    db.prepare('DELETE FROM demo_verifications WHERE updated_at + ? <= ?').bind(30 * day, now),
    db.prepare('DELETE FROM demo_rights_requests WHERE updated_at + ? <= ?').bind(30 * day, now),
    db.prepare(`DELETE FROM hiring_cases WHERE job_id IN (
      SELECT id FROM hiring_jobs WHERE selection_end + retain_days * ? <= ?
    )`).bind(day, now)
  ]);
}

async function readHiring(db, space, now) {
  await expireHiringData(db, now);
  const [jobs, verifications, cases, requests] = await db.batch([
    db.prepare('SELECT * FROM hiring_jobs WHERE demo_space = ? ORDER BY created_at DESC LIMIT 60').bind(space),
    db.prepare('SELECT * FROM demo_verifications WHERE demo_space = ?').bind(space),
    db.prepare('SELECT hiring_cases.* FROM hiring_cases JOIN hiring_jobs ON hiring_jobs.id = job_id WHERE demo_space = ?').bind(space),
    db.prepare('SELECT * FROM demo_rights_requests WHERE demo_space = ? ORDER BY created_at DESC').bind(space)
  ]);
  return {
    jobs: jobs.results,
    verifications: Object.fromEntries(verifications.results.map(row => [row.category, row])),
    cases: Object.fromEntries(cases.results.map(row => [row.job_id, row])),
    requests: requests.results
  };
}

async function writeHiring(db, space, role, form, now) {
  const action = form.get('action');
  const category = form.get('category');
  if (role === 'applicant' && action === 'verify' && owns(evidenceTypes, category)) {
    const result = await db.prepare(`INSERT INTO demo_verifications VALUES (?, ?, 'pending', ?)
      ON CONFLICT(demo_space, category) DO UPDATE SET status = 'pending', updated_at = excluded.updated_at
      WHERE demo_verifications.status = 'revise'`).bind(space, category, now).run();
    return Boolean(result.meta.changes);
  }
  if (role === 'company' && action === 'verify-result' && owns(evidenceTypes, category)) {
    const result = form.get('result');
    if (!['verified', 'revise'].includes(result)) return false;
    const update = await db.prepare(`UPDATE demo_verifications SET status = ?, updated_at = ?
      WHERE demo_space = ? AND category = ? AND status = 'pending' AND updated_at + ? > ?`).bind(result, now, space, category, 30 * day, now).run();
    return Boolean(update.meta.changes);
  }
  if (role === 'company' && action === 'post') {
    const occupation = form.get('occupation');
    const district = form.get('district');
    const shift = form.get('shift');
    const evidence = form.get('evidence');
    const duration = form.get('duration');
    const retention = form.get('retention');
    if (!owns(occupations, occupation) || !owns(districts, district) || !owns(shifts, shift)
      || !jobEvidenceOptions(occupation).includes(evidence) || !['7','14','30'].includes(duration)
      || !['0','7','30'].includes(retention) || form.get('notice') !== 'yes') return false;
    const result = await db.prepare(`INSERT INTO hiring_jobs
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE (SELECT COUNT(*) FROM hiring_jobs WHERE demo_space = ?) < 60`).bind(
      crypto.randomUUID(), occupation, district, shift, evidence, Number(retention), now + Number(duration) * day, now, space, space
    ).run();
    return Boolean(result.meta.changes);
  }
  const jobId = form.get('job');
  if (!jobId || !/^[a-f0-9-]{36}$/.test(jobId)) return false;
  if (role === 'company' && action === 'close') {
    const result = await db.prepare('UPDATE hiring_jobs SET selection_end = ? WHERE id = ? AND demo_space = ? AND selection_end > ?')
      .bind(now, jobId, space, now).run();
    return Boolean(result.meta.changes);
  }
  if (role === 'company' && action === 'case-result') {
    const result = form.get('result');
    if (!['clear', 'hold'].includes(result) || form.get('reviewed') !== 'yes') return false;
    const update = await db.prepare(`UPDATE hiring_cases SET status = ?, updated_at = ?
      WHERE job_id = ? AND status = 'review'
      AND EXISTS (SELECT 1 FROM hiring_jobs WHERE id = ? AND demo_space = ? AND selection_end > ?)`)
      .bind(result, now, jobId, jobId, space, now).run();
    return Boolean(update.meta.changes);
  }
  if (role !== 'applicant' || !['apply', 'request-review'].includes(action)
    || form.get('schedule') !== 'yes' || form.get('notice') !== 'yes') return false;
  const job = await db.prepare('SELECT * FROM hiring_jobs WHERE id = ? AND demo_space = ? AND selection_end > ?').bind(jobId, space, now).first();
  if (!job) return false;
  const regulated = occupations[job.occupation].review;
  if (action === 'request-review' && !regulated) return false;
  const target = action === 'request-review' ? 'review' : 'applied';
  const previous = target === 'review' ? 'hold' : 'clear';
  const update = await db.prepare(`INSERT INTO hiring_cases (job_id, status, updated_at)
    SELECT id, ?, ? FROM hiring_jobs WHERE id = ? AND demo_space = ? AND selection_end > ?
    AND (evidence = 'none' OR EXISTS (SELECT 1 FROM demo_verifications
      WHERE demo_space = hiring_jobs.demo_space AND category = hiring_jobs.evidence AND status = 'verified' AND updated_at + ? > ?))
    AND (? = 0 OR EXISTS (SELECT 1 FROM hiring_cases WHERE job_id = hiring_jobs.id AND status = 'clear'))
    ON CONFLICT(job_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at
    WHERE hiring_cases.status = ?`).bind(target, now, jobId, space, now, 30 * day, now, Number(regulated && target === 'applied'), previous).run();
  return Boolean(update.meta.changes);
}
