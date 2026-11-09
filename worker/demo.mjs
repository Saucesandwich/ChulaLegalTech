const roles = {
  company: { name: 'บริษัท', script: 'companyScript' },
  applicant: { name: 'ผู้สมัคร', script: 'applicantScript' }
};
const cookieName = 'pathongko_session';
const sessionSeconds = 30 * 24 * 60 * 60;
const encoder = new TextEncoder();

function response(body, type, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': type + '; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
    }
  });
}

function redirect(path, cookie) {
  const headers = { Location: path, 'Cache-Control': 'no-store' };
  if (cookie) headers['Set-Cookie'] = cookie;
  return new Response(null, { status: 303, headers });
}

function sessionCookie(value, seconds, url) {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${cookieName}=${value}; Path=/; Max-Age=${seconds}; HttpOnly; SameSite=Lax${secure}`;
}

function signature(key, message) {
  return crypto.subtle.sign('HMAC', key, encoder.encode(message));
}

async function demoSession(request, key) {
  const cookie = request.headers.get('cookie')?.split(';').map(item => item.trim())
    .find(item => item.startsWith(cookieName + '='));
  const value = cookie?.slice(cookieName.length + 1) ?? '';
  const parts = /^(company|applicant)\.([a-f0-9-]{36})\.(\d{1,12})\.([0-9a-f]{64})$/.exec(value);
  if (!parts || Number(parts[3]) <= Date.now() / 1000) return null;
  const [, role, space, expires, hex] = parts;
  const proof = Uint8Array.from(hex.match(/../g), byte => parseInt(byte, 16));
  const verified = await crypto.subtle.verify('HMAC', key, proof, encoder.encode(`session:${role}.${space}.${expires}`));
  return verified ? { role, space } : null;
}

function entryPage(role) {
  const button = (key, label, detail) => `<form method="post" action="/login/${key}">
    <button class="demo-entry"><strong>${label}</strong><span>${detail} →</span></button></form>`;
  const content = role
    ? `<h1>เข้าใช้งานฝั่ง${roles[role].name}</h1><div class="portal-choices">${button(role, 'เข้าเดโม', 'เริ่มใช้งาน')}</div><a href="/">← เลือกอีกฝั่ง</a>`
    : `<h1>ยินดีต้อนรับสู่ปาท่องโก๋</h1>
    <p>เลือกฝั่งที่อยากทดลอง สลับฝั่งได้ในเบราว์เซอร์เดียวกัน</p>
    <div class="portal-choices">
      ${button('applicant', 'สำหรับผู้สมัคร', 'ดูภาพรวมการหางานและสิทธิของฉัน')}
      ${button('company', 'สำหรับบริษัท', 'ดูภาพรวมการสรรหาและจัดการข้อมูล')}
    </div>`;
  return response(`<!doctype html><html lang="th"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1"><title>ปาท่องโก๋ · พื้นที่ทดลอง</title>
  <link rel="stylesheet" href="/styles.css?v=5"></head>
  <body class="login-shell"><main class="login-card"><a class="portal-brand" href="/">ปาท่องโก๋</a>
  ${content}<p class="login-note">เข้าเดโมได้โดยไม่ต้องกรอกรหัสผ่าน ข้อมูลทั้งหมดเป็นข้อมูลจำลอง</p></main></body></html>`, 'text/html');
}

async function enterDemo(url, env, key, role, session) {
  if (!env.DB) return response('ยังไม่ได้เชื่อมฐานข้อมูลเดโม', 'text/plain', 503);
  const space = session?.space ?? crypto.randomUUID();
  if (!session) await seedDemoJobs(env.DB, space, Date.now());
  const value = role + '.' + space + '.' + (Math.floor(Date.now() / 1000) + sessionSeconds);
  const proof = await signature(key, 'session:' + value);
  const hex = Array.from(new Uint8Array(proof), byte => byte.toString(16).padStart(2, '0')).join('');
  return redirect('/' + role + '/overview', sessionCookie(value + '.' + hex, sessionSeconds, url));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'GET' && path === '/styles.css') return response(assets.styles, 'text/css');

    const loginRole = /^\/login\/(company|applicant)$/.exec(path)?.[1];
    const portal = /^\/(company|applicant)(?:\/(overview|jobs|privacy|rights|insights))?$/.exec(path);
    const scriptRole = path === '/app.js' ? 'company' : path === '/candidate.js' ? 'applicant' : null;

    if (!env.DEMO_SESSION_SECRET) {
      return response('Demo sign-in is not configured', 'text/plain', 503);
    }
    const key = await crypto.subtle.importKey('raw', encoder.encode(env.DEMO_SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
    const session = await demoSession(request, key);
    const role = session?.role;
    if (request.method === 'POST') {
      if (request.headers.get('origin') !== url.origin) return response('Forbidden', 'text/plain', 403);
      if (path === '/logout') return redirect('/', sessionCookie('', 0, url));
      if (loginRole) return enterDemo(url, env, key, loginRole, session);
      if (path === '/hiring') {
        if (!role) return redirect('/');
        return handleHiring(request, url, env, session);
      }
    }
    if (request.method === 'GET') {
      if (path === '/') return entryPage();
      if (loginRole) return role === loginRole ? redirect('/' + role + '/overview') : entryPage(loginRole);
      if (portal) {
        if (!role) return redirect('/login/' + portal[1]);
        if (role !== portal[1] || !portal[2]) return redirect('/' + role + '/overview');
        if (portal[2] === 'insights') return response(assets[role], 'text/html');
        if ((role === 'company' && portal[2] === 'rights') || (role === 'applicant' && portal[2] === 'privacy')) {
          return redirect('/' + role + '/overview');
        }
        return handleHiring(request, url, env, session);
      }
      if (scriptRole) {
        if (role !== scriptRole) return response('Forbidden', 'text/plain', 403);
        return response(assets[roles[scriptRole].script], 'text/javascript');
      }
    }
    return response('Not found', 'text/plain', 404);
  }
};
