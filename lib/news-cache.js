/** A bounded, in-memory cache for request-triggered RSS aggregation.
 * Each Render instance has its own cache; no data persists across cold starts.
 */
export function createNewsCache(collector, {ttlMs=10*60*1000, failureTtlMs=90*1000, clock=Date.now}={}) {
  let current;
  let expiresAt=0;
  let running;
  return async function getNews() {
    const now=clock();
    if (current && now<expiresAt) return current;
    if (running) return running;
    running=(async()=>{
      try {
        const result=await collector();
        current=result;
        // Do not continually poll providers if all feeds are temporarily down.
        expiresAt=clock()+(result.feeds?.some(f=>f.status==='ok')?ttlMs:failureTtlMs);
        return current;
      } catch(e) {
        expiresAt=clock()+failureTtlMs;
        if (current) return current;
        throw e;
      } finally { running=undefined; }
    })();
    return running;
  };
}
