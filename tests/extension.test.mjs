import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
const context={URL};context.globalThis=context;runInNewContext(readFileSync(new URL('../extension/scanner.js',import.meta.url),'utf8'),context);
const scan=context.VerifyScanner.scan;
test('flags a branded payment lure in an inbox preview before opening it',()=>{
  const result=scan({subject:'USPS: address issue for your parcel',senderName:'USPS Tracking',senderEmail:'notice@delivery-status.click',body:'Pay $0.45 by 6 PM to release your package: https://usps.com.delivery-status.click/update'});
  assert.ok(result.riskScore>=65);
  assert.ok(result.signals.some(signal=>signal.includes('Link points outside')));
  assert.equal(result.claimedDomain,'usps.com');
});
test('avoids alarm for a routine merchant receipt',()=>{
  const result=scan({subject:'Your receipt from Amazon',senderName:'Amazon',senderEmail:'auto-confirm@amazon.com',body:'Thanks for your order. Your shipment is expected tomorrow.'});
  assert.equal(result.riskScore,0);
  assert.equal(result.claimedDomain,'amazon.com');
});
test('flags an account secret request even when sender is spoofed',()=>{
  const result=scan({subject:'PayPal security code needed',senderName:'PayPal',senderEmail:'security@paypal.com',body:'Reply with your one-time code. Do not tell anyone.'});
  assert.ok(result.riskScore>=30);
});
