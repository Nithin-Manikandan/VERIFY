import {env} from 'cloudflare:workers';
import {rateLimit} from '../../../../lib/rate-limit';
import {sameOrigin} from '../../../../lib/extension-auth';
import {checkUspsTracking,normalizeTrackingNumber} from '../../../../lib/usps';

export async function GET(){return Response.json({available:Boolean(env.USPS_CLIENT_ID&&env.USPS_CLIENT_SECRET)},{headers:{'Cache-Control':'no-store'}})}

export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  if(!rateLimit(request,5))return Response.json({error:'Too many tracking checks. Try again shortly.'},{status:429});
  const body=await request.json().catch(()=>null) as {trackingNumber?:unknown}|null;
  const trackingNumber=normalizeTrackingNumber(body?.trackingNumber);
  if(!trackingNumber)return Response.json({error:'Enter a valid USPS tracking number.'},{status:400});
  if(!env.USPS_CLIENT_ID||!env.USPS_CLIENT_SECRET)return Response.json({error:'The live USPS connection has not been configured yet.'},{status:503});
  try{return Response.json(await checkUspsTracking(trackingNumber,env.USPS_CLIENT_ID,env.USPS_CLIENT_SECRET),{headers:{'Cache-Control':'no-store'}})}
  catch{return Response.json({error:'USPS could not complete the check right now. Keep the claim unverified and try the official USPS site.'},{status:502})}
}
