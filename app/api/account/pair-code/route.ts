import {getChatGPTUser} from '../../../chatgpt-auth';
import {extensionDb,randomCode,sameOrigin,sha256} from '../../../../lib/extension-auth';
import {rateLimit} from '../../../../lib/rate-limit';

export async function POST(request:Request){
  const user=await getChatGPTUser();
  if(!user)return Response.json({error:'Sign in to your VERIFY account first.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  if(!rateLimit(request,8))return Response.json({error:'Please wait before creating another code.'},{status:429});
  try{
    const db=extensionDb(),now=Date.now(),code=randomCode(),hash=await sha256(code);
    await db.batch([
      db.prepare('DELETE FROM extension_pair_codes WHERE user_id = ? OR expires_at < ?').bind(user.userId,now),
      db.prepare('INSERT INTO extension_pair_codes (code_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)').bind(hash,user.userId,now+10*60_000,now),
    ]);
    return Response.json({code:code.match(/.{1,4}/g)?.join('-'),expiresAt:now+10*60_000},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Pairing is temporarily unavailable.'},{status:503})}
}
