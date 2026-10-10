import {deviceForRequest,extensionDb} from '../../../../lib/extension-auth';

export async function POST(request:Request){
  const device=await deviceForRequest(request).catch(()=>null);
  if(!device)return Response.json({error:'Not connected.'},{status:401});
  await extensionDb().prepare('UPDATE extension_devices SET revoked_at = ? WHERE id = ?').bind(Date.now(),device.id).run();
  return Response.json({ok:true});
}
