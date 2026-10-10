import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkUspsTracking,normalizeTrackingNumber,parseUspsResponse,trackingNumberFromMessage} from '../lib/usps.ts';

test('tracking number extraction requires tracking context and a full number',()=>{
  assert.equal(trackingNumberFromMessage('USPS tracking number: 9400 1000 0000 0000 0000 00'),'9400100000000000000000');
  assert.equal(trackingNumberFromMessage('Order #4821 is delayed'),null);
  assert.equal(normalizeTrackingNumber(' 9400-1000-0000-0000-0000-00 '),'9400100000000000000000');
  assert.equal(normalizeTrackingNumber('https://evil.test'),null);
});

test('USPS response must identify the requested record',()=>{
  const number='9400100000000000000000';
  assert.equal(parseUspsResponse([{trackingNumber:number,status:'In Transit',statusSummary:'On the way'}],number).state,'record_found');
  assert.equal(parseUspsResponse([{trackingNumber:'other',status:'Delivered'}],number).state,'unavailable');
});

test('live adapter calls only official USPS endpoints and does not infer email legitimacy',async()=>{
  const number='9400100000000000000000',calls=[];
  const fakeFetch=async(url,init)=>{calls.push({url,init});return Response.json(calls.length===1?{access_token:'test-token'}:[{trackingNumber:number,status:'In Transit',statusCategory:'Moving Through Network',statusSummary:'Moving through network'}])};
  const result=await checkUspsTracking(number,'id','secret',fakeFetch);
  assert.equal(result.state,'record_found');
  assert.equal(result.status,'In Transit');
  assert.deepEqual(calls.map(call=>call.url),['https://apis.usps.com/oauth2/v3/token','https://apis.usps.com/tracking/v3r2/tracking']);
  assert.equal(calls[1].init.headers.Authorization,'Bearer test-token');
});
