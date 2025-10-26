import express from 'express';
const app = express();
app.use(express.json());
app.get('/health', (_,res)=>res.json({status:'ok'}));
app.post('/execute', async (req,res)=>{
  // TODO: integrate Hyperliquid SDK; placeholder response
  res.json({ status: 'success', output: { echo: req.body } });
});
app.listen(process.env.PORT || 8000, ()=> console.log('hyperliquid-node-agent up'));
