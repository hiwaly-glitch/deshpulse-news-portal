import sources from '../data/feeds.json' with { type: 'json' };

const AGE_LIMIT_MS=7*24*60*60*1000;
const MAX_XML_BYTES=2_000_000;
const MAX_ITEMS_PER_SOURCE=25;
const FEED_TIMEOUT_MS=4400;
const ENTITIES={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',mdash:'—',ndash:'–',hellip:'…',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“'};
export const configuredFeeds=sources;

export function decodeEntities(value=''){
  return String(value).replace(/&#(x[0-9a-f]+|\d+);|&([a-zA-Z]+);/gi,(full,numeric,named)=>{
    if(numeric){const point=numeric[0].toLowerCase()==='x'?parseInt(numeric.slice(1),16):parseInt(numeric,10);return point>0&&point<=0x10ffff?String.fromCodePoint(point):'';}
    return ENTITIES[named]??full;
  });
}
function stripMarkup(text=''){
  return decodeEntities(String(text).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim());
}
function field(xml,name){
  const re=new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}\\s*>`,'i');
  return re.exec(xml)?.[1]??'';
}
function matchAttribute(xml,tag,attribute){
  const re=new RegExp(`<${tag}\\b[^>]*?${attribute}\\s*=\\s*["']([^"']+)["'][^>]*\\/?\\s*>`,'i');
  return re.exec(xml)?.[1]??'';
}
function normalizeLink(raw,feed){
  try{
    const link=new URL(decodeEntities(raw.trim()),feed.homepage);
    if(link.protocol!=='https:'&&link.protocol!=='http:')return null;
    if(link.username||link.password)return null;
    // Only articles from the publisher's registered domain are eligible, never arbitrary URL targets.
    const base=new URL(feed.homepage).hostname.replace(/^www\./,'');
    const domain=link.hostname.replace(/^www\./,'');
    if(domain!==base && !domain.endsWith(`.${base}`))return null;
    link.hash='';
    for(const key of [...link.searchParams.keys()])if(/^utm_|^(fbclid|gclid|ref|output)$/i.test(key))link.searchParams.delete(key);
    return link.toString();
  }catch{return null;}
}
function classify(title){
  const t=title.toLowerCase();
  if(/army|military|defence|defense|navy|air force|ispr|সেনাবাহিনী|নৌবাহিনী|বিমানবাহিনী|সামরিক|প্রতিরক্ষা/.test(t))return 'defence';
  if(/cricket|football|tournament|match|team|sports|খেলা|ক্রিকেট|ফুটবল|বিশ্বকাপ/.test(t))return 'sports';
  if(/bank|stock|market|inflation|economy|business|taka|ব্যাংক|শেয়ার|বাজার|অর্থনীতি|ব্যবসা|বিনিয়োগ/.test(t))return 'business';
  if(/science|tech|ai |software|technology|startup|প্রযুক্তি|বিজ্ঞান/.test(t))return 'technology';
  if(/world|foreign|international|united nations|বিশ্ব|আন্তর্জাতিক|বিদেশ/.test(t))return 'world';
  if(/election|parliament|minister|government|politics|নির্বাচন|সংসদ|মন্ত্রী|রাজনীতি|সরকার/.test(t))return 'politics';
  return 'national';
}
export function parseFeed(xml,feed,now=Date.now()){
  if(typeof xml!=='string'||xml.length===0||xml.length>MAX_XML_BYTES*2)throw new Error('Invalid or oversized RSS response');
  const chunks=[...xml.matchAll(/<(item|entry)(?=\s|>)[^>]*>([\s\S]*?)<\/\1\s*>/gi)];
  if(!chunks.length)throw new Error('No RSS/Atom entries found');
  const result=[];
  for(const match of chunks.slice(0,MAX_ITEMS_PER_SOURCE*3)){
    const part=match[2];
    const rawTitle=field(part,'title');
    const title=stripMarkup(rawTitle).slice(0,250);
    const rawLink=field(part,'link')||matchAttribute(part,'link','href')||field(part,'guid');
    const link=normalizeLink(stripMarkup(rawLink),feed);
    const rawDate=field(part,'pubDate')||field(part,'published')||field(part,'updated')||field(part,'dc:date');
    const timestamp=Date.parse(stripMarkup(rawDate));
    if(!title||!link||!Number.isFinite(timestamp)||timestamp>now+60*60*1000||now-timestamp>AGE_LIMIT_MS)continue;
    const summary=feed.rights==='licensed-excerpt'?stripMarkup(field(part,'description')||field(part,'summary')||'').slice(0,160):'';
    result.push({id:`${feed.id}:${link}`,title,link,source:feed.name,sourceId:feed.id,language:feed.language,category:classify(title),publishedAt:new Date(timestamp).toISOString(),summary});
    if(result.length>=MAX_ITEMS_PER_SOURCE)break;
  }
  return result;
}
async function fetchFeed(feed,fetcher,now){
  const ctrl=new AbortController();
  const t=setTimeout(()=>ctrl.abort(),FEED_TIMEOUT_MS);
  try{
    const result=await fetcher(feed.url,{signal:ctrl.signal,redirect:'follow',headers:{'User-Agent':'DeshPulse/1.0 (+News feed aggregation; respects publisher permissions)','Accept':'application/rss+xml, application/atom+xml, text/xml, application/xml;q=0.9'}});
    if(!result.ok)throw new Error(`HTTP ${result.status}`);
    const contentType=result.headers.get('content-type')||'';
    if(!/xml|rss|atom|text\/plain/i.test(contentType))throw new Error('Response is not an RSS/XML feed');
    const clen=Number(result.headers.get('content-length'));
    if(clen>MAX_XML_BYTES)throw new Error('Feed exceeds size limit');
    const body=await result.text();
    if(Buffer.byteLength(body)>MAX_XML_BYTES)throw new Error('Feed exceeds size limit');
    return {feed:feed.name,items:parseFeed(body,feed,now),status:'ok'};
  }catch(e){return {feed:feed.name,items:[],status:'error',reason:e.name==='AbortError'?'Timeout':(e.message||'Unavailable').slice(0,85)};}
  finally{clearTimeout(t);}
}
export async function collectNews({fetcher=fetch,now=Date.now()}={}){
  const enabled=sources.filter(s=>s.enabled);
  const responses=await Promise.all(enabled.map(feed=>fetchFeed(feed,fetcher,now)));
  const unique=new Map();
  for(const result of responses){
    for(const item of result.items){
      const key=item.link.toLowerCase();
      if(!unique.has(key))unique.set(key,item);
    }
  }
  const articles=[...unique.values()].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,100);
  return {articles,generatedAt:new Date(now).toISOString(),feeds:responses.map(r=>({name:r.feed,status:r.status,count:r.items.length,...(r.reason?{reason:r.reason}:{})})),candidateFeeds:sources.length,enabledFeeds:enabled.length,rights:'Source links and limited metadata only. No article bodies or third-party images stored.'};
}
