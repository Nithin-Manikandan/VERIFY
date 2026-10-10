/** VERIFY personal hackathon sync. Run this script only in your own Google account. */
const VERIFY_SITE = 'https://verify-scam-investigator.randomdude15.chatgpt.site';
const VERIFY_MAX_MESSAGES = 60;

/** Set VERIFY_PAIRING_CODE in Project Settings > Script properties, then run once. */
function connectVerify() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const code = String(scriptProperties.getProperty('VERIFY_PAIRING_CODE') || '').trim();
  if (!code) throw new Error('Add VERIFY_PAIRING_CODE in Script properties first.');
  const response = UrlFetchApp.fetch(VERIFY_SITE + '/api/extension/pair', {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({code: code, label: 'Gmail background demo sync'}),
    muteHttpExceptions: true
  });
  const result = JSON.parse(response.getContentText());
  if (response.getResponseCode() !== 200 || !result.token) throw new Error(result.error || 'Pairing failed.');
  const properties = PropertiesService.getUserProperties();
  properties.setProperty('VERIFY_TOKEN', result.token);
  properties.deleteProperty('VERIFY_SEEN');
  scriptProperties.deleteProperty('VERIFY_PAIRING_CODE');
  ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === 'scanVerifyInbox').forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('scanVerifyInbox').timeBased().everyMinutes(5).create();
  scanVerifyInbox();
  console.log('VERIFY sync connected. The script checks recent inbox messages about every five minutes.');
}

/** Runs on a time trigger. It sends flagged metadata only, never the email body. */
function scanVerifyInbox() {
  const properties = PropertiesService.getUserProperties();
  const token = properties.getProperty('VERIFY_TOKEN');
  if (!token) throw new Error('Run connectVerify first.');
  const previous = JSON.parse(properties.getProperty('VERIFY_SEEN') || '{}');
  const page = Gmail.Users.Messages.list('me', {q: 'in:inbox newer_than:2d', maxResults: VERIFY_MAX_MESSAGES});
  const messages = page.messages || [];
  const alerts = [];
  const seen = Object.assign({}, previous);
  for (const brief of messages) {
    if (previous[brief.id]) continue;
    const message = Gmail.Users.Messages.get('me', brief.id, {format: 'full'});
    const headers = message.payload && message.payload.headers || [];
    const header = name => (headers.find(item => item.name.toLowerCase() === name) || {}).value || '';
    const subject = header('subject') || '(No subject)';
    const sender = header('from');
    const body = readVerifyBody(message.payload).slice(0, 4000) || message.snippet || '';
    const result = scoreVerifyMessage(subject, sender, body);
    if (result.riskScore >= 30) alerts.push({threadKey: message.threadId || message.id, sender: sender, subject: subject, riskScore: result.riskScore, signals: result.signals, source: 'background'});
    seen[brief.id] = Date.now();
  }
  for (let index = 0; index < alerts.length; index += 30) {
    const response = UrlFetchApp.fetch(VERIFY_SITE + '/api/extension/alerts', {
      method: 'post', contentType: 'application/json', headers: {Authorization: 'Bearer ' + token},
      payload: JSON.stringify({alerts: alerts.slice(index, index + 30)}), muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) throw new Error('VERIFY alert sync failed: ' + response.getResponseCode());
  }
  // Keep only recent IDs. This prevents repeat scans without retaining message content.
  const recent = Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 250);
  properties.setProperty('VERIFY_SEEN', JSON.stringify(Object.fromEntries(recent)));
  console.log('Checked ' + messages.length + ' recent messages; flagged ' + alerts.length + '.');
}

/** Stop the timer and revoke this script's VERIFY token. */
function disconnectVerify() {
  const properties = PropertiesService.getUserProperties();
  const token = properties.getProperty('VERIFY_TOKEN');
  if (token) UrlFetchApp.fetch(VERIFY_SITE + '/api/extension/revoke', {method: 'post', headers: {Authorization: 'Bearer ' + token}, muteHttpExceptions: true});
  properties.deleteProperty('VERIFY_TOKEN');
  properties.deleteProperty('VERIFY_SEEN');
  ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === 'scanVerifyInbox').forEach(trigger => ScriptApp.deleteTrigger(trigger));
  console.log('VERIFY background sync disconnected.');
}

function readVerifyBody(part) {
  if (!part) return '';
  if (part.mimeType === 'text/plain' && part.body && part.body.data) {
    try {return Utilities.newBlob(Utilities.base64DecodeWebSafe(part.body.data)).getDataAsString('UTF-8');} catch (error) {return '';}
  }
  for (const child of part.parts || []) {const found = readVerifyBody(child); if (found) return found;}
  if (part.mimeType === 'text/html' && part.body && part.body.data) {
    try {return Utilities.newBlob(Utilities.base64DecodeWebSafe(part.body.data)).getDataAsString('UTF-8').replace(/<[^>]+>/g, ' ');} catch (error) {return '';}
  }
  return '';
}

/** Small, explainable local rules. Scores are warning signals, not proof of fraud. */
function scoreVerifyMessage(subject, sender, body) {
  const text = (subject + '\n' + body).slice(0, 5000);
  const identity = (subject + ' ' + sender).toLowerCase();
  const signals = [];
  let score = 0;
  const add = (points, reason) => {if (signals.indexOf(reason) < 0) {score += points; signals.push(reason);}};
  const brands = {usps:'usps.com',fedex:'fedex.com',ups:'ups.com',chase:'chase.com',paypal:'paypal.com',amazon:'amazon.com',apple:'apple.com',google:'google.com',microsoft:'microsoft.com'};
  const claimed = Object.keys(brands).find(brand => new RegExp('\\b' + brand + '\\b','i').test(identity));
  const senderMatch = sender.match(/<([^>]+@[^>]+)>/) || sender.match(/([^\s<>]+@[^\s<>]+)/);
  const senderDomain = senderMatch ? senderMatch[1].split('@')[1].toLowerCase() : '';
  const inside = (host, official) => host === official || host.endsWith('.' + official);
  if (claimed && senderDomain && !inside(senderDomain, brands[claimed])) add(24, 'Sender domain is not ' + brands[claimed]);
  const links = text.match(/https?:\/\/[^\s<>"']+/gi) || [];
  for (const link of links.slice(0, 12)) {
    const hostMatch = link.match(/^https?:\/\/([^/:?#]+)/i);
    const host = hostMatch ? hostMatch[1].toLowerCase().replace(/^www\./,'') : '';
    if (claimed && host && !inside(host, brands[claimed])) add(34, 'Link points outside ' + brands[claimed]);
    if (/\.(click|top|xyz|work|buzz)(?:$|\.)/.test(host)) add(15, 'Link uses an unusual domain ending');
    if (host.includes('xn--')) add(25, 'Link has encoded characters in its domain');
  }
  if (/\b(?:one.time code|verification code|security code|otp|password|passcode|seed phrase)\b/i.test(text)) add(28, 'Message asks about an account secret');
  if (/\b(?:gift card|bitcoin|crypto|wire transfer|zelle|cash app)\b/i.test(text)) add(22, 'Hard-to-reverse payment method appears');
  if (/\b(?:pay|payment|fee|deposit|charge)\b/i.test(text) && links.length) add(12, 'Payment request is paired with a link');
  if (/\b(?:act now|final notice|last chance|within \d+ (?:minutes?|hours?)|by \d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i.test(text)) add(16, 'Message adds a deadline');
  if (/\b(?:do not tell|don.t call|keep this between us|do not use the app)\b/i.test(text)) add(25, 'Message discourages independent verification');
  return {riskScore: Math.min(100, score), signals: signals};
}
