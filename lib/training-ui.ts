export type Passage={start:number;end:number;text:string};

export function splitPassages(message:string):Passage[]{
  const passages:Passage[]=[];
  let cursor=0;
  const add=(end:number)=>{
    const raw=message.slice(cursor,end);
    const leading=raw.length-raw.trimStart().length;
    const trailing=raw.length-raw.trimEnd().length;
    const start=cursor+leading;
    if(end-trailing>start)passages.push({start,end:end-trailing,text:message.slice(start,end-trailing)});
    cursor=end;
  };
  for(const boundary of message.matchAll(/[.!?](?=\s|$)|\n/g))add((boundary.index??0)+boundary[0].length);
  if(cursor<message.length)add(message.length);
  return passages;
}
