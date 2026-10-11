(()=>{
'use strict';

/*
  Costi di produzione Armeria Vauclair.
  Valori unitari usati per mostrare il minimo senza perdita negli ordini.
  Le voci Ranch restano volutamente escluse: il loro costo non e' definito
  dallo stesso sistema di ricette/materiali dell'Armeria.
*/
const RAW_COSTS={
  'ACCESSORI REVOLVER||CALCIO':0.6125,
  'ACCESSORI REVOLVER||TACCA DI MIRA':0.6,
  'ACCESSORI REVOLVER||CANNA':0.6,
  'ACCESSORI REVOLVER||TELAIO':0.6,
  'ACCESSORI REVOLVER||CANE':0,
  'ACCESSORI REVOLVER||TAMBURO':0.4,
  'ACCESSORI REVOLVER||GRILLETTO':0.6,

  'ACCESSORI PISTOLA||TACCA DI MIRA':0.4,
  'ACCESSORI PISTOLA||IMPUGNATURA':0.32,
  'ACCESSORI PISTOLA||CANNA':0.6,
  'ACCESSORI PISTOLA||TELAIO':0.9,
  'ACCESSORI PISTOLA||PERCUSSORE':0.9,
  'ACCESSORI PISTOLA||OTTURATORE':0.6,
  'ACCESSORI PISTOLA||GRILLETTO':0.6,

  'ACCESSORI REPEATER||TACCA DI MIRA':0.4,
  'ACCESSORI REPEATER||CANNA':0.4,
  'ACCESSORI REPEATER||TELAIO':0.5,
  'ACCESSORI REPEATER||PERCUSSORE':0.6,
  'ACCESSORI REPEATER||CALCIO':0.96,
  'ACCESSORI REPEATER||OTTURATORE':0.4,
  'ACCESSORI REPEATER||GRILLETTO':0.6,
  'ACCESSORI REPEATER||OTTICA PER FUCILE 2X':7.5,

  'ACCESSORI ARCO E COLTELLO||IMPUGNATURA COLTELLO':1.16,
  'ACCESSORI ARCO E COLTELLO||LAMA COLTELLO':1.46,
  'ACCESSORI ARCO E COLTELLO||IMPUGNATURA ARCO':0.96,
  'ACCESSORI ARCO E COLTELLO||CORPO ARCO':0.24,
  'ACCESSORI ARCO E COLTELLO||CORDA ARCO':0.72,

  'ARMI||REVOLVER CATTLEMAN':52.5,
  'ARMI||REVOLVER DOUBLE ACTION':65,
  'ARMI||COLT M1892':61.7,
  'ARMI||COLT M1873':82.5,
  'ARMI||REVOLVER SCHOFIELD':95,
  'ARMI||PISTOLA SEMIAUTOMATICA':80,
  'ARMI||PISTOLA M1899':100,
  'ARMI||FUCILE VARMINT':82.5,
  'ARMI||REPEATER CARABINA':80,
  'ARMI||REPEATER HENRY':174.2,
  'ARMI||REPEATER EVANS':176.5,
  'ARMI||ARCO':15.9,
  'ARMI||COLTELLO':12,
  'ARMI||LAZO':3.9,
  'ARMI||LAZO RINFORZATO':11.46,

  'MUNIZIONI||FRECCIA STANDARD':0.054,
  'MUNIZIONI||MUNIZIONI REVOLVER':0.0184,
  'MUNIZIONI||MUNIZIONI REVOLVER ALTA VELOCITA':0.024,
  'MUNIZIONI||MUNIZIONI REVOLVER EXPRESS':0.0472,
  'MUNIZIONI||MUNIZIONI PISTOLA STANDARD':0.02,
  'MUNIZIONI||MUNIZIONI PISTOLA ALTA VELOCITA':0.02,
  'MUNIZIONI||MUNIZIONI PISTOLA EXPRESS':0.0472,
  'MUNIZIONI||MUNIZIONI REPEATER':0.0112,
  'MUNIZIONI||MUNIZIONI REPEATER ALTA VELOCITA':0.031,
  'MUNIZIONI||MUNIZIONI FUCILI':0.016,
  'MUNIZIONI||MUNIZIONI FUCILI ALTA VELOCITA':0.042,
  'MUNIZIONI||MUNIZIONI .22':0.0176,

  'PERSONALIZZAZIONI||VARIANTE PER ARMI DA FUOCO':2.2,

  'ALTRO||GRASSO PER ARMI':5,
  'ALTRO||LANTERNA PICCOLA':19.4,
  'ALTRO||POLVERE DA SPARO':0.036,
  'ALTRO||PORTA ARMI LUNGHE':6,
  'ALTRO||PORTA ARMI CORTE':4.62
};

function norm(value){
  return String(value??'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .trim().replace(/\s+/g,' ').toUpperCase();
}

const COSTS=Object.freeze(Object.fromEntries(
  Object.entries(RAW_COSTS).map(([key,value])=>{
    const [cat,item]=key.split('||');
    return [norm(cat)+'||'+norm(item),Number(value)];
  })
));

const ALIASES=Object.freeze({
  [norm('ARMI')+'||'+norm('Revolver Doubleaction')]:norm('ARMI')+'||'+norm('Revolver Double Action'),
  [norm('ARMI')+'||'+norm('Double Action')]:norm('ARMI')+'||'+norm('Revolver Double Action'),
  [norm('ARMI')+'||'+norm('Cattleman')]:norm('ARMI')+'||'+norm('Revolver Cattleman'),
  [norm('ARMI')+'||'+norm('Schofield')]:norm('ARMI')+'||'+norm('Revolver Schofield'),
  [norm('ARMI')+'||'+norm('Evans')]:norm('ARMI')+'||'+norm('Repeater Evans'),
  [norm('ARMI')+'||'+norm('Henry')]:norm('ARMI')+'||'+norm('Repeater Henry'),
  [norm('ARMI')+'||'+norm('Carabina')]:norm('ARMI')+'||'+norm('Repeater Carabina'),
  [norm('ARMI')+'||'+norm('Varmint')]:norm('ARMI')+'||'+norm('Fucile Varmint')
});

function keyFor(category,item){
  const key=norm(category)+'||'+norm(item);
  return ALIASES[key]||key;
}

function unitCost(category,item){
  const key=keyFor(category,item);
  return Object.prototype.hasOwnProperty.call(COSTS,key)?COSTS[key]:null;
}

function lineCost(line){
  const category=line?.category??line?.cat??'';
  const item=line?.item??line?.name??'';
  const qty=Math.max(0,Number(line?.qty)||0);
  const unit=unitCost(category,item);
  if(unit===null)return {known:false,total:0,unit:null,category,item,qty};
  return {known:true,total:unit*qty,unit,category,item,qty};
}

function orderCost(lines){
  const result={total:0,knownTotal:0,complete:true,unknown:[],knownLines:0};
  for(const line of (Array.isArray(lines)?lines:[])){
    const c=lineCost(line);
    if(c.known){
      result.total+=c.total;
      result.knownTotal+=c.total;
      result.knownLines++;
    }else{
      result.complete=false;
      result.unknown.push(c.item||'Voce non riconosciuta');
    }
  }
  return result;
}

window.VAUCLAIR_PRODUCTION_COSTS=COSTS;
window.vauclairProductionUnitCost=unitCost;
window.vauclairProductionLineCost=lineCost;
window.vauclairProductionOrderCost=orderCost;
})();