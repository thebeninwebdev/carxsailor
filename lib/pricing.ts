export const CAR_SERVICE_FEE_RATE=0.02;
export const RENTAL_SERVICE_FEE_RATE=0.05;
export function calculateVehiclePrice(sellerPrice:number){const normalized=Math.round(sellerPrice);const serviceFeeAmount=Math.round(normalized*CAR_SERVICE_FEE_RATE);return{sellerPrice:normalized,serviceFeeRate:CAR_SERVICE_FEE_RATE,serviceFeeAmount,price:normalized+serviceFeeAmount};}
export function calculateRentalPrice(pricePerDay:number){const normalized=Math.round(pricePerDay);const serviceFeeAmount=Math.round(normalized*RENTAL_SERVICE_FEE_RATE);return{pricePerDay:normalized,serviceFeeRate:RENTAL_SERVICE_FEE_RATE,serviceFeeAmount,price:normalized+serviceFeeAmount};}
