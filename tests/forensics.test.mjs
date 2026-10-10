import test from 'node:test';
import assert from 'node:assert/strict';
import {claimedDomainMismatch,extractEntities,isPrivateIp,isSafeUrl} from '../lib/forensics.ts';
test('extracts URLs and contact signals',()=>{const x=extractEntities('Chase: act now at https://paypa1.example/login or call 800-555-0199');assert.equal(x.urls[0],'https://paypa1.example/login');assert.equal(x.phoneNumbers.length,1);assert.equal(x.claimedOrganization,'chase')});
test('blocks private and metadata addresses',()=>{for(const x of ['127.0.0.1','169.254.169.254','10.2.3.4','192.168.1.1','172.16.0.1','::1','fc00::1'])assert.equal(isPrivateIp(x),true,x)});
test('blocks unsafe URL schemes and hosts',()=>{for(const x of ['http://localhost/','http://127.0.0.1/','http://169.254.169.254/','http://192.168.1.1/','http://[::1]/','file:///etc/passwd','http://intranet.local/'])assert.equal(isSafeUrl(x),false,x)});
test('allows public URLs',()=>{assert.equal(isSafeUrl('https://example.com/path'),true)});
test('flags a link outside the claimed brand domain',()=>{assert.match(claimedDomainMismatch('https://usps-update.example/login','usps.com'),/outside usps.com/);assert.equal(claimedDomainMismatch('https://tools.usps.com/track','usps.com'),null)});
test('does not extract phone numbers from parcel tracking identifiers',()=>{
  const message='USPS: parcel 9400 1000 0000 1234 5678 90. Track at https://usps.com.delivery-preferences.example/track/9400100000001234567890. Reply STOP to opt out.';
  assert.deepEqual(extractEntities(message).phoneNumbers,[]);
  assert.deepEqual(extractEntities('Call +1 (202) 555-0148 for help.').phoneNumbers,['+1 (202) 555-0148']);
});
