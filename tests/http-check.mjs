import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const base=process.env.TEST_URL||'http://localhost:3107';
async function call(action,session={},extra={}){const r=await fetch(base+'/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...session,action,...extra})});return {status:r.status,data:await r.json()};}
assert.equal((await fetch(base+'/api/health')).status,200);
assert.match(await (await fetch(base)).text(),/Phố Việt/);
assert.equal((await fetch(base+'/fonts/noto-sans-bold.woff')).status,200);
const a=(await call('create',{}, {name:'Chủ phòng Việt'})).data;
const b=(await call('join',{}, {name:'Người chơi Ánh',code:a.code})).data;
assert(a.token&&b.token);assert.notEqual(a.id,b.id);
assert.equal((await call('start',b)).status,403);
assert.equal((await call('start',a)).status,200);
let snap=(await call('sync',b,{seq:1})).data;
assert.equal(snap.room.status,'playing');assert.equal(snap.players.length,2);
assert(snap.players.some(p=>p.name==='Chủ phòng Việt'));
await call('pause',a);assert.equal((await call('sync',b,{seq:2})).data.room.status,'paused');
writeFileSync('/tmp/pho-viet-render-test-session.json',JSON.stringify(b));
console.log('PASS: HTML, font, SQLite health, two players, host permission, shared start/pause.');
