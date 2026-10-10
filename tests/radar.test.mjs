import test from 'node:test';
import assert from 'node:assert/strict';
import {connectedIds,connectRadarArtifacts,forecastFor,inspectRadarArtifact,sampleRadarArtifacts,trustedRouteFor} from '../lib/radar.ts';

test('connects the fictional email, text, and decoded QR by exact host',()=>{
  const edges=connectRadarArtifacts(sampleRadarArtifacts);
  assert.equal(edges.length,3);
  assert.deepEqual(new Set(connectedIds(sampleRadarArtifacts,'sample-email')),new Set(['sample-email','sample-text','sample-qr']));
  assert.deepEqual(connectedIds(sampleRadarArtifacts,'sample-safe'),['sample-safe']);
  assert.ok(edges.every(edge=>edge.reason.includes('usps.com.delivery-review.example')));
});

test('matching brand language alone does not connect messages',()=>{
  const unrelated={...sampleRadarArtifacts[1],id:'other-text',content:'USPS delivery at https://another.example/track'};
  assert.equal(connectRadarArtifacts([sampleRadarArtifacts[0],unrelated]).length,0);
});

test('risk signals identify impersonation without flagging the safe control',()=>{
  const suspicious=inspectRadarArtifact(sampleRadarArtifacts[0]);
  const safe=inspectRadarArtifact(sampleRadarArtifacts[3]);
  assert.ok(suspicious.risk>=65);
  assert.ok(suspicious.signals.some(signal=>signal.label==='Sender mismatch'));
  assert.ok(suspicious.signals.some(signal=>signal.label==='Brand link mismatch'));
  assert.equal(safe.risk,0);
});

test('trusted exit uses a curated independent domain',()=>{
  assert.equal(trustedRouteFor(sampleRadarArtifacts[0]).url,'https://usps.com/');
  assert.equal(trustedRouteFor(sampleRadarArtifacts[2]).url,'https://usps.com/');
  assert.equal(trustedRouteFor(sampleRadarArtifacts[3]).url,null);
  assert.notEqual(trustedRouteFor(sampleRadarArtifacts[0]).url,inspectRadarArtifact(sampleRadarArtifacts[0]).urls[0]);
});

test('next move scenario has a safe action for every stage',()=>{
  const stages=forecastFor(sampleRadarArtifacts[0]);
  assert.equal(stages.length,3);
  assert.ok(stages.every(stage=>stage.attacker&&stage.warning&&stage.safeAction));
});
