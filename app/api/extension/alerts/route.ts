import {deviceForRequest,extensionDb,sha256} from '../../../../lib/extension-auth';
import {rateLimit} from '../../../../lib/rate-limit';

type Incoming={threadKey?:unknown;sender?:unknown;subject?:unknown;riskScore?:unknown;signals?:unknown;source?:unknown};
export async function POST(request:Request){
  if(!rateLimit(request,45))return Response.json({error:'Too many updates.'},{status:429});
  const device=await deviceForRequest(request).catch(()=>null);
  if(!device)return Response.json({error:'Connect the extension first.'},{status:401});
  const body=await request.json().catch(()=>null) as {alerts?:unknown}|null;
  if(!Array.isArray(body?.alerts)||body.alerts.length>30)return Response.json({error:'Invalid alert batch.'},{status:400});
  const now=Date.now(),db=extensionDb(),statements=[];
  for(const raw of body.alerts as Incoming[]){
    if(!raw||typeof raw.threadKey!=='string'||raw.threadKey.length<2||raw.threadKey.length>180)continue;
    const subject=typeof raw.subject==='string'?raw.subject.trim().slice(0,240):'';
    const sender=typeof raw.sender==='string'?raw.sender.trim().slice(0,160):'';
    const riskScore=typeof raw.riskScore==='number'?Math.round(raw.riskScore):0;
    const signals=Array.isArray(raw.signals)?raw.signals.filter((x):x is string=>typeof x==='string').slice(0,6).map(x=>x.slice(0,120)):[];
    if(!subject||riskScore<30||riskScore>100)continue;
    const source=raw.source==='opened'?'opened':raw.source==='background'?'background':'preview';
    const id=await sha256(`${device.user_id}|${raw.threadKey}`);
    statements.push(db.prepare('INSERT INTO email_alerts (id,user_id,sender,subject,risk_score,signals,source,created_at,updated_at,reviewed_at) VALUES (?,?,?,?,?,?,?,?,?,NULL) ON CONFLICT(id) DO UPDATE SET risk_score = MAX(email_alerts.risk_score,excluded.risk_score), signals = excluded.signals, source = excluded.source, updated_at = excluded.updated_at').bind(id,device.user_id,sender,subject,riskScore,JSON.stringify(signals),source,now,now));
  }
  try{
    statements.push(db.prepare('DELETE FROM email_alerts WHERE updated_at < ?').bind(now-30*24*60*60_000));
    statements.push(db.prepare('UPDATE extension_devices SET last_seen_at = ? WHERE id = ?').bind(now,device.id));
    await db.batch(statements);
    return Response.json({saved:statements.length-2},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Dashboard sync is unavailable.'},{status:503})}
}
