import type {Investigation} from './types';
import {findPhoneNumbers} from './phones.js';

type Analysis=Investigation['analysis'];
type Entities=Investigation['entities'];

// The model can still mistake routine message metadata for evidence. Keep the
// displayed dossier tied to signals we can actually locate in the input.
export function validateAnalysisEvidence(evidence:string,analysis:Analysis,entities:Entities,links:Investigation['urlForensics']):Analysis{
  const redFlags=analysis.redFlags.filter(flag=>{
    if(flag.quotedPhrase&&!evidence.includes(flag.quotedPhrase))return false;
    const label=`${flag.type} ${flag.description}`.toLowerCase();
    const quote=flag.quotedPhrase.toLowerCase().trim();
    if(/\b(?:phone number|telephone|callback number)\b/.test(label)){
      if(!entities.phoneNumbers.length||!findPhoneNumbers(flag.quotedPhrase).length)return false;
    }
    if(/\b(?:opt.out|unsubscribe|reply stop|stop message)\b/.test(label)&&
       /^(?:reply\s+)?stop(?:\s+to\s+opt\s+out)?[.!]?$/i.test(quote))return false;
    if(/\b(?:domain age|newly registered|recently registered|new domain)\b/.test(label)&&
       !links.some(link=>link.domainAgeDays!==null&&link.domainAgeDays<90))return false;
    if(/\b(?:redirect|forwarding chain)\b/.test(label)&&
       !links.some(link=>link.redirectChain.length>1))return false;
    return true;
  });
  if(redFlags.length===analysis.redFlags.length)return analysis;
  const directChecks=links.flatMap(link=>link.flags.filter(flag=>/outside |domain is only |redirects |unsafe address/i.test(flag)));
  const descriptions=[...new Set([...directChecks,...redFlags.map(flag=>flag.description)].filter(Boolean))].slice(0,3);
  const why=descriptions.length
    ?`${descriptions.join(' ')} The message's underlying claim has not been independently verified.`
    :'No concrete scam indicator was confirmed by this scan. The message\'s underlying claim has not been independently verified.';
  const riskScore=descriptions.length?analysis.riskScore:Math.min(analysis.riskScore,30);
  const verdict=!descriptions.length&&analysis.verdict==='LIKELY SCAM'?'SUSPICIOUS':analysis.verdict;
  return {...analysis,redFlags,why,riskScore,verdict};
}
