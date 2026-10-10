type Span={start:number;end:number};
type Answer=Span&{text:string};

function union(spans:Span[]):Span[]{
  const sorted=[...spans].filter(s=>s.end>s.start).sort((a,b)=>a.start-b.start);
  const merged:Span[]=[];
  for(const span of sorted){const last=merged.at(-1);if(last&&span.start<=last.end)last.end=Math.max(last.end,span.end);else merged.push({...span})}
  return merged;
}
function overlap(a:Span,b:Span){return Math.max(0,Math.min(a.end,b.end)-Math.max(a.start,b.start))}

export function scoreSelections(message:string,answers:Answer[],selections:Span[]){
  const selected=union(selections.map(s=>({start:Math.max(0,Math.min(message.length,s.start)),end:Math.max(0,Math.min(message.length,s.end))})));
  const keys=union(answers);
  const found=answers.filter(answer=>selected.reduce((n,span)=>n+overlap(answer,span),0)>=Math.ceil((answer.end-answer.start)*.5));
  const selectedCharacters=selected.reduce((n,span)=>n+span.end-span.start,0);
  const correctCharacters=selected.reduce((n,span)=>n+keys.reduce((m,key)=>m+overlap(span,key),0),0);
  const precision=selectedCharacters?correctCharacters/selectedCharacters:0;
  const recall=answers.length?found.length/answers.length:0;
  const percentage=precision+recall?Math.round(100*2*precision*recall/(precision+recall)):0;
  return {score:found.length,maxScore:answers.length,percentage,selectionPrecision:Math.round(precision*100),foundFlags:found.map(f=>f.text),missedFlags:answers.filter(f=>!found.includes(f))};
}
