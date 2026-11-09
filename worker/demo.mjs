const roles = {
  company: { name: 'บริษัท', en: 'Company', user: 'company-demo', secret: 'COMPANY_DEMO_PASSWORD', script: 'companyScript' },
  applicant: { name: 'ผู้สมัคร', en: 'Applicant', user: 'applicant-demo', secret: 'APPLICANT_DEMO_PASSWORD', script: 'applicantScript' }
};
const cookieName = 'pathongko_session';
const sessionSeconds = 4 * 60 * 60;
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

async function sessionRole(request, key) {
  const cookie = request.headers.get('cookie')?.split(';').map(item => item.trim())
    .find(item => item.startsWith(cookieName + '='));
  const value = cookie?.slice(cookieName.length + 1) ?? '';
  const parts = /^(company|applicant)\.(\d{1,12})\.([0-9a-f]{64})$/.exec(value);
  if (!parts || Number(parts[2]) <= Date.now() / 1000) return null;
  const [, role, expires, hex] = parts;
  const proof = Uint8Array.from(hex.match(/../g), byte => parseInt(byte, 16));
  const verified = await crypto.subtle.verify('HMAC', key, proof, encoder.encode(`session:${role}.${expires}`));
  return verified ? role : null;
}

function loginPage(role, error = '', status = 200) {
  const account = roles[role];
  const content = account ? `
    <p class="eyebrow">บัญชีเดโม</p>
    <h1>เข้าสู่ระบบฝั่ง${account.name}</h1>
    <form method="post" action="/login/${role}" class="login-form">
      ${error ? `<p role="alert" class="login-error">${error}</p>` : ''}
      <label>ชื่อผู้ใช้<input name="username" autocomplete="username" required maxlength="64"></label>
      <label>รหัสผ่าน<input name="password" type="password" autocomplete="current-password" required maxlength="128"></label>
      <button class="primary-button">เข้าสู่ระบบ</button>
    </form>
    <a class="login-back" href="/">← เลือกอีกฝั่ง</a>
  ` : `
    <p class="eyebrow">พื้นที่ทดลอง</p>
    <h1>ยินดีต้อนรับสู่ปาท่องโก๋</h1>
    <p>เลือกพื้นที่ที่คุณต้องการทดลอง แล้วเข้าสู่ระบบด้วยบัญชีเดโมของฝั่งนั้น</p>
    <div class="portal-choices">
      <a href="/login/company"><strong>สำหรับบริษัท</strong><span>เปิดรับงานและตรวจหลักฐาน →</span></a>
      <a href="/login/applicant"><strong>สำหรับผู้สมัคร</strong><span>หางานและยื่นขอรับรอง →</span></a>
    </div>
  `;
  return response(`<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>เข้าสู่ระบบ · ปาท่องโก๋</title><link rel="stylesheet" href="/styles.css"></head>
<body class="login-shell"><main class="login-card"><a class="portal-brand" href="/">ปาท่องโก๋</a>
${content}<p class="login-note">ระบบสาธิตใช้ข้อมูลจำลอง กรุณาใช้บัญชีเดโมที่ได้รับ</p></main></body></html>`, 'text/html', status);
}

async function login(request, url, env, key, role) {
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) {
    return response('Unsupported form type', 'text/plain', 415);
  }
  const body = await request.text();
  if (body.length > 2048) return response('Form too large', 'text/plain', 413);
  const form = new URLSearchParams(body);
  const account = roles[role];
  const password = form.get('password') ?? '';
  const expected = await signature(key, 'password:' + env[account.secret]);
  const matches = await crypto.subtle.verify('HMAC', key, expected, encoder.encode('password:' + password));
  if (form.get('username')?.trim() !== account.user || !matches) {
    return loginPage(role, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ตรงกับบัญชีของฝั่งนี้', 401);
  }
  const value = role + '.' + (Math.floor(Date.now() / 1000) + sessionSeconds);
  const proof = await signature(key, 'session:' + value);
  const hex = Array.from(new Uint8Array(proof), byte => byte.toString(16).padStart(2, '0')).join('');
  return redirect('/' + role, sessionCookie(value + '.' + hex, sessionSeconds, url));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'GET' && path === '/styles.css') return response(assets.styles, 'text/css');

    const loginRole = /^\/login\/(company|applicant)$/.exec(path)?.[1];
    const portal = /^\/(company|applicant)(\/overview)?$/.exec(path);
    const scriptRole = path === '/app.js' ? 'company' : path === '/candidate.js' ? 'applicant' : null;

    if (!env.DEMO_SESSION_SECRET || !env.COMPANY_DEMO_PASSWORD || !env.APPLICANT_DEMO_PASSWORD) {
      return response('Demo sign-in is not configured', 'text/plain', 503);
    }
    const key = await crypto.subtle.importKey('raw', encoder.encode(env.DEMO_SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
    const role = await sessionRole(request, key);
    if (request.method === 'POST') {
      if (request.headers.get('origin') !== url.origin) return response('Forbidden', 'text/plain', 403);
      if (path === '/logout') return redirect('/', sessionCookie('', 0, url));
      if (loginRole) return login(request, url, env, key, loginRole);
      if (path === '/hiring') {
        if (!role) return redirect('/');
        return handleHiring(request, url, env, role);
      }
    }
    if (request.method === 'GET') {
      if (path === '/') return role ? redirect('/' + role) : loginPage();
      if (loginRole) return role === loginRole ? redirect('/' + role) : loginPage(loginRole);
      if (portal) {
        if (!role) return redirect('/login/' + portal[1]);
        if (role !== portal[1]) return redirect('/' + role);
        return portal[2] ? response(assets[role], 'text/html') : handleHiring(request, url, env, role);
      }
      if (scriptRole) {
        if (role !== scriptRole) return response('Forbidden', 'text/plain', 403);
        return response(assets[roles[scriptRole].script], 'text/javascript');
      }
    }
    return response('Not found', 'text/plain', 404);
  }
};
