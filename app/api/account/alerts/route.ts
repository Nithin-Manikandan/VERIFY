import {getChatGPTUser} from '../../../chatgpt-auth';
import {extensionDb,sameOrigin} from '../../../../lib/extension-auth';

export async function GET(){
  const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in first.'},{status:401});
  try{const db=extensionDb();await db.prepare('DELETE FROM email_alerts WHERE user_id = ? AND updated_at < ?').bind(user.userId,Date.now()-30*24*60*60_000).run();const result=await db.prepare('SELECT id,sender,subject,risk_score,signals,source,created_at,updated_at,reviewed_at FROM email_alerts WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100').bind(user.userId).all();return Response.json({alerts:result.results},{headers:{'Cache-Control':'no-store'}})}
  catch{return Response.json({error:'Dashboard is temporarily unavailable.'},{status:503})}
}
export async function PATCH(request:Request){
  const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in first.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  const body=await request.json().catch(()=>null) as {id?:unknown;reviewed?:unknown}|null;
  if(typeof body?.id!=='string'||!/^\w{64}$/.test(body.id)||typeof body.reviewed!=='boolean')return Response.json({error:'Invalid alert.'},{status:400});
  try{await extensionDb().prepare('UPDATE email_alerts SET reviewed_at = ? WHERE id = ? AND user_id = ?').bind(body.reviewed?Date.now():null,body.id,user.userId).run();return Response.json({ok:true})}
  catch{return Response.json({error:'Could not update alert.'},{status:503})}
}
export async function DELETE(request:Request){
  const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in first.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  const body=await request.json().catch(()=>null) as {id?:unknown}|null;
  if(typeof body?.id!=='string'||!/^\w{64}$/.test(body.id))return Response.json({error:'Invalid alert.'},{status:400});
  try{await extensionDb().prepare('DELETE FROM email_alerts WHERE id = ? AND user_id = ?').bind(body.id,user.userId).run();return Response.json({ok:true})}
  catch{return Response.json({error:'Could not remove alert.'},{status:503})}
}
