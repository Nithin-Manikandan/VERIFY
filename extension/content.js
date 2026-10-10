(() => {
  const root=document.createElement('div');root.id='verify-guard-root';document.documentElement.append(root);
  let currentKey='',currentRisk=0,currentSignals=[],currentOfficialDomain='',pendingLink='',timer=0;
  const continued=new Set();
  const reported=new Map();

  function sendAction(type,payload){return new Promise(resolve=>chrome.runtime.sendMessage({type,...payload},response=>resolve(response||{ok:false}))) }
  async function scanInbox(syncEnabled){
    const alerts=[];
    for(const row of document.querySelectorAll('tr.zA')){
      if(!visible(row))continue;
      const subject=row.querySelector('.bog')?.textContent?.trim()||'';
      if(!subject)continue;
      const snippet=row.querySelector('.y2')?.textContent?.trim()||'';
      const senderElement=row.querySelector('.zF[email], .yW [email]');
      const senderName=senderElement?.textContent?.trim()||row.querySelector('.yW')?.textContent?.trim()||'';
      const senderEmail=senderElement?.getAttribute('email')||'';
      const threadKey=row.getAttribute('data-legacy-thread-id')||row.getAttribute('data-thread-id')||`${senderEmail}|${subject}`;
      const result=VerifyScanner.scan({subject,senderName,senderEmail,body:snippet});
      const subjectCell=row.querySelector('.y6')||row.querySelector('.bog')?.parentElement;
      const previous=row.querySelector('.verify-row-badge');
      if(result.riskScore>=30&&subjectCell){
        const badge=previous||node('span','verify-row-badge');
        badge.textContent=result.riskScore>=65?'VERIFY · HIGH RISK':'VERIFY · CHECK';
        badge.classList.toggle('verify-row-high',result.riskScore>=65);
        if(!previous)subjectCell.prepend(badge);
        if(syncEnabled&&reported.get(threadKey)!==result.riskScore){
          reported.set(threadKey,result.riskScore);
          alerts.push({threadKey,sender:senderEmail||senderName,subject,riskScore:result.riskScore,signals:result.signals,source:'preview'});
        }
      }else if(previous)previous.remove();
    }
    for(let index=0;index<alerts.length;index+=30){
      const batch=alerts.slice(index,index+30);
      const response=await sendAction('SYNC_ALERTS',{alerts:batch});
      if(!response.ok)for(const alert of batch)reported.delete(alert.threadKey);
    }
  }

  function visible(element){return Boolean(element&&element.getClientRects().length)}
  function openedEmail(){
    const subjectElement=document.querySelector('h2.hP');
    if(!visible(subjectElement))return null;
    const bodies=[...document.querySelectorAll('.a3s.aiL')].filter(visible);
    if(!bodies.length)return null;
    const body=bodies.map(node=>node.innerText||'').filter(Boolean).join('\n\n').slice(0,5200);
    if(!body.trim())return null;
    const sender=document.querySelector('.gD[email]');
    const senderName=sender?.textContent?.trim()||'';
    const senderEmail=sender?.getAttribute('email')||'';
    const links=[...new Set(bodies.flatMap(node=>[...node.querySelectorAll('a[href]')].map(a=>a.href).filter(href=>/^https?:/i.test(href))))].slice(0,12);
    const subject=subjectElement.textContent?.trim()||'';
    return {subject,senderName,senderEmail,body,links};
  }
  function message(key,text){return new Promise(resolve=>chrome.runtime.sendMessage({type:'SCAN',text},response=>resolve(response||{ok:false,error:chrome.runtime.lastError?.message||'Extension unavailable.'})))}
  function node(tag,className,text){const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element}
  function button(label,onClick,secondary=false){const element=node('button',secondary?'verify-secondary':'verify-primary',label);element.type='button';element.addEventListener('click',onClick);return element}
  function clear(){root.replaceChildren()}
  function alertPanel(title,description,signals,actions,urgent=false){
    clear();const shade=node('div','verify-shade');const panel=node('section','verify-panel');panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',title);
    const badge=node('div','verify-kicker',urgent?(title==='Phishing link alert'?'● VERIFY / PHISHING ALERT':'● VERIFY / SCAM ALERT'):'● VERIFY / HEADS UP');
    panel.append(badge,node('h2','',title),node('p','',description));
    if(signals.length){const heading=node('div','verify-reasons-label','WHY VERIFY FLAGGED IT');const list=node('ul','verify-signals');for(const signal of signals.slice(0,4))list.append(node('li','',signal));panel.append(heading,list)}
    if(urgent&&(title.startsWith('Scam alert')||title==='Phishing link alert')){const check=node('div','verify-claim-check');check.append(node('strong','','CLAIM NOT VERIFIED'),node('p','','These warning signs do not confirm whether the message’s account, payment, or delivery claim is real.'));if(currentOfficialDomain){const route=node('a','','Check at '+currentOfficialDomain+' instead ↗');route.href='https://'+currentOfficialDomain+'/';route.target='_blank';route.rel='noopener noreferrer';check.append(route)}else check.append(node('span','','Use an official app or a contact you find independently.'));panel.append(check)}
    const controls=node('div','verify-actions');for(const action of actions)controls.append(button(action.label,action.run,action.secondary));panel.append(controls);
    const foot=node('small','verify-foot','Assessment only. Verify independently using a site or app you opened yourself.');panel.append(foot);shade.append(panel);root.append(shade);
  }
  function showRisk(key,score,signals,source){
    if(key!==currentKey)return;
    currentRisk=Math.max(currentRisk,score);currentSignals=[...new Set([...currentSignals,...signals])];
    if(currentRisk>=65&&!continued.has(key)){
      alertPanel('Scam alert: this email looks suspicious',`${source} found strong warning signs before you opened this email. Here is why:`,currentSignals,[
        {label:'Back to inbox',run:()=>{continued.add(key);clear();location.hash='#inbox'}},
        {label:'I want to continue',secondary:true,run:()=>confirmEmailOverride(key)},
      ],true);
    }else if(currentRisk>=30&&!continued.has(key)){
      clear();const toast=node('aside','verify-toast');toast.setAttribute('role','status');toast.append(node('strong','','VERIFY found warning signs'),node('span','',currentSignals.slice(0,2).join(' · ')));
      toast.append(button('Review',()=>alertPanel('Possible scam alert','This email has warning signs. Review the reasons and verify the claim independently.',currentSignals,[{label:'Back to Gmail',run:()=>{continued.add(key);clear()}}])));
      root.append(toast);
    }else if(currentRisk<30)clear();
  }
  function confirmEmailOverride(key){
    alertPanel('Continue despite the warning?','The message may be fraudulent. Revealing it does not make its links safe; VERIFY will still pause risky links.',currentSignals,[
      {label:'Back to inbox',run:()=>{continued.add(key);clear();location.hash='#inbox'}},
      {label:'Reveal email anyway',secondary:true,run:()=>{continued.add(key);clear()}},
    ],true);
  }
  async function inspect(){
    const {enabled=true,cloudEnabled=false,syncEnabled=false,token}=await chrome.storage.local.get(['enabled','cloudEnabled','syncEnabled','token']);
    if(!enabled){currentRisk=0;clear();return}
    await scanInbox(Boolean(syncEnabled&&token));
    const email=openedEmail();if(!email){currentKey='';currentRisk=0;currentOfficialDomain='';clear();return}
    const key=[location.hash,email.subject,email.senderEmail,email.body.length,email.body.slice(0,140)].join('|');
    if(key===currentKey)return;
    currentKey=key;currentRisk=0;currentSignals=[];currentOfficialDomain='';clear();
    const local=VerifyScanner.scan(email);
    currentOfficialDomain=local.claimedDomain||'';
    showRisk(key,local.riskScore,local.signals,'Local checks');
    if(syncEnabled&&token&&local.riskScore>=30)void sendAction('SYNC_ALERTS',{alerts:[{threadKey:location.hash||`${email.senderEmail}|${email.subject}`,sender:email.senderEmail||email.senderName,subject:email.subject,riskScore:local.riskScore,signals:local.signals,source:'opened'}]});
    if(cloudEnabled&&token){
      const submitted=[`Subject: ${email.subject}`,`From: ${email.senderName} <${email.senderEmail}>`,email.body,...email.links.map(link=>`Link: ${link}`)].join('\n').slice(0,6000);
      const response=await message(key,submitted);
      if(key!==currentKey||!response.ok||response.result?.skipped)return;
      const analysis=response.result?.analysis;if(!analysis)return;
      const details=(analysis.redFlags||[]).map(flag=>flag.description).filter(Boolean);
      showRisk(key,analysis.riskScore,details,'Cloud analysis');
    }
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>void inspect(),450)}
  document.addEventListener('click',event=>{
    if(currentRisk<30||!currentKey||!openedEmail())return;
    const target=event.target;if(!(target instanceof Element))return;
    const link=target.closest('.a3s a[href]');if(!link)return;
    let destination;try{destination=new URL(link.href)}catch{return}
    if(!['http:','https:'].includes(destination.protocol))return;
    event.preventDefault();event.stopImmediatePropagation();pendingLink=destination.href;
    alertPanel('Phishing link alert',`This link leads to ${destination.hostname} from an email with warning signs. Here is why VERIFY paused it:`,currentSignals,[
      {label:'Stay in Gmail',run:clear},
      {label:'I still want to open it',secondary:true,run:()=>alertPanel('Open this address anyway?',`You are choosing to visit ${destination.hostname} despite the warning. VERIFY cannot protect information you enter there.`,currentSignals,[
        {label:'Keep it blocked',run:clear},
        {label:'Open anyway',secondary:true,run:()=>{const url=pendingLink;pendingLink='';clear();window.open(url,'_blank','noopener,noreferrer')}},
      ],true)},
    ],true);
  },true);
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes.enabled||changes.cloudEnabled||changes.syncEnabled||changes.token)){currentKey='';if(changes.syncEnabled)reported.clear();schedule()}});
  window.addEventListener('hashchange',schedule);
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
  schedule();
})();
