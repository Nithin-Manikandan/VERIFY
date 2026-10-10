import test from 'node:test';
import assert from 'node:assert/strict';
import {reportableHost,reportChannel} from '../lib/community.ts';

test('accepts exact public destinations, not URLs with misleading prefixes',()=>{
  assert.equal(reportableHost('https://usps.com.delivery-review.click/update'),'usps.com.delivery-review.click');
  assert.equal(reportableHost('usps.com'),'usps.com');
  assert.equal(reportableHost('https://usps.com.delivery-review.example/update'),null);
  assert.equal(reportableHost('http://127.0.0.1/private'),null);
  assert.equal(reportChannel('email'),'email');
  assert.equal(reportChannel('web'),null);
});
