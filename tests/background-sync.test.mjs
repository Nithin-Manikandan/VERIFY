import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
const context={};runInNewContext(readFileSync(new URL('../integrations/apps-script/Code.gs',import.meta.url),'utf8'),context);
test('personal background sync flags a spoofed package fee',()=>{
  const result=context.scoreVerifyMessage('USPS parcel address issue','USPS <notice@delivery-status.click>','Pay a $0.49 redelivery fee by 6 PM at https://usps.com.delivery-review.example/update');
  assert.ok(result.riskScore>=65);
  assert.ok(result.signals.includes('Sender domain is not usps.com'));
  assert.ok(result.signals.includes('Link points outside usps.com'));
});
test('personal background sync avoids a routine email',()=>{
  const result=context.scoreVerifyMessage('Your library hold is ready','Riverton Library <notices@rivertonlibrary.org>','Your book is ready for pickup at the main branch.');
  assert.equal(result.riskScore,0);
});
