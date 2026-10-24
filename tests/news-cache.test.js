import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewsCache} from '../lib/news-cache.js';
test('single-flight feeds avoid duplicate calls',async()=>{
  let calls=0;
  const get=createNewsCache(async()=>{calls++;await Promise.resolve();return {articles:[],feeds:[{status:'ok'}]}},{clock:()=>1});
  const [a,b]=await Promise.all([get(),get()]);
  assert.equal(a,b);assert.equal(calls,1);
  await get();assert.equal(calls,1);
});
test('cache expires then recollects',async()=>{
  let now=0,calls=0;
  const get=createNewsCache(async()=>{calls++;return {feeds:[{status:'ok'}]};},{clock:()=>now,ttlMs:1000});
  await get();now=999;await get();assert.equal(calls,1);now=1000;await get();assert.equal(calls,2);
});
test('unavailable sources use shorter retry TTL',async()=>{
  let now=0,calls=0;
  const get=createNewsCache(async()=>{calls++;return {articles:[],feeds:[{status:'error'}]};},{clock:()=>now,ttlMs:1000,failureTtlMs:100});
  await get();now=99;await get();assert.equal(calls,1);now=100;await get();assert.equal(calls,2);
});
