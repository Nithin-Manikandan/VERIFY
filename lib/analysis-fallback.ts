import type {Investigation,Evidence} from './types';

export function rulesOnlyAnalysis(evidence:string,entities:Investigation['entities'],links:Investigation['urlForensics']):Investigation['analysis']{
  const redFlags:Evidence[]=[];
  let riskScore=8;
  const add=(flag:Evidence,weight:number)=>{redFlags.push(flag);riskScore+=weight};
  for(const link of links){
    const mismatch=link.flags.find(flag=>/outside [a-z0-9.-]+/i.test(flag));
    if(mismatch)add({type:'Brand link mismatch',severity:'high',description:mismatch,quotedPhrase:link.originalUrl},42);
    const unusual=link.flags.find(flag=>/unusual top-level domain|punycode/i.test(flag));
    if(unusual)add({type:'Unusual link',severity:'medium',description:unusual,quotedPhrase:link.originalUrl},17);
  }
  const payment=evidence.match(/\b(?:pay|payment|fee|deposit|transfer)\b[^\n.!?]{0,60}/i);
  if(payment&&entities.urls.length)add({type:'Payment through message link',severity:'medium',description:'The message pairs a payment request with a link.',quotedPhrase:payment[0].trim()},23);
  const secret=evidence.match(/\b(?:enter|send|share|provide|give)\s+(?:us\s+|your\s+|the\s+)?(?:password|passcode|one.time code|verification code|card number|security code)\b/i);
  if(secret)add({type:'Account secret request',severity:'high',description:'The message asks for an account secret or payment card number.',quotedPhrase:secret[0]},28);
  riskScore=Math.min(95,riskScore);
  const verdict=riskScore>=70?'LIKELY SCAM':riskScore>=35?'SUSPICIOUS':'SAFE';
  const why=redFlags.length?`${redFlags.map(flag=>flag.description).join(' ')} The message's claim has not been independently verified.`:'No strong warning sign was found by the available local checks. The message\'s claim has not been independently verified.';
  const scamType=/\b(?:usps|fedex|ups|parcel|package|delivery)\b/i.test(evidence)?'package':/\b(?:bank|chase|paypal|account|transfer)\b/i.test(evidence)?'bank':'other';
  return {scamType,riskScore,redFlags,verdict,why};
}
