import {structured,Training} from '../../../../lib/nim';
import {rateLimit} from '../../../../lib/rate-limit';
import {fallbackTraining} from '../../../../lib/training-fallback';
import type {ScamType} from '../../../../lib/types';

const types:ScamType[]=['package','bank','romance','grandparent','tech-support','job','crypto','prize','government','other'];
const difficulties=['easy','medium','hard'] as const;

export async function POST(request:Request){
  if(!rateLimit(request,15))return Response.json({error:'Too many requests. Please wait a minute.'},{status:429});
  const body=await request.json().catch(()=>null) as {type?:string;difficulty?:string}|null;
  if(!body||!types.includes(body.type as ScamType)||!difficulties.includes(body.difficulty as typeof difficulties[number]))return Response.json({error:'Choose a valid type and difficulty.'},{status:400});
  const type=body.type as ScamType,difficulty=body.difficulty as typeof difficulties[number];
  try{
    const system='You create contemporary, believable, clearly fictional scam messages for a training exercise. Use natural language and plausible conversational context, not cartoonish ALL CAPS or impossible claims. For easy mode use obvious cues; for hard mode use subtle cues and reassuring context. Never use real payment links or phone numbers. Use .example domains and reserved 555-01xx phone numbers. Return JSON with message and redFlags. Each flag needs exact text from the message, explanation, severity (low, medium, high, or critical only), startIndex (inclusive), endIndex (exclusive).';
    const result=await structured(system,`Generate a ${difficulty} ${type} scam message with 2 to 5 distinct warning signs. It may be a short two-turn conversation. The message should be 250 to 700 characters. Return only JSON.`,Training,{attempts:1,maxTokens:1100,timeoutMs:14000});
    const flags=result.redFlags.map(f=>{const start=result.message.indexOf(f.text);return {...f,startIndex:start,endIndex:start+f.text.length}}).filter(f=>f.startIndex>=0);
    if(flags.length<2)throw new Error('Invalid answer key');
    return Response.json({id:crypto.randomUUID(),type,difficulty,message:result.message,redFlags:flags,source:'ai'});
  }catch{
    return Response.json(fallbackTraining(type,difficulty));
  }
}
