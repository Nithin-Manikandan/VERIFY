import {extensionDb,randomToken,sha256} from '../../../../lib/extension-auth';
import {rateLimit} from '../../../../lib/rate-limit';

export async function POST(request:Request){
  if(!rateLimit(request,5))return Response.json({error:'Too many pairing attempts.'},{status:429});
  const body=await request.json().catch(()=>null) as {code?:unknown;label?:unknown}|null;
  const code=typeof body?.code==='string'?body.code.replace(/[^A-Z0-9]/gi,'').toUpperCase():'';
  const label=typeof body?.label==='string'?body.label.trim().slice(0,60):'Chrome on this device';
  if(!/^[A-HJ-NP-Z2-9]{12}$/.test(code))return Response.json({error:'Enter the 12-character code from your account.'},{status:400});
  try{
    const db=extensionDb(),now=Date.now(),hash=await sha256(code);
    const claimed=await db.prepare('DELETE FROM extension_pair_codes WHERE code_hash = ? AND expires_at > ? RETURNING user_id').bind(hash,now).first<{user_id:string}>();
    if(!claimed)return Response.json({error:'This code is invalid or expired. Create a new one in your account.'},{status:400});
    const token=randomToken(),tokenHash=await sha256(token),deviceId=crypto.randomUUID();
    await db.prepare('INSERT INTO extension_devices (id,token_hash,user_id,label,created_at,last_seen_at,revoked_at) VALUES (?,?,?,?,?,?,NULL)').bind(deviceId,tokenHash,claimed.user_id,label||'Chrome on this device',now,now).run();
    return Response.json({token,deviceId},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Pairing is temporarily unavailable.'},{status:503})}
}
