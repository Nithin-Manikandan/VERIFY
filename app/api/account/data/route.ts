import {getChatGPTUser} from '../../../chatgpt-auth';
import {extensionDb,sameOrigin} from '../../../../lib/extension-auth';

export async function DELETE(request:Request){
  const user=await getChatGPTUser();
  if(!user)return Response.json({error:'Sign in first.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  try{
    const db=extensionDb();
    await db.batch([
      db.prepare('DELETE FROM email_alerts WHERE user_id = ?').bind(user.userId),
      db.prepare('DELETE FROM campaign_reports WHERE reporter_id = ?').bind(user.userId),
      db.prepare('DELETE FROM extension_pair_codes WHERE user_id = ?').bind(user.userId),
      db.prepare('DELETE FROM extension_devices WHERE user_id = ?').bind(user.userId),
    ]);
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Could not clear VERIFY data.'},{status:503})}
}
