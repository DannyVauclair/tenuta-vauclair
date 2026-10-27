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
  // Staff confirmed each application restores a RANDOM 15–20 percentage points.
  // Default = conservative guaranteed minimum, never a made-up mean or exact prediction.
  // Five applications maximum per individual physical gun (including prior repairs).
  const GREASE_UNIT_CENTS=800,MIN_EXPORT_CONDITION=90;
  const RESTORE_MIN=15,RESTORE_MAX=20,RESTORE_POINTS=RESTORE_MIN,MAX_REPAIRS=5;
  function repairStatus(condition=100,previous=0,restorePoints=RESTORE_MIN){
    const level=Number(condition),past=Number(previous);
    if(!Number.isFinite(level)||!Number.isInteger(level)||level<0||level>100)throw new RangeError("Condizione arma non valida (0-100)");
    if(!Number.isInteger(past)||past<0||past>MAX_REPAIRS)throw new RangeError("Riparazioni pregresse non valide (0-5)");
    if(restorePoints!==RESTORE_MIN&&restorePoints!==RESTORE_MAX)throw new RangeError("Scenario di riparazione non valido");
    const needed=Math.max(0,Math.ceil((MIN_EXPORT_CONDITION-level)/restorePoints));
    const remaining=MAX_REPAIRS-past;
    return {needed,remaining,possible:needed<=remaining,alreadyReady:needed===0,
      maxCondition:Math.min(100,level+remaining*restorePoints)};
  }
  const greasePerWeapon=(condition,restorePoints=RESTORE_MIN)=>repairStatus(condition,0,restorePoints).needed;
  function repairPlan(rows,availableGrease=Infinity,restorePoints=RESTORE_MIN){
    if(availableGrease!==Infinity&&(!Number.isInteger(availableGrease)||availableGrease<0||availableGrease>100000))throw new RangeError("Quantità grassi non valida");
    const candidates=[],byModel=new Map();
    let ready=0,revenue=0,impossible=0,suggested=0,capacity=0,total=0;
    for(const r of rows){
      const qty=Number(r.qty);
      if(!Number.isInteger(qty)||qty<0||qty>9999)throw new RangeError("Quantità di armi non valida");
      const item={count:qty,ready:0,impossible:0,covered:0,uncovered:0,suggested:0,capacity:0};
      byModel.set(r.id,item);
      for(let i=0;i<qty;i++){
        const override=r.units instanceof Map?r.units.get(i):r.units?.[i];
        const state=repairStatus(override?.condition??r.condition??100,override?.repaired??r.repaired??0,restorePoints);
        total++;capacity+=state.remaining;item.capacity+=state.remaining;
        if(!state.possible){impossible++;item.impossible++;continue;}
        if(state.alreadyReady){ready++;item.ready++;revenue+=r.export;continue;}
        suggested+=state.needed;item.suggested+=state.needed;
        candidates.push({model:r.id,index:i,needed:state.needed,value:r.export});
      }
    }
    // Use the cheapest-to-finish units first; for equal grease needs, prefer higher export value.
    candidates.sort((a,b)=>a.needed-b.needed||b.value-a.value||String(a.model).localeCompare(String(b.model))||a.index-b.index);
    let left=availableGrease,used=0,covered=0,uncovered=0;
    for(const w of candidates){
      const item=byModel.get(w.model);
      if(w.needed<=left){
        left-=w.needed;used+=w.needed;covered++;item.covered++;revenue+=w.value;
      }else{uncovered++;item.uncovered++;}
    }
    return {total,ready,covered,uncovered,impossible,exportable:ready+covered,
      revenue,suggested,used,capacity,byModel};
  }
  function greaseSuggested(rows,restorePoints=RESTORE_MIN){return repairPlan(rows,Infinity,restorePoints).suggested;}
  // Negotiation-only amount: the seller has NOT agreed to a discount.
  // Do not apply this figure to saved orders or subtract grease costs twice.
  function netSupplierOffer(purchaseCents,greaseCount){
    if(!Number.isSafeInteger(purchaseCents)||purchaseCents<0)throw new RangeError("Offerta acquisto non valida");
    if(!Number.isInteger(greaseCount)||greaseCount<0||greaseCount>100000)throw new RangeError("Quantità grassi non valida");
    const repair=greaseCount*GREASE_UNIT_CENTS;
    return {amount:Math.max(0,purchaseCents-repair),repair,uncovered:Math.max(0,repair-purchaseCents)};
  }
  function financials(rows,greaseCount,profitGoal=0,roiHundredths=0,restorePoints=RESTORE_MIN){
    if(!Number.isInteger(greaseCount)||greaseCount<0||greaseCount>100000)throw new RangeError("Quantità grassi non valida");
    const quote=totals(rows),plan=repairPlan(rows,greaseCount,restorePoints);
    const repair=greaseCount*GREASE_UNIT_CENTS,totalCost=quote.cost+repair,profit=plan.revenue-totalCost;
    return {
      ...quote,...plan,greaseCount,repair,totalCost,profit,
      // Revenue only includes guns reaching >=90% with this explicit repair scenario.
      revenue:plan.revenue,
      roi:totalCost>0?profit/totalCost*100:null,
      margin:plan.revenue>0?profit/plan.revenue*100:null,
      maxPurchase:target(plan.revenue,profitGoal,roiHundredths)-repair
    };
  }
  const api={cents,totals,target,allocate,greasePerWeapon,greaseSuggested,repairStatus,repairPlan,netSupplierOffer,financials,GREASE_UNIT_CENTS,MIN_EXPORT_CONDITION,RESTORE_MIN,RESTORE_MAX,RESTORE_POINTS,MAX_REPAIRS};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VauclairMath=api;
})(globalThis);
