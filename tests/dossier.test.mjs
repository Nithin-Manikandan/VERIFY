import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSignalProfile,evidenceSegments} from '../lib/dossier.ts';
import {splitPassages} from '../lib/training-ui.ts';
import {fallbackTraining} from '../lib/training-fallback.ts';
import {scoreSelections} from '../lib/training-score.ts';

test('pattern fingerprint distinguishes a coercive link from a routine update',()=>{
  const warning=buildSignalProfile('Pay $12 within 2 hours and enter your password. Do not call your bank.',[{originalUrl:'https://bank.example',finalUrl:'https://bank.example',redirectChain:['https://bank.example'],flags:['This link is outside chase.com.'],domainAgeDays:null}]);
  assert.equal(warning.length,5);
  assert.equal(warning.find(x=>x.id==='pressure')?.score,2);
  assert.equal(warning.find(x=>x.id==='credentials')?.score,2);
  assert.equal(warning.find(x=>x.id==='link')?.score,2);
  const routine=buildSignalProfile('Your statement is in the official app. No action required.',[]);
  assert.equal(routine.filter(x=>x.score>=2).length,0);
  const delivery=buildSignalProfile('Update your delivery preference by 6 PM to avoid a return to sender.',[{originalUrl:'https://usps.com.delivery-preferences.example',finalUrl:'https://usps.com.delivery-preferences.example',redirectChain:['https://usps.com.delivery-preferences.example'],flags:["This link is outside usps.com; open the organization's official site independently."],domainAgeDays:null}]);
  assert.ok((delivery.find(x=>x.id==='pressure')?.score??0)>=2);
  assert.equal(delivery.find(x=>x.id==='link')?.score,3);
  const benign=buildSignalProfile('Your package is out for delivery today. No action is required.',[]);
  assert.equal(benign.find(x=>x.id==='pressure')?.score,0);
});

test('evidence lens highlights only exact submitted spans',()=>{
  const message='Pay a fee today. Do not call the bank.';
  const segments=evidenceSegments(message,['Pay a fee','Do not call','a fee today']);
  assert.equal(segments.map(x=>x.text).join(''),message);
  assert.equal(segments.filter(x=>x.highlight).length,2);
  assert.equal(evidenceSegments(message,['not in source']).some(x=>x.highlight),false);
});

test('tap passages preserve exact offsets and harder training has fewer cues',()=>{
  const exercise=fallbackTraining('bank','hard');
  const passages=splitPassages(exercise.message);
  assert.ok(passages.length>=2);
  for(const part of passages)assert.equal(exercise.message.slice(part.start,part.end),part.text);
  assert.ok(fallbackTraining('bank','easy').redFlags.length>exercise.redFlags.length);
  const url='Review at https://fedex.com.delivery-review.example/track. Pay only in the app.';
  assert.equal(splitPassages(url).length,2);
  assert.ok(splitPassages(url)[0].text.includes('fedex.com.delivery-review.example'));
});

test('selecting the whole exercise loses precision',()=>{
  const message='Routine delivery update. Pay a $9 fee now. Thank you.';
  const phrase='Pay a $9 fee now';
  const start=message.indexOf(phrase);
  const answers=[{start,end:start+phrase.length,text:phrase}];
  const precise=scoreSelections(message,answers,[{start,end:start+phrase.length}]);
  const broad=scoreSelections(message,answers,[{start:0,end:message.length}]);
  assert.equal(precise.percentage,100);
  assert.ok(broad.percentage<70);
  assert.equal(broad.score,1);
});
