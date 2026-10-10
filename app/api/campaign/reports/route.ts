import {getChatGPTUser} from '../../../chatgpt-auth';
import {extensionDb,sameOrigin,sha256} from '../../../../lib/extension-auth';
import {reportableHost,reportChannel} from '../../../../lib/community';
import {rateLimit} from '../../../../lib/rate-limit';

const MAX_AGE=30*24*60*60_000;

export async function GET(request:Request){
  if(!rateLimit(request,90))return Response.json({error:'Too many requests.'},{status:429});
  const raw=new URL(request.url).searchParams.get('host')||'';
  const host=reportableHost(raw);
  if(!host)return Response.json({error:'Enter a valid public domain.'},{status:400});
  try{
    const db=extensionDb(),cutoff=Date.now()-MAX_AGE;
    const rows=await db.prepare('SELECT channel, COUNT(*) AS count FROM campaign_reports WHERE host = ? AND updated_at >= ? GROUP BY channel').bind(host,cutoff).all<{channel:string;count:number}>();
    const channels=Object.fromEntries((rows.results||[]).map(row=>[row.channel,row.count]));
    const reports=Object.values(channels).reduce((sum,value)=>sum+Number(value),0);
    const user=await getChatGPTUser();
    const mine=user?await db.prepare('SELECT 1 AS yes FROM campaign_reports WHERE id = ? AND updated_at >= ?').bind(await sha256(`${user.userId}|${host}`),cutoff).first<{yes:number}>():null;
    return Response.json({host,reports,channels,myReport:Boolean(mine),windowDays:30,verification:'community-submitted, not independently verified'},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Community reports are temporarily unavailable.'},{status:503})}
}

export async function POST(request:Request){
  if(!rateLimit(request,8))return Response.json({error:'Too many reports. Try again later.'},{status:429});
  const user=await getChatGPTUser();
  if(!user)return Response.json({error:'Sign in to submit a report.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  const body=await request.json().catch(()=>null) as {host?:unknown;channel?:unknown}|null;
  const host=typeof body?.host==='string'?reportableHost(body.host):null;
  const channel=reportChannel(body?.channel);
  if(!host||!channel)return Response.json({error:'Choose a public destination and channel.'},{status:400});
  try{
    const now=Date.now(),id=await sha256(`${user.userId}|${host}`);
    await extensionDb().prepare('INSERT INTO campaign_reports (id,reporter_id,host,channel,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET channel = excluded.channel, updated_at = excluded.updated_at').bind(id,user.userId,host,channel,now,now).run();
    return Response.json({ok:true,host},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Could not save the report.'},{status:503})}
}

export async function DELETE(request:Request){
  const user=await getChatGPTUser();
  if(!user)return Response.json({error:'Sign in first.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  const body=await request.json().catch(()=>null) as {host?:unknown}|null;
  const host=typeof body?.host==='string'?reportableHost(body.host):null;
  if(!host)return Response.json({error:'Enter a valid public destination.'},{status:400});
  try{await extensionDb().prepare('DELETE FROM campaign_reports WHERE id = ? AND reporter_id = ?').bind(await sha256(`${user.userId}|${host}`),user.userId).run();return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}})}
  catch{return Response.json({error:'Could not remove the report.'},{status:503})}
}
