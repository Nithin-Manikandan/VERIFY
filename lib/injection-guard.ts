import type {Investigation} from './types';

type Analysis=Investigation['analysis'];
const instructionPattern=/ignore (?:all )?(?:previous|prior) instructions|(?:say|mark|label|classify) (?:this|it) (?:is |as )?safe/i;

export function guardAnalysis(evidence:string,analysis:Analysis):Analysis{
  const match=evidence.match(instructionPattern);
  if(!match||analysis.riskScore>=65)return analysis;
  return {
    ...analysis,
    riskScore:75,
    verdict:'SUSPICIOUS',
    redFlags:[...analysis.redFlags,{type:'Prompt manipulation',severity:'high',description:'The message tries to control the assessment rather than provide ordinary information.',quotedPhrase:match[0]}],
    why:'This message tries to tell the investigator what result to give. Treat that as a warning sign and verify through a trusted channel.'
  };
}
