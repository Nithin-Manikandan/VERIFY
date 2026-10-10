export type UspsResult={state:'record_found'|'no_record'|'unavailable';trackingNumber:string;status?:string;category?:string;summary?:string;checkedAt?:string};

export function normalizeTrackingNumber(value:unknown){
  if(typeof value!=='string')return null;
  const number=value.replace(/[\s-]/g,'').toUpperCase();
  return /^(?:\d{20,34}|[A-Z]{2}\d{9}US)$/.test(number)?number:null;
}

export function trackingNumberFromMessage(message:string){
  const match=message.match(/\b(?:USPS\s+)?tracking\s*(?:number|#|no\.?|ID)?\s*[:#-]?\s*([A-Z]{2}\s*\d{9}\s*US|\d(?:[\d -]{18,42}\d))\b/i);
  return match?normalizeTrackingNumber(match[1]):null;
}

function field(value:unknown,max=200){return typeof value==='string'?value.replace(/<[^>]*>/g,'').slice(0,max):undefined}

export function parseUspsResponse(value:unknown,trackingNumber:string):UspsResult{
  const item=Array.isArray(value)?value.find(entry=>entry&&typeof entry==='object'&&'trackingNumber'in entry&&entry.trackingNumber===trackingNumber):value;
  if(!item||typeof item!=='object')return {state:'unavailable',trackingNumber};
  const record=item as Record<string,unknown>;
  if(record.trackingNumber!==trackingNumber)return {state:'unavailable',trackingNumber};
  const status=field(record.status),category=field(record.statusCategory),summary=field(record.statusSummary,500);
  if(!status&&!summary)return {state:'unavailable',trackingNumber};
  return {state:'record_found',trackingNumber,status,category,summary,checkedAt:new Date().toISOString()};
}

export async function checkUspsTracking(trackingNumber:string,clientId:string,clientSecret:string,fetcher:typeof fetch=fetch):Promise<UspsResult>{
  const tokenResponse=await fetcher('https://apis.usps.com/oauth2/v3/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({grant_type:'client_credentials',client_id:clientId,client_secret:clientSecret}),signal:AbortSignal.timeout(8000)});
  if(!tokenResponse.ok)throw new Error('USPS authorization is unavailable.');
  const tokenData=await tokenResponse.json() as {access_token?:unknown};
  if(typeof tokenData.access_token!=='string'||!tokenData.access_token)throw new Error('USPS authorization returned no token.');
  const response=await fetcher('https://apis.usps.com/tracking/v3r2/tracking',{method:'POST',headers:{Authorization:`Bearer ${tokenData.access_token}`,'Content-Type':'application/json'},body:JSON.stringify([{trackingNumber}]),signal:AbortSignal.timeout(8000)});
  if(response.status===404)return {state:'no_record',trackingNumber,checkedAt:new Date().toISOString()};
  if(!response.ok)throw new Error('USPS tracking is unavailable.');
  return parseUspsResponse(await response.json(),trackingNumber);
}
