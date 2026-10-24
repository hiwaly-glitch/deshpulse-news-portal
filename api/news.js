import { collectNews } from '../lib/feeds.js';

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  try{
    const data=await collectNews();
    res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=1800');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(200).json(data);
  }catch{
    return res.status(503).json({error:'News service temporarily unavailable',articles:[],feeds:[]});
  }
}
