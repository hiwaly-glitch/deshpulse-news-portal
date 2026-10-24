export default function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.setHeader('Allow','GET, HEAD');
    return res.status(405).json({error:'Method not allowed'});
  }
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({ok:true,service:'deshpulse',mode:'vercel-functions'});
}
