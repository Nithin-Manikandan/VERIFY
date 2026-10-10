import type {Investigation} from './types';
import {trackingNumberFromMessage} from './usps.ts';

export type ClaimEvidence={label:string;detail:string;source:'Message quote'|'Link check'|'AI assessment'|'Rule check'|'Demo signal'};
export type ClaimTrace={label:string;detail:string;state:'observed'|'limited'|'next'};
export type ClaimLedgerData={claim:string;evidence:ClaimEvidence[];unknown:string[];safeAction:string;officialDomain:string|null;officialName:string;trace:ClaimTrace[];riskScore:number;trackingNumber:string|null};

export function extractClaim(text:string){
  const lines=text.split(/\n+/).map(line=>line.trim()).filter(Boolean);
  const body=lines.find(line=>!/^(?:from|to|subject|date|screenshot transcription|link):/i.test(line));
  const subject=lines.find(line=>/^subject:/i.test(line))?.replace(/^subject:\s*/i,'');
  const candidate=body||subject||text.trim();
  const sentence=candidate.match(/^.{8,220}?[.!?](?=\s|$)/)?.[0]||candidate.slice(0,220);
  return sentence.trim()||'The message makes a claim that needs independent verification.';
}

function unknownFor(type:Investigation['analysis']['scamType']){
  if(type==='package')return 'Whether a real package has this delivery issue.';
  if(type==='bank')return 'Whether your account actually has the claimed security issue.';
  if(type==='job')return 'Whether the position and recruiter are genuine.';
  if(type==='government')return 'Whether an official agency actually issued this notice.';
  if(type==='grandparent')return 'Whether your loved one is actually in trouble.';
  return 'Whether the event or offer described in the message is genuine.';
}

export function buildClaimLedger(result:Investigation):ClaimLedgerData{
  const evidence:ClaimEvidence[]=[];
  for(const flag of result.analysis.redFlags.slice(0,4)){
    const exact=Boolean(flag.quotedPhrase&&result.evidenceText.includes(flag.quotedPhrase));
    evidence.push({label:flag.type,detail:exact?`“${flag.quotedPhrase}” — ${flag.description}`:flag.description,source:result.analysisMode==='rules'?'Rule check':exact?'Message quote':'AI assessment'});
  }
  for(const link of result.urlForensics.slice(0,2)){
    for(const flag of link.flags.slice(0,2))if(!evidence.some(item=>item.detail.includes(flag)))evidence.push({label:'Link finding',detail:flag,source:'Link check'});
  }
  const checkedLinks=result.urlForensics.length;
  const domain=result.safeContact.officialDomain;
  return {
    claim:extractClaim(result.evidenceText),evidence:evidence.slice(0,6),
    unknown:[unknownFor(result.analysis.scamType),'Whether the claimed organization really sent this message. Pasted text and screenshots cannot authenticate its sender.',...(result.urlForensics.some(link=>link.domainAgeDays===null)?['The registration age of at least one link could not be confirmed.']:[])],
    safeAction:result.safeContact.message,officialDomain:domain,officialName:result.safeContact.organization,riskScore:result.analysis.riskScore,trackingNumber:domain==='usps.com'?trackingNumberFromMessage(result.evidenceText):null,
    trace:[
      {label:'Claim captured',detail:'Quoted from the submitted message',state:'observed'},
      {label:'Message signals',detail:result.analysis.redFlags.length?`${result.analysis.redFlags.length} concerns assessed`:'No specific concerns returned',state:'observed'},
      {label:'Link inspection',detail:checkedLinks?`${checkedLinks} link${checkedLinks===1?'':'s'} · ${result.scanMode==='deep'?'redirect trace requested':'passive domain checks'}`:'No link supplied',state:checkedLinks?'observed':'limited'},
      {label:'Independent claim check',detail:'Official account or case status not accessed',state:'limited'},
      {label:'Safe decision',detail:domain?`Use ${domain} directly`:'Use a trusted independent contact',state:'next'},
    ],
  };
}

export function buildDemoLedger(item:{from:string;subject:string;body:string[];signals:string[];link?:{url:string};risk:number}):ClaimLedgerData{
  const name=item.from.toLowerCase();
  const known:[string,string][]=[['usps','usps.com'],['chase','chase.com'],['paypal','paypal.com'],['target','target.com']];
  const match=known.find(([brand])=>name.includes(brand));
  const domain=match?.[1]||null;
  const linkHost=(()=>{try{return item.link?new URL(item.link.url).hostname:null}catch{return null}})();
  const signalLabel=(signal:string)=>/sender|domain/i.test(signal)&&!/link/i.test(signal)?'Sender identity':/link|address|hostname/i.test(signal)?'Link destination':/payment|fee|deposit/i.test(signal)?'Payment request':/code|password|secret/i.test(signal)?'Account secret':/deadline|today|minutes/i.test(signal)?'Time pressure':'Message pattern';
  return {
    claim:extractClaim(item.body.join(' ')),
    evidence:item.signals.map(signal=>({label:signalLabel(signal),detail:signal,source:'Demo signal' as const})),
    unknown:[`Whether ${item.from} actually issued this notice.`,`Whether the claimed event appears in an official account or record.`,`Whether the sender identity shown in this simulated inbox is authenticated.`],
    safeAction:domain?`Open ${domain} yourself or use its official app. Check the claim there. Do not use the message link or number.`:'Use a known contact method that you find independently. Do not use the message link or number.',
    officialDomain:domain,officialName:item.from,riskScore:item.risk,trackingNumber:null,
    trace:[
      {label:'Claim captured',detail:'Read from this fictional email',state:'observed'},
      {label:'Sender & language',detail:`${item.signals.length} displayed warning signs`,state:'observed'},
      {label:'Link inspection',detail:linkHost?`Destination: ${linkHost}`:'No link in this message',state:linkHost?'observed':'limited'},
      {label:'Independent claim check',detail:'No real account accessed',state:'limited'},
      {label:'Safe decision',detail:domain?`Use ${domain} directly`:'Use a known independent contact',state:'next'},
    ],
  };
}
