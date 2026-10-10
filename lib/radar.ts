export type RadarChannel='email'|'text'|'qr'|'call';
import {findPhoneNumbers} from './phones.js';
export type RadarArtifact={id:string;channel:RadarChannel;title:string;content:string;source:string;sample:boolean;addedAt:string};
export type RadarSignal={label:string;detail:string;weight:number};
export type RadarFinding={risk:number;brand:string|null;officialDomain:string|null;urls:string[];hosts:string[];phones:string[];signals:RadarSignal[];type:'package'|'bank'|'job'|'family'|'other'};
export type RadarConnection={a:string;b:string;reason:string;strength:'strong'|'supporting'};
export type TrustedRoute={name:string;domain:string|null;url:string|null;steps:string[]};
export type ForecastStep={title:string;attacker:string;warning:string;safeAction:string};

const official:Record<string,{name:string;domain:string}>={
  usps:{name:'USPS',domain:'usps.com'},fedex:{name:'FedEx',domain:'fedex.com'},ups:{name:'UPS',domain:'ups.com'},
  chase:{name:'Chase',domain:'chase.com'},paypal:{name:'PayPal',domain:'paypal.com'},amazon:{name:'Amazon',domain:'amazon.com'},
  apple:{name:'Apple',domain:'apple.com'},google:{name:'Google',domain:'google.com'},microsoft:{name:'Microsoft',domain:'microsoft.com'},
  target:{name:'Target',domain:'target.com'},irs:{name:'IRS',domain:'irs.gov'},
};
const demoHost='usps.com.delivery-review.example';
export const sampleRadarArtifacts:RadarArtifact[]=[
  {id:'sample-email',channel:'email',title:'Package #4821 needs an address update',source:'notice@delivery-status.click',content:`From: USPS Delivery <notice@delivery-status.click>\nSubject: Package #4821 needs an address update\n\nWe could not verify the apartment number on your parcel. Pay the $0.49 redelivery fee by 6 PM at https://${demoHost}/update to prevent a return to sender.`,sample:true,addedAt:'9:41 AM'},
  {id:'sample-text',channel:'text',title:'Second delivery reminder',source:'+1 (202) 555-0142',content:`USPS: Final reminder for package #4821. Your redelivery request is incomplete. Complete the $0.49 fee at https://${demoHost}/update by 6 PM today.`,sample:true,addedAt:'10:12 AM'},
  {id:'sample-qr',channel:'qr',title:'QR code on a delivery notice',source:'Printed notice · decoded locally',content:`https://${demoHost}/update`,sample:true,addedAt:'10:26 AM'},
  {id:'sample-safe',channel:'email',title:'Your library hold is ready',source:'notices@rivertonlibrary.org',content:'Your requested book is ready at the main branch. We will hold it through October 14. Bring your library card when you visit. No payment is due.',sample:true,addedAt:'Yesterday'},
];

function domainOf(value:string){try{return new URL(value).hostname.toLowerCase().replace(/^www\./,'').replace(/\.$/,'')}catch{return ''}}
function inDomain(host:string,domain:string){return host===domain||host.endsWith('.'+domain)}
function textUrls(text:string){return [...new Set((text.match(/https?:\/\/[^\s<>"'\])}]+/gi)||[]).map(link=>link.replace(/[.,;!?]+$/,'')))].slice(0,12)}
function brandIn(text:string,channel:RadarChannel){const copy=channel==='qr'?text:text.replace(/https?:\/\/\S+/g,'');return Object.entries(official).find(([key])=>new RegExp(`\\b${key}\\b`,'i').test(copy))||null}
function senderDomain(text:string){const match=text.match(/(?:from:\s*[^\n]*?)?<?[\w.+-]+@([a-z0-9.-]+\.[a-z]{2,})>?/i);return match?.[1]?.toLowerCase()||''}

export function inspectRadarArtifact(item:RadarArtifact):RadarFinding{
  const text=[item.title,item.source,item.content].join('\n');
  const urls=textUrls(text),hosts=[...new Set(urls.map(domainOf).filter(Boolean))];
  const phones=[...new Set(findPhoneNumbers(text).map(phone=>phone.replace(/\D/g,'').slice(-10)))];
  const brand=brandIn(item.title+'\n'+item.source+'\n'+item.content,item.channel);
  const officialDomain=brand?.[1].domain||null;
  const signals:RadarSignal[]=[];
  const add=(weight:number,label:string,detail:string)=>{if(!signals.some(signal=>signal.label===label))signals.push({weight,label,detail})};
  const sender=senderDomain(item.source)||senderDomain(item.content.split('\n')[0]||'');
  if(item.channel==='email'&&officialDomain&&sender&&!inDomain(sender,officialDomain))add(24,'Sender mismatch',`${sender} is outside ${officialDomain}`);
  for(const host of hosts){
    if(officialDomain&&!inDomain(host,officialDomain))add(34,'Brand link mismatch',`${host} is outside ${officialDomain}`);
    if(host.endsWith('.example'))add(12,'Demo-only destination','This reserved example domain is safe to inspect in the simulation.');
    if(/\.(?:click|top|xyz|work|buzz)$/.test(host))add(14,'Unusual domain ending',host);
    if(host.includes('xn--'))add(25,'Encoded hostname',host);
  }
  if(/\b(?:pay|payment|fee|deposit|wire|transfer|charge)\b/i.test(text)&&urls.length)add(12,'Payment through a link','The message pairs money with a web action.');
  if(/\b(?:by\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|within\s+\d+\s+(?:minutes?|hours?)|today|final reminder|last chance|immediately)\b/i.test(text)&&(/\b(?:pay|payment|fee|code|login|verify|confirm|complete)\b/i.test(text)))add(16,'Deadline pressure','The request pushes a quick decision.');
  if(/\b(?:one.time code|security code|verification code|password|passcode|seed phrase|recovery phrase)\b/i.test(text))add(28,'Account secret request','A password or security code should never be shared from a message.');
  if(/\b(?:do not call|don.t call|do not tell|don.t tell|keep this secret|only use this link)\b/i.test(text))add(25,'Independent check discouraged','The message tries to control how you verify it.');
  const type=/\b(?:parcel|package|delivery|usps|fedex|ups)\b/i.test(text)?'package':/\b(?:bank|chase|paypal|transfer|account)\b/i.test(text)?'bank':/\b(?:job|recruit|onboard|equipment deposit)\b/i.test(text)?'job':/\b(?:mom|dad|grandma|grandpa|family emergency)\b/i.test(text)?'family':'other';
  return {risk:Math.min(100,signals.reduce((sum,signal)=>sum+signal.weight,0)),brand:brand?.[1].name||null,officialDomain,urls,hosts,phones,signals,type};
}

export function connectRadarArtifacts(items:RadarArtifact[]):RadarConnection[]{
  const findings=items.map(inspectRadarArtifact),connections:RadarConnection[]=[];
  for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){
    const sharedHost=findings[a].hosts.find(host=>findings[b].hosts.includes(host));
    const sharedPhone=findings[a].phones.find(phone=>findings[b].phones.includes(phone));
    if(sharedHost)connections.push({a:items[a].id,b:items[b].id,reason:`Same destination · ${sharedHost}`,strength:'strong'});
    else if(sharedPhone)connections.push({a:items[a].id,b:items[b].id,reason:`Same phone · ending ${sharedPhone.slice(-4)}`,strength:'strong'});
  }
  return connections;
}

export function connectedIds(items:RadarArtifact[],selectedId:string){const edges=connectRadarArtifacts(items),found=new Set([selectedId]);let changed=true;while(changed){changed=false;for(const edge of edges){if(found.has(edge.a)&&!found.has(edge.b)){found.add(edge.b);changed=true}else if(found.has(edge.b)&&!found.has(edge.a)){found.add(edge.a);changed=true}}}return [...found]}

export function trustedRouteFor(item:RadarArtifact):TrustedRoute{
  const finding=inspectRadarArtifact(item);
  const source=Object.values(official).find(record=>record.domain===finding.officialDomain);
  return source?{name:source.name,domain:source.domain,url:`https://${source.domain}/`,steps:[`Open ${source.domain} yourself or use its official app.`,`Check the claim there using a tracking number or account activity you already know.`,`Ignore phone numbers, QR codes, and links in the suspicious message.`]}:{name:'Independent verification',domain:null,url:null,steps:['Open the organization’s app or site from a saved bookmark or search for it yourself.','Use a known phone number from a card, statement, or previous record.','Do not use the link or phone number in the message.']};
}

export function forecastFor(item:RadarArtifact):ForecastStep[]{
  const type=inspectRadarArtifact(item).type;
  if(type==='package')return [
    {title:'The small-fee hook',attacker:'“Confirm the address and pay $0.49 to release your parcel.”',warning:'A tiny fee makes the request feel routine.',safeAction:'Check tracking in the carrier’s official app or site.'},
    {title:'The checkout trap',attacker:'“Enter your card number to complete redelivery.”',warning:'A lookalike page can collect card details even for a small charge.',safeAction:'Close the message link. Open the official carrier domain yourself.'},
    {title:'The follow-up',attacker:'“The first payment failed. Try a different card.”',warning:'Repeated payment attempts can expose more accounts.',safeAction:'If card details were entered, contact your card issuer using the number on the card.'},
  ];
  if(type==='bank')return [
    {title:'The alarm',attacker:'“A transfer is pending. Act now to stop it.”',warning:'Fear creates pressure to skip independent checks.',safeAction:'Open your bank app or call the number on your card.'},
    {title:'The verification pretext',attacker:'“Read me the code we just texted you.”',warning:'The code may authorize access or a payment.',safeAction:'Never read a one-time code to someone who contacted you.'},
    {title:'The isolation move',attacker:'“Do not call the bank until this case is closed.”',warning:'The attacker is trying to control your verification route.',safeAction:'End the conversation and contact the bank directly.'},
  ];
  if(type==='family')return [
    {title:'The familiar voice',attacker:'“It’s me. I’m in trouble and need help now.”',warning:'A familiar voice is not proof of identity.',safeAction:'Ask for your family safe word or a fact you agreed on privately.'},
    {title:'The secrecy request',attacker:'“Please do not tell anyone yet.”',warning:'Secrecy prevents a second person from checking the story.',safeAction:'Hang up and call your loved one on a known number.'},
    {title:'The payment route',attacker:'“Send it by transfer or gift card right away.”',warning:'Hard-to-reverse payment is a common endpoint.',safeAction:'Verify through another family member before sending money.'},
  ];
  return [
    {title:'The opening claim',attacker:'“There is a problem or opportunity that needs your attention.”',warning:'The first message establishes a reason to respond.',safeAction:'Pause and check the claim through a separate channel.'},
    {title:'The urgent action',attacker:'“Use this link or number now.”',warning:'The message tries to move you onto a channel it controls.',safeAction:'Find the organization’s official site or known contact yourself.'},
    {title:'The valuable request',attacker:'“Send money or personal information to finish.”',warning:'This is where an earlier interaction can turn into loss.',safeAction:'Do not pay or share secrets until the claim is independently verified.'},
  ];
}
