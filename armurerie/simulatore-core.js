/* Pure commercial calculations. All money is integer cents; no export tariffs here. */
((root)=>{
  'use strict';
  const cents=value=>Math.round(Number(value)*100);
  function totals(rows){
    return rows.reduce((a,r)=>({count:a.count+r.qty,cost:a.cost+r.qty*r.price,revenue:a.revenue+r.qty*r.export,standard:a.standard+r.qty*r.standard,retail:a.retail+r.qty*r.retail}),{count:0,cost:0,revenue:0,standard:0,retail:0});
  }
  function target(revenue,profit,roi){return Math.min(revenue-profit,Math.floor(revenue*10000/(10000+roi)));}
  function allocate(rows,budget){
    // Same multiplier of standard prices, capped at retail. Round DOWN so budget is never exceeded.
    const cap=rows.reduce((s,r)=>s+r.qty*r.retail,0);
    budget=Math.max(0,Math.min(cap,Math.round(budget)));
    let low=0,high=Math.max(0,...rows.map(r=>r.retail/r.standard));
    for(let i=0;i<60;i++){const mid=(low+high)/2;const sum=rows.reduce((s,r)=>s+r.qty*Math.min(r.retail,r.standard*mid),0);if(sum>budget)high=mid;else low=mid;}
    const prices=rows.map(r=>Math.min(r.retail,Math.floor(r.standard*low+1e-8)));
    let remainder=budget-rows.reduce((s,r,i)=>s+r.qty*prices[i],0);
    // Stable catalog order, at most one extra cent per unit/model. Residual is explicit.
    rows.forEach((r,i)=>{if(prices[i]<r.retail&&r.qty<=remainder){prices[i]++;remainder-=r.qty;}});
    return {prices,remainder,budget};
  }
  const api={cents,totals,target,allocate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VauclairMath=api;
})(globalThis);
