import test from 'node:test';
import assert from 'node:assert/strict';
import {rulesOnlyAnalysis} from '../lib/analysis-fallback.ts';
import {extractEntities} from '../lib/forensics.ts';

test('rules-only scan keeps the demo usable with observed evidence',()=>{
  const message='USPS: Pay the $0.49 redelivery fee at https://usps.com.delivery-review.example/update by 6 PM. Reply STOP to opt out.';
  const entities=extractEntities(message);
  const url=entities.urls[0];
  const links=[{originalUrl:url,finalUrl:url,redirectChain:[url],domainAgeDays:null,flags:["This link is outside usps.com; open the organization's official site independently."]}];
  const result=rulesOnlyAnalysis(message,entities,links);
  assert.equal(result.verdict,'LIKELY SCAM');
  assert.ok(result.redFlags.every(flag=>message.includes(flag.quotedPhrase)));
  assert.doesNotMatch(result.why,/reply stop/i);
});

test('rules-only scan avoids alarming on a routine update',()=>{
  const message='Your library book is ready to collect at the desk.';
  const result=rulesOnlyAnalysis(message,extractEntities(message),[]);
  assert.equal(result.verdict,'SAFE');
  assert.equal(result.redFlags.length,0);
  assert.match(result.why,/local checks/i);
});
