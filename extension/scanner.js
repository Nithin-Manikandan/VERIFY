/* Local-only, explainable checks. This file also runs as a classic Gmail content script. */
(() => {
  const brands={usps:'usps.com',fedex:'fedex.com',ups:'ups.com',chase:'chase.com',paypal:'paypal.com',amazon:'amazon.com',apple:'apple.com',google:'google.com',microsoft:'microsoft.com',netflix:'netflix.com',wellsfargo:'wellsfargo.com',coinbase:'coinbase.com'};
  const unusual=new Set(['zip','top','xyz','click','work','buzz','site']);
  const shorteners=new Set(['bit.ly','tinyurl.com','t.co','rb.gy','cutt.ly']);
  function host(value){try{return new URL(value).hostname.toLowerCase().replace(/^www\./,'')}catch{return ''}}
  function inside(domain,official){return domain===official||domain.endsWith('.'+official)}
  function scan({subject='',senderName='',senderEmail='',body='',links=[]}={}){
    const text=[subject,body].join('\n').slice(0,6000);
    const identity=[subject,senderName].join(' ').toLowerCase();
    const signals=[];let score=0;
    const add=(points,reason)=>{if(!signals.includes(reason)){score+=points;signals.push(reason)}};
    const claimed=Object.entries(brands).find(([name])=>new RegExp(`\\b${name}\\b`,'i').test(identity));
    const senderDomain=senderEmail.split('@')[1]?.toLowerCase()||'';
    if(claimed&&senderDomain&&!inside(senderDomain,claimed[1]))add(24,`Sender domain is not ${claimed[1]}`);
    const foundLinks=[...new Set([...links,...(text.match(/https?:\/\/[^\s<>"']+/gi)||[])])].slice(0,12);
    for(const link of foundLinks){
      const domain=host(link);if(!domain)continue;
      if(claimed&&!inside(domain,claimed[1]))add(34,`Link points outside ${claimed[1]}`);
      if(shorteners.has(domain))add(15,'A shortened link hides its destination');
      if(domain.includes('xn--'))add(25,'A link uses encoded characters in its domain');
      if(unusual.has(domain.split('.').at(-1)))add(13,'A link uses an unusual domain ending');
      if(/\.(?:example|test)$/.test(domain))add(12,'The link uses a demonstration domain');
    }
    if(/\b(?:one.time code|verification code|security code|otp|password|passcode|seed phrase|recovery phrase)\b/i.test(text))add(28,'The message asks about an account secret');
    if(/\b(?:gift card|bitcoin|cryptocurrency|crypto|wire transfer|zelle|cash app)\b/i.test(text))add(22,'A hard-to-reverse payment method appears');
    if(/\b(?:pay|payment|fee|deposit|charge)\b/i.test(text)&&foundLinks.length)add(12,'A payment request is paired with a link');
    if(/\b(?:act now|final notice|last chance|within \d+ (?:minutes?|hours?)|by \d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i.test(text))add(16,'The message adds a deadline');
    if(/\b(?:do not tell|don.t call|keep this between us|do not use the app)\b/i.test(text))add(25,'The message discourages an independent check');
    if(/\b[^\s]+\.(?:html?|exe|scr|js|vbs|iso)\b/i.test(text))add(20,'A potentially dangerous attachment type appears');
    const riskScore=Math.min(100,score);
    return {riskScore,level:riskScore>=65?'high':riskScore>=30?'caution':'clear',signals,links:foundLinks,claimedDomain:claimed?.[1]||null};
  }
  globalThis.VerifyScanner={scan,host};
})();
