import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFeed,collectNews,decodeEntities} from '../lib/feeds.js';
const feed={id:'test',name:'Mock Publisher',url:'https://example.com/feed',homepage:'https://example.com',language:'en',rights:'licensed-excerpt'};
const now=Date.parse('2026-10-24T08:00:00Z');
function xml(date='Fri, 23 Oct 2026 12:00:00 GMT'){
 return `<?xml version="1.0"?><rss><channel><item><title><![CDATA[Bangladesh &amp; climate <b>update</b>]]></title><link>https://example.com/story?utm_source=rss</link><description><![CDATA[<p>Overview &amp; text</p>]]></description><pubDate>${date}</pubDate></item></channel></rss>`;
}
test('parse valid RSS and remove tracking',()=>{const x=parseFeed(xml(),feed,now);assert.equal(x.length,1);assert.equal(x[0].title,'Bangladesh & climate update');assert.equal(x[0].link,'https://example.com/story');assert.equal(x[0].summary,'Overview & text');});
test('reject off-domain article links',()=>{const x=parseFeed(xml().replace('https://example.com/story','https://evil.example.org/steal'),feed,now);assert.equal(x.length,0);});
test('reject stale news',()=>{assert.equal(parseFeed(xml('Thu, 01 Oct 2026 12:00:00 GMT'),feed,now).length,0);});
test('handle malformed feed',()=>{assert.throws(()=>parseFeed('not xml',feed,now),/No RSS/);});
test('decode numeric entities',()=>{assert.equal(decodeEntities('&#x9AC;&#x9BE; &amp;'), 'বা &');});
test('collect feed errors without inventing articles',async()=>{const result=await collectNews({now,fetcher:async()=>{throw new Error('Offline')}});assert.deepEqual(result.articles,[]);assert.equal(result.feeds.length,5);assert(result.feeds.every(f=>f.status==='error'));});
test('collect concurrent valid feeds and deduplicate canonical links',async()=>{const result=await collectNews({now,fetcher:async()=>({ok:true,headers:{get:k=>k==='content-type'?'application/rss+xml':null},text:async()=>xml().replaceAll('example.com','www.prothomalo.com')})});assert.equal(result.articles.length,1);assert.equal(result.feeds.length,5);});

test('no excerpt for link-only license',()=>{const x=parseFeed(xml(),{...feed,rights:'link-metadata-only'},now);assert.equal(x[0].summary,'');});
