export const CAR_SERVICE_FEE_RATE=0.015;
export function calculateVehiclePrice(sellerPrice:number){const normalized=Math.round(sellerPrice);const serviceFeeAmount=Math.round(normalized*CAR_SERVICE_FEE_RATE);return{sellerPrice:normalized,serviceFeeRate:CAR_SERVICE_FEE_RATE,serviceFeeAmount,price:normalized+serviceFeeAmount};}
