'use client';

import {useCallback,useEffect,useState} from 'react';
import {ArrowUpRight,Users} from 'lucide-react';
import type {RadarChannel} from '../lib/radar';

type Summary={host:string;reports:number;channels:Record<string,number>;myReport:boolean;windowDays:number;verification:string};

export function CommunityPulse({host,channel,sample}:{host:string|null;channel:RadarChannel;sample:boolean}){
  const [summary,setSummary]=useState<Summary|null>(null);
  const [loading,setLoading]=useState(false);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState('');
  const refresh=useCallback(async(signal?:AbortSignal)=>{
    if(!host||sample)return;
    setLoading(true);
    try{const response=await fetch(`/api/campaign/reports?host=${encodeURIComponent(host)}`,{cache:'no-store',signal});const data=await response.json() as Summary&{error?:string};if(!response.ok)throw new Error(data.error||'Could not load reports.');if(!signal?.aborted)setSummary(data)}
    catch(cause){if(!signal?.aborted)setError(cause instanceof Error?cause.message:'Could not load reports.')}
    finally{if(!signal?.aborted)setLoading(false)}
  },[host,sample]);
  useEffect(()=>{if(!host||sample)return;const controller=new AbortController();const initial=setTimeout(()=>{setSummary(null);setError('');void refresh(controller.signal)},0);return ()=>{clearTimeout(initial);controller.abort()}},[host,sample,refresh]);
  async function update(remove:boolean){
    if(!host)return;setWorking(true);setError('');
    try{const response=await fetch('/api/campaign/reports',{method:remove?'DELETE':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host,channel})});const data=await response.json() as {error?:string};if(response.status===401){setError('Sign in to VERIFY before submitting a community report.');return}if(!response.ok)throw new Error(data.error||'Could not update your report.');await refresh()}
    catch(cause){setError(cause instanceof Error?cause.message:'Could not update your report.')}
    finally{setWorking(false)}
  }
  return <section className="community-pulse" aria-label="Community reports"><div className="community-pulse-title"><Users size={16}/><strong>COMMUNITY SIGNAL</strong><span>OPT-IN · LIVE DATA</span></div>
    {!host?<p>Add a message with a web destination to check community submissions.</p>:sample?<p>This destination is part of a fictional example. Demo artifacts never enter live report counts. Add your own evidence to check a real destination.</p>:<><div className="community-pulse-count"><strong>{loading?'…':summary?.reports??'—'}</strong><span>unique account {summary?.reports===1?'report':'reports'} for <b>{host}</b> in the last 30 days</span></div>{summary&&summary.reports>0&&<div className="community-pulse-channels">{Object.entries(summary.channels).sort((a,b)=>b[1]-a[1]).map(([source,count])=><span key={source}>{source.toUpperCase()} · {count}</span>)}</div>}<p>These are user submissions, not verified scam findings. A zero count does not mean a link is safe. VERIFY stores the hostname and channel, never the message body.</p>{error&&<div className="community-pulse-error" role="alert">{error}{error.startsWith('Sign in')&&<a href="/signin-with-chatgpt?return_to=%2Fradar">Sign in <ArrowUpRight size={13}/></a>}</div>}<button disabled={loading||working} onClick={()=>void update(Boolean(summary?.myReport))}>{working?'Saving…':summary?.myReport?'Withdraw my report':'Report this destination'}</button></>}
  </section>;
}
