import {getChatGPTUser} from '../../../chatgpt-auth';
import {extensionDb,sameOrigin} from '../../../../lib/extension-auth';

export async function GET(){
  const user=await getChatGPTUser();
  if(!user)return Response.json({error:'Sign in first.'},{status:401});
  try{const rows=await extensionDb().prepare('SELECT id,label,created_at,last_seen_at FROM extension_devices WHERE user_id = ? AND revoked_at IS NULL ORDER BY created_at DESC').bind(user.userId).all();return Response.json({devices:rows.results},{headers:{'Cache-Control':'no-store'}})}
  catch{return Response.json({error:'Devices are temporarily unavailable.'},{status:503})}
}
export async function DELETE(request:Request){
  const user=await getChatGPTUser();
  if(!user)return Response.json({error:'Sign in first.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  const body=await request.json().catch(()=>null) as {id?:unknown}|null;
  if(typeof body?.id!=='string'||body.id.length>80)return Response.json({error:'Invalid device.'},{status:400});
  try{await extensionDb().prepare('UPDATE extension_devices SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL').bind(Date.now(),body.id,user.userId).run();return Response.json({ok:true})}
  catch{return Response.json({error:'Could not disconnect device.'},{status:503})}
}
