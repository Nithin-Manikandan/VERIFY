'use client';

import {useState} from 'react';
import {ArrowRight,Eye,FileText,Fingerprint,Link2,LockKeyhole,Route,ShieldCheck} from 'lucide-react';
import {attackPath,evidenceSegments} from '../lib/dossier';
import type {Investigation} from '../lib/types';

type Tab='source'|'links'|'trajectory';
function displayHost(value:string){try{return new URL(value).hostname}catch{return 'Unrecognized address'}}
const tabLabels:{id:Tab;label:string;icon:typeof Eye}[]=[
  {id:'source',label:'Evidence lens',icon:FileText},
  {id:'links',label:'Link trace',icon:Link2},
  {id:'trajectory',label:'Next moves',icon:Route},
];

export function InvestigationDossier({result}:{result:Investigation}){
  const [tab,setTab]=useState<Tab>('source');
  const [move,setMove]=useState(0);
  const quoted=result.analysis.redFlags.map(flag=>flag.quotedPhrase).filter(Boolean);
  const segments=evidenceSegments(result.evidenceText,quoted);
  const activeSignals=result.signalProfile.filter(signal=>signal.score>=2).length;
  const cueTotal=result.signalProfile.reduce((sum,signal)=>sum+signal.score,0);
  const cueColor=cueTotal>=8?'#ff7894':cueTotal>=4?'#f7bf75':'#75f0eb';
  const path=attackPath(result.analysis.scamType);

  return <section className="dossier" aria-label="Investigation dossier">
    <div className="dossier-heading">
      <div><span className="dossier-overline"><Fingerprint size={15}/> INVESTIGATION DOSSIER</span><h3>See the pattern. Trace the proof.</h3><p>Five observable signals and the exact source behind this assessment.</p></div>
      <div className="signal-orb" style={{background:`conic-gradient(${cueColor} ${cueTotal/15*100}%, #28384a 0)`}} aria-label={`${activeSignals} of 5 strong patterns observed`}><div><b>{activeSignals}<small>/5</small></b><span>STRONG<br/>PATTERNS</span></div></div>
    </div>

    <div className="signal-board" aria-label="Pattern fingerprint">
      {result.signalProfile.map(signal=><div className="signal-row" key={signal.id}>
        <div className="signal-row-head"><strong>{signal.label}</strong><span>{signal.score===0?'NOT SEEN':signal.score===1?'TRACE':signal.score===2?'ELEVATED':'STRONG'}</span></div>
        <div className="signal-track"><span className={signal.score>=2?'hot':''} style={{width:`${signal.score/3*100}%`}}/></div>
        <small>{signal.note}{signal.matchedPhrase&&signal.score>0?<em> · “{signal.matchedPhrase.slice(0,55)}{signal.matchedPhrase.length>55?'…':''}”</em>:null}</small>
      </div>)}
    </div>
    <p className="dossier-disclaimer"><ShieldCheck size={14}/> Pattern strength is a count of visible cues, not a probability or proof of fraud.</p>

    <div className="dossier-tabs" role="tablist" aria-label="Investigation details">
      {tabLabels.map(({id,label,icon:Icon})=><button role="tab" aria-selected={tab===id} className={tab===id?'active':''} key={id} onClick={()=>setTab(id)}><Icon size={15}/>{label}</button>)}
    </div>
    <div className="dossier-tab-content" role="tabpanel">
      {tab==='source'&&<>
        <div className="dossier-section-label"><Eye size={15}/> SOURCE MESSAGE <span>{quoted.length} QUOTES CHECKED</span></div>
        <div className="evidence-source">{segments.map((segment,i)=>segment.highlight?<mark key={i}>{segment.text}</mark>:<span key={i}>{segment.text}</span>)}</div>
        <p className="dossier-caption">Highlighted text is an exact quote from the submitted message. Unhighlighted text may still matter; the model can miss signs.</p>
      </>}
      {tab==='links'&&<>
        <div className="dossier-section-label"><LockKeyhole size={15}/> LINK PRIVACY <span>{result.scanMode==='deep'?'DEEP TRACE':'PASSIVE MODE'}</span></div>
        <p className="dossier-caption">{result.scanMode==='deep'?'Redirect checks were requested. The scanner may have contacted linked sites from the server.':'The scanner checked domain cues without opening a suspicious page. A sender may still learn that its domain was queried.'}</p>
        {result.urlForensics.length===0?<div className="dossier-empty">No web links were detected in this message. A scam can still arrive through a phone number, QR code, or request to reply.</div>:result.urlForensics.map((link,i)=><div className="link-dossier" key={i}>
          <div className="link-dossier-head"><span>LINK {String(i+1).padStart(2,'0')}</span><strong>{displayHost(link.originalUrl)}</strong></div>
          <code>{link.originalUrl}</code>
          <div className="link-metrics"><span>Domain age <b>{link.domainAgeDays===null?'Unknown':`${link.domainAgeDays} days`}</b></span><span>Redirects <b>{result.scanMode==='deep'?Math.max(0,link.redirectChain.length-1):'Not opened'}</b></span></div>
          {link.flags.length?<ul>{link.flags.map((flag,j)=><li key={j}>{flag}</li>)}</ul>:<p>No obvious domain warning was found. That does not prove the link is safe.</p>}
        </div>)}
      </>}
      {tab==='trajectory'&&<>
        <div className="dossier-section-label"><Route size={15}/> POSSIBLE ATTACK PATH <span>ILLUSTRATIVE</span></div>
        {result.analysis.verdict==='SAFE'?<div className="dossier-empty">No attack path is shown for this lower-risk assessment. If the request is unexpected, verify it through an independent channel anyway.</div>:<>
          <p className="dossier-caption">A common pattern for this type of scam, shown as a scenario rather than a prediction of this sender.</p>
          <div className="trajectory-steps">{path.moves.map((item,i)=><button className={move===i?'active':''} key={item} onClick={()=>setMove(i)}><span>0{i+1}</span>{item}</button>)}</div>
          <div className="trajectory-break"><span><ShieldCheck size={17}/> BREAK THE CHAIN</span><strong>{path.breaks[move]}</strong><button onClick={()=>setMove((move+1)%3)}>Next move <ArrowRight size={14}/></button></div>
        </>}
      </>}
    </div>
  </section>
}
