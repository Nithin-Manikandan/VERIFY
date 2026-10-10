export type ReportChannel='email'|'text'|'qr'|'call';

export function reportableHost(value:string){
  const raw=value.trim().toLowerCase();
  if(!raw||raw.length>253)return null;
  let host:string;
  try{const url=new URL(raw.includes('://')?raw:`https://${raw}`);if(url.username||url.password||!['http:','https:'].includes(url.protocol))return null;host=url.hostname.replace(/^www\./,'').replace(/\.$/,'')}catch{return null}
  if(!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host)||host.split('.').some(part=>part.startsWith('-')||part.endsWith('-')||part.length>63))return null;
  if(/\.(?:example|test|invalid|local|localhost)$/.test(host)||/^\d+(?:\.\d+){3}$/.test(host))return null;
  return host;
}

export function reportChannel(value:unknown):ReportChannel|null{
  return value==='email'||value==='text'||value==='qr'||value==='call'?value:null;
}
