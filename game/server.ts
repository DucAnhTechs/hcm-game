import {TASKS,COLORS,CAPACITY,moveAllowed} from './world';
type DB={prepare:(sql:string)=>any,batch:(stmts:any[])=>Promise<any[]>};
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const hash=async(t:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export async function handle(request:Request,db:DB){try{
 if(request.method!=='POST')return reply({error:'Chỉ nhận POST.'},405);
 const raw=await request.text();if(raw.length>3000)return reply({error:'Yêu cầu quá dài.'},413);
 const b=JSON.parse(raw);const now=Date.now();let p:any,r:any;
 const first=(q:string,...a:any[])=>db.prepare(q).bind(...a).first();const exec=(q:string,...a:any[])=>db.prepare(q).bind(...a).run();
 if(['create','join'].includes(b.action)){
 const name=String(b.name||'').normalize('NFC').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,24);if(name.length<2)return reply({error:'Nhập tên từ 2 đến 24 ký tự.'},400);
 const color=COLORS.includes(b.color)?b.color:COLORS[0],id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID();
 let code=String(b.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(b.action==='create'){code=crypto.randomUUID().slice(0,6).toUpperCase();await exec('INSERT INTO rooms VALUES (?,?,?,?,?,?,?)',code,id,'lobby',0,360000,now,crypto.randomUUID());}
 r=await first('SELECT * FROM rooms WHERE code=?',code);if(!r||now-r.created>86400000)return reply({error:'Phòng không tồn tại hoặc đã hết hạn (24 giờ).'},404);
 if(r.status==='ended')return reply({error:'Phiên này đã kết thúc. Hãy tạo phòng mới.'},409);
 const count=await first('SELECT COUNT(*) as n FROM players WHERE room=?',code);const ix=count.n;
 const result=await exec('INSERT INTO players SELECT ?,?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM players WHERE room=?) < ?',id,await hash(token),code,name,color,-5+(ix%6)*1.8,6+Math.floor(ix/6)*1.5,0,0,0,0,now,0,code,CAPACITY);
 if(!result.meta.changes)return reply({error:'Phòng đã đủ 30 chỗ. Tạo phòng khác để tham gia.'},409);
 return reply({id,token,code});
 }
 if(typeof b.token!=='string'||b.token.length>100||typeof b.id!=='string')return reply({error:'Phiên không hợp lệ.'},401);
 p=await first('SELECT * FROM players WHERE id=? AND token=?',b.id,await hash(b.token));if(!p)return reply({error:'Phiên đã hết hạn. Vui lòng vào lại.'},401);
 r=await first('SELECT * FROM rooms WHERE code=?',p.room);if(!r||now-r.created>86400000)return reply({error:'Phòng đã hết hạn.'},410);
 if(r.status==='playing'&&now>=r.endsAt){await exec("UPDATE rooms SET status='ended' WHERE code=? AND status='playing' AND endsAt<=?",r.code,now);r.status='ended';}
 // A disconnected host is replaced by the oldest currently active participant.
 const host=await first('SELECT lastSeen FROM players WHERE id=?',r.host);if(!host||now-host.lastSeen>20000){const next=await first('SELECT id FROM players WHERE room=? AND lastSeen>? ORDER BY id LIMIT 1',r.code,now-10000);if(next){await exec('UPDATE rooms SET host=? WHERE code=? AND host=?',next.id,r.code,r.host);r.host=next.id;}}
 if(b.action==='sync'){
 const dt=Math.min(1,Math.max(0,(now-p.lastSeen)/1000));
 if(now-p.lastSeen>=180&&Number.isInteger(b.seq)&&b.seq>p.seq){
 let x=p.x,z=p.z,yaw=p.yaw;
 if(r.status==='playing'&&[b.x,b.z,b.yaw].every(Number.isFinite)){
 let dx=b.x-x,dz=b.z-z,dist=Math.hypot(dx,dz),max=(p.vehicle?12:6)*dt+.15;
 if(dist>max){dx*=max/dist;dz*=max/dist;}const nx=x+dx,nz=z+dz;if(moveAllowed(x,z,nx,nz)){x=nx;z=nz;}yaw=b.yaw%(Math.PI*2);
 }
 await exec('UPDATE players SET x=?,z=?,yaw=?,lastSeen=?,seq=? WHERE id=? AND seq<?',x,z,yaw,now,b.seq,p.id,b.seq);
 }
 }else if(['start','pause','end'].includes(b.action)){
 if(r.host!==p.id)return reply({error:'Chỉ chủ phòng có thể điều khiển phiên.'},403);
 if(b.action==='start'&&r.status==='lobby')await exec("UPDATE rooms SET status='playing',endsAt=? WHERE code=? AND status='lobby'",now+360000,r.code);
 if(b.action==='pause'&&r.status==='playing')await exec("UPDATE rooms SET status='paused',left=? WHERE code=? AND status='playing'",Math.max(0,r.endsAt-now),r.code);
 if(b.action==='pause'&&r.status==='paused')await exec("UPDATE rooms SET status='playing',endsAt=? WHERE code=? AND status='paused'",now+r.left,r.code);
 if(b.action==='end')await exec("UPDATE rooms SET status='ended' WHERE code=?",r.code);
 }else if(b.action==='task'){
 if(r.status!=='playing')return reply({error:'Phiên chưa bắt đầu hoặc đang tạm dừng.'},409);
 const t=TASKS[p.stage];if(!t||b.stage!==p.stage)return reply({error:'Nhiệm vụ đã ghi nhận hoặc chưa được mở.'},409);
 if(Math.hypot(p.x-t.x,p.z-t.z)>4.5)return reply({error:'Hãy đến gần điểm nhiệm vụ trước.'},400);
 if(JSON.stringify(b.answer)!==JSON.stringify(t.solution))return reply({error:'Thứ tự chưa phù hợp. Đọc yêu cầu và thử sắp lại nhé.'},400);
 const result=await exec('UPDATE players SET stage=stage+1,score=score+100,lastSeen=? WHERE id=? AND stage=?',now,p.id,p.stage);if(!result.meta.changes)return reply({error:'Nhiệm vụ đã được ghi nhận.'},409);
 }else if(b.action==='vehicle'){
 if(r.status!=='playing')return reply({error:'Chỉ dùng xe trong phiên đang chơi.'},409);
 // Each player owns one personal delivery scooter: no shared ownership race.
 await exec('UPDATE players SET vehicle=1-vehicle WHERE id=?',p.id);
 }else if(b.action==='leave'){await exec('UPDATE players SET lastSeen=0 WHERE id=?',p.id);return reply({ok:true});}
 else return reply({error:'Hành động không hợp lệ.'},400);
 r=await first('SELECT * FROM rooms WHERE code=?',p.room);
 const all=await db.prepare('SELECT id,name,color,x,z,yaw,stage,score,vehicle,lastSeen,seq FROM players WHERE room=? ORDER BY score DESC,id').bind(p.room).all();
 return reply({room:r,players:all.results,me:all.results.find((v:any)=>v.id===p.id),now});
 }catch(e){console.error('Game operation failed',e);return reply({error:'Kết nối phòng tạm gián đoạn. Hãy thử lại.'},503);}}
