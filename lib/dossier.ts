import type {Forensics,ScamType,SignalAxis} from './types';

type Pattern={test:RegExp;weight:number};
const patterns:Record<Exclude<SignalAxis['id'],'link'>,Pattern[]>={
  pressure:[{test:/\b(?:urgent|immediately|right now|act now|final notice|last chance)\b/i,weight:2},{test:/\b(?:within\s+\d+\s+(?:minutes?|hours?)|by\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|before\s+(?:midnight|noon|\d{1,2}(?::\d{2})?\s*(?:am|pm)))\b/i,weight:2},{test:/\b(?:expires?|deadline|closed|locked|arrested|return to sender|late fee)\b/i,weight:1}],
  payment:[{test:/\b(?:pay|payment|fee|deposit|transfer|wire|refund)\b/i,weight:1},{test:/\$\s?\d+(?:[.,]\d{2})?\b/i,weight:1},{test:/\b(?:gift cards?|crypto|bitcoin|western union|moneygram)\b/i,weight:2}],
  credentials:[{test:/\b(?:password|passcode|one.time code|verification code|otp|pin)\b/i,weight:2},{test:/\b(?:ssn|social security|seed phrase|recovery phrase|card details|card number)\b/i,weight:2},{test:/\b(?:log in|login|verify your identity|photo of your id)\b/i,weight:1}],
  isolation:[{test:/\b(?:do not tell|don't tell|keep this between us|keep it secret|confidential)\b/i,weight:2},{test:/\b(?:do not call|don't call|use this new number|only option|no one else)\b/i,weight:2},{test:/\b(?:trust me|i promise|don't ask questions)\b/i,weight:1}],
};
const labels:Record<SignalAxis['id'],string>={pressure:'Pressure',payment:'Payment',credentials:'Credentials',isolation:'Isolation',link:'Link integrity'};
const notes:Record<SignalAxis['id'],[string,string,string,string]>={
  pressure:['No clear deadline found','Time pressure appears','Strong urgency language','Multiple pressure cues'],
  payment:['No payment request found','Money is mentioned','Payment is requested','High-risk payment pattern'],
  credentials:['No secret requested','Account access is mentioned','A sensitive detail is requested','Multiple secrets are requested'],
  isolation:['No secrecy cue found','A trust cue appears','Contact is discouraged','Strong isolation pressure'],
  link:['No link found','A link appears','Link needs independent verification','Strong link warning signs'],
};

export function buildSignalProfile(text:string,links:Forensics[]):SignalAxis[]{
  const axes:SignalAxis[]=(Object.keys(patterns) as Exclude<SignalAxis['id'],'link'>[]).map(id=>{
    let score=0,matchedPhrase:string|null=null;
    for(const pattern of patterns[id]){
      const match=text.match(pattern.test);
      if(match){score+=pattern.weight;matchedPhrase??=match[0]}
    }
    score=Math.min(3,score);
    return {id,label:labels[id],score,note:notes[id][score],matchedPhrase};
  });
  const warnings=links.flatMap(link=>link.flags);
  const linkScore=Math.min(3,links.length?1+(warnings.some(w=>/outside|similar|punycode|unusual|shortener|only \d+ days/i.test(w))?1:0)+(warnings.length>1||warnings.some(w=>/outside .*; open the organization/i.test(w))?1:0):0);
  axes.push({id:'link',label:labels.link,score:linkScore,note:notes.link[linkScore],matchedPhrase:links[0]?.originalUrl??null});
  return axes;
}

export function evidenceSegments(text:string,quotes:string[]){
  const spans:{start:number;end:number}[]=[];
  for(const quote of quotes){
    if(!quote.trim())continue;
    const start=text.indexOf(quote);
    if(start>=0)spans.push({start,end:start+quote.length});
  }
  spans.sort((a,b)=>a.start-b.start||b.end-a.end);
  const merged:{start:number;end:number}[]=[];
  for(const span of spans){const last=merged.at(-1);if(last&&span.start<=last.end)last.end=Math.max(last.end,span.end);else merged.push({...span})}
  const segments:{text:string;highlight:boolean}[]=[];
  let cursor=0;
  for(const span of merged){if(span.start>cursor)segments.push({text:text.slice(cursor,span.start),highlight:false});segments.push({text:text.slice(span.start,span.end),highlight:true});cursor=span.end}
  if(cursor<text.length)segments.push({text:text.slice(cursor),highlight:false});
  return segments.length?segments:[{text,highlight:false}];
}

const paths:Record<ScamType,{moves:[string,string,string];breaks:[string,string,string]}>=
{
  package:{moves:['Claim a missed delivery','Demand a small redelivery payment','Capture card details on a lookalike page'],breaks:['Check tracking in the carrier app.','Do not pay through the message link.','Freeze or replace the card if you entered it.']},
  bank:{moves:['Claim your account is under attack','Push you toward a login or phone number','Ask for a password or one-time code'],breaks:['Open the bank app yourself.','Call the number on your card.','Never read a security code to a caller.']},
  romance:{moves:['Build closeness and trust','Introduce an urgent personal crisis','Request a hard-to-reverse transfer'],breaks:['Pause and talk to someone you trust.','Verify the story outside the chat.','Do not send money to someone you have not independently verified.']},
  grandparent:{moves:['Imitate a loved one in distress','Demand secrecy and immediate help','Send you to a new payment route'],breaks:['Ask for your family safe word.','Hang up and call a known number.','Check with another family member before paying.']},
  'tech-support':{moves:['Show a frightening device warning','Ask for remote access','Charge a fee or steal account access'],breaks:['Close the pop-up or call.','Do not install remote-control software.','Disconnect and seek trusted support if access was granted.']},
  job:{moves:['Offer an attractive remote role','Ask for equipment or onboarding fees','Collect identity or banking details'],breaks:['Verify the role on the company careers site.','Never pay to begin a job.','Contact the employer using a known channel.']},
  crypto:{moves:['Claim a wallet emergency or windfall','Push you to connect a wallet','Ask for a seed phrase or transfer'],breaks:['Open your wallet app independently.','Never enter a seed phrase into a link.','Move funds only after independent verification.']},
  prize:{moves:['Announce an unexpected prize','Require a release fee','Collect identity or payment details'],breaks:['Check whether you entered at all.','Never pay to claim a prize.','Keep your ID and card details private.']},
  government:{moves:['Impersonate an official agency','Threaten immediate penalties','Demand an unusual payment method'],breaks:['Find the agency site yourself.','Hang up on payment threats.','Use official channels to verify any notice.']},
  other:{moves:['Create a problem or opportunity','Add urgency and a link','Ask for money, access, or personal data'],breaks:['Pause before acting.','Verify through a separate channel.','Protect accounts and report if you acted.']},
};
export function attackPath(type:ScamType){return paths[type]}
