import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAnalysisEvidence} from '../lib/analysis-evidence.ts';
import {extractEntities} from '../lib/forensics.ts';

test('removes invented phone and routine opt-out evidence while retaining link mismatch',()=>{
  const message='USPS: We tried to deliver parcel 9400 1000 0000 1234 5678 90. Update at https://usps.com.delivery-preferences.example/track/9400100000001234567890. Reply STOP to opt out.';
  const analysis={scamType:'package',riskScore:70,verdict:'SUSPICIOUS',why:'The phone number and Reply STOP are suspicious.',redFlags:[
    {type:'Phone number',severity:'medium',description:'Extracted phone number may be suspicious.',quotedPhrase:'9400 1000 0000 1234 5678 90'},
    {type:'Opt-out phrase',severity:'low',description:'Reply STOP is a scam signal.',quotedPhrase:'Reply STOP'},
    {type:'Brand link mismatch',severity:'high',description:'The link is outside usps.com.',quotedPhrase:'https://usps.com.delivery-preferences.example/track/9400100000001234567890'},
  ]};
  const links=[{originalUrl:'https://usps.com.delivery-preferences.example/track/9400100000001234567890',finalUrl:'https://usps.com.delivery-preferences.example/track/9400100000001234567890',redirectChain:['https://usps.com.delivery-preferences.example/track/9400100000001234567890'],domainAgeDays:null,flags:['This link is outside usps.com; open the organization\'s official site independently.']}];
  const cleaned=validateAnalysisEvidence(message,analysis,extractEntities(message),links);
  assert.deepEqual(cleaned.redFlags.map(flag=>flag.type),['Brand link mismatch']);
  assert.doesNotMatch(cleaned.why,/phone number|reply stop/i);
  assert.match(cleaned.why,/outside usps.com/);
});

test('does not claim unobserved redirect or domain age',()=>{
  const message='Review https://example.com/item';
  const analysis={scamType:'other',riskScore:80,verdict:'LIKELY SCAM',why:'This is a newly registered redirect domain.',redFlags:[
    {type:'New domain',severity:'high',description:'Newly registered domain.',quotedPhrase:'https://example.com/item'},
    {type:'Redirect',severity:'high',description:'Link redirects to another site.',quotedPhrase:'https://example.com/item'},
  ]};
  const links=[{originalUrl:'https://example.com/item',finalUrl:'https://example.com/item',redirectChain:['https://example.com/item'],domainAgeDays:null,flags:[]}];
  const cleaned=validateAnalysisEvidence(message,analysis,extractEntities(message),links);
  assert.equal(cleaned.redFlags.length,0);
  assert.equal(cleaned.riskScore,30);
  assert.equal(cleaned.verdict,'SUSPICIOUS');
});
