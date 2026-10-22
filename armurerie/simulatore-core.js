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
  // One tin of gun oil/grease restores 20 durability points; exports require at least 90%.
  // Conditions are estimates by model, not an assertion about individual weapons.
  const GREASE_UNIT_CENTS=800,MIN_EXPORT_CONDITION=90,RESTORE_POINTS=20;
  function greasePerWeapon(condition){
    const n=Number(condition);
    if(!Number.isFinite(n)||n<0||n>100)throw new RangeError("Condizione arma non valida");
    return Math.max(0,Math.ceil((MIN_EXPORT_CONDITION-n)/RESTORE_POINTS));
  }
  function greaseSuggested(rows){
    return rows.reduce((sum,r)=>sum+r.qty*greasePerWeapon(r.condition??100),0);
  }
  function financials(rows,greaseCount,profitGoal=0,roiHundredths=0){
    if(!Number.isInteger(greaseCount)||greaseCount<0||greaseCount>100000)throw new RangeError("Quantità grassi non valida");
    const quote=totals(rows),repair=greaseCount*GREASE_UNIT_CENTS,totalCost=quote.cost+repair,profit=quote.revenue-totalCost;
    return {
      ...quote,greaseCount,repair,totalCost,profit,
      roi:totalCost>0?profit/totalCost*100:null,
      margin:quote.revenue>0?profit/quote.revenue*100:null,
      // The supplier budget is what remains after buying maintenance materials.
      maxPurchase:target(quote.revenue,profitGoal,roiHundredths)-repair
    };
  }
  const api={cents,totals,target,allocate,greasePerWeapon,greaseSuggested,financials,GREASE_UNIT_CENTS,MIN_EXPORT_CONDITION,RESTORE_POINTS};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VauclairMath=api;
})(globalThis);
