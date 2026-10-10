export type Verdict='SAFE'|'SUSPICIOUS'|'LIKELY SCAM';
export type ScamType='package'|'bank'|'romance'|'grandparent'|'tech-support'|'job'|'crypto'|'prize'|'government'|'other';
export type Evidence={type:string;severity:'low'|'medium'|'high'|'critical';description:string;quotedPhrase:string};
export type Forensics={originalUrl:string;finalUrl:string;redirectChain:string[];flags:string[];domainAgeDays:number|null};
export type SignalAxis={id:'pressure'|'payment'|'credentials'|'isolation'|'link';label:string;score:number;note:string;matchedPhrase:string|null};
export type Investigation={entities:{urls:string[];phoneNumbers:string[];emails:string[];claimedOrganization:string|null;requestedAction:string|null;urgencyCues:string[]};urlForensics:Forensics[];analysis:{scamType:ScamType;riskScore:number;redFlags:Evidence[];verdict:Verdict;why:string};analysisMode?:'ai'|'rules';safeContact:{organization:string;officialDomain:string|null;message:string};signalProfile:SignalAxis[];evidenceText:string;scanMode:'passive'|'deep';timestamp:string};
export type TrainingFlag={text:string;explanation:string;severity:'low'|'medium'|'high'|'critical';startIndex:number;endIndex:number};
export type TrainingMessage={id:string;type:ScamType;difficulty:'easy'|'medium'|'hard';message:string;redFlags:TrainingFlag[];source?:'ai'|'practice'};
