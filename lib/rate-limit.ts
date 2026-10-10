const hits=new Map<string,{count:number;until:number}>();
export function rateLimit(request:Request,limit=25){const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-real-ip')||'unknown',now=Date.now(),record=hits.get(ip);if(!record||record.until<now){hits.set(ip,{count:1,until:now+60000});return true}if(record.count>=limit)return false;record.count++;return true}
