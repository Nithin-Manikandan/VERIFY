import test from 'node:test';
import assert from 'node:assert/strict';
import {buildClaimLedger,buildDemoLedger,extractClaim} from '../lib/claim-ledger.ts';

test('claim is an exact excerpt from the submitted message',()=>{
  const text='From: USPS <notice@delivery-status.click>\nSubject: Address update\n\nWe could not verify your apartment number. Pay $0.49 by 6 PM.';
  const claim=extractClaim(text);
  assert.equal(claim,'We could not verify your apartment number.');
  assert.ok(text.includes(claim));
});

test('claim ledger separates findings from facts it cannot verify',()=>{
  const text='USPS: We could not verify your apartment number. Pay $0.49 at https://usps.com.delivery-review.example/update.';
  const result={
    evidenceText:text,scanMode:'passive',analysis:{scamType:'package',riskScore:88,redFlags:[{type:'Payment request',severity:'high',description:'A fee is requested through the message link.',quotedPhrase:'Pay $0.49'}],verdict:'LIKELY SCAM',why:'Suspicious link and payment request.'},
    urlForensics:[{originalUrl:'https://usps.com.delivery-review.example/update',finalUrl:'https://usps.com.delivery-review.example/update',redirectChain:['https://usps.com.delivery-review.example/update'],flags:['This link is outside usps.com.'],domainAgeDays:null}],
    safeContact:{organization:'usps',officialDomain:'usps.com',message:'Open usps.com yourself.'},
  };
  const ledger=buildClaimLedger(result);
  assert.ok(text.includes(ledger.claim));
  assert.equal(ledger.evidence[0].source,'Message quote');
  assert.equal(ledger.evidence[1].source,'Link check');
  assert.ok(ledger.unknown.some(item=>item.includes('Whether a real package')));
  assert.equal(ledger.trace[3].state,'limited');
  assert.match(ledger.trace[3].detail,/not accessed/);
  assert.ok(!JSON.stringify(ledger).includes('no matching alert'));
});

test('fictional demo never presents a carrier account check as completed',()=>{
  const ledger=buildDemoLedger({from:'USPS Delivery',subject:'Address issue',body:['We could not confirm your apartment number.'],signals:['Sender domain is not usps.com'],link:{url:'https://usps.com.delivery-review.example/update'},risk:88});
  assert.equal(ledger.officialDomain,'usps.com');
  assert.equal(ledger.trace[3].state,'limited');
  assert.match(ledger.trace[3].detail,/No real account accessed/);
});
