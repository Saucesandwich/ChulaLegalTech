import { createServer } from 'node:http';
import worker from '../dist/server/index.js';
import { openLocalD1 } from './local-d1.mjs';

const origin = 'http://127.0.0.1:' + (process.env.PORT || '4174');
const env = { ...process.env, DB: openLocalD1() };
createServer(async (req, res) => {
  try {
    const method = req.method;
    const request = new Request(new URL(req.url, origin), {
      method,
      headers: req.headers,
      ...(method !== 'GET' && method !== 'HEAD' ? { body: req, duplex: 'half' } : {})
    });
    const reply = await worker.fetch(request, env);
    res.writeHead(reply.status, Object.fromEntries(reply.headers));
    res.end(Buffer.from(await reply.arrayBuffer()));
  } catch {
    res.writeHead(500).end('Demo request failed');
  }
}).listen(Number(new URL(origin).port), '127.0.0.1', () => console.log(origin));
