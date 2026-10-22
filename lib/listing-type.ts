import type {Vehicle} from "@/types";

export type ListingType="SELL_AND_RENT"|"RENT_ONLY"|"SELL_ONLY";
type ListingLike={listingType?:string;rental?:{enabled?:boolean;pricePerDay?:number}};
/** Interpret pre-listingType data without altering legacy documents. */
export function getListingType(vehicle:ListingLike):ListingType{return vehicle.listingType==="RENT_ONLY"||vehicle.listingType==="SELL_AND_RENT"||vehicle.listingType==="SELL_ONLY"?vehicle.listingType:vehicle.rental?.enabled?"SELL_AND_RENT":"SELL_ONLY"}
export function isVehicleForSale(vehicle:ListingLike){return getListingType(vehicle)!=="RENT_ONLY"}
export function isVehicleForRent(vehicle:ListingLike){return vehicle.rental?.enabled===true&&Number(vehicle.rental.pricePerDay)>0}
export function listingTypeLabel(vehicle:ListingLike){return getListingType(vehicle)==="RENT_ONLY"?"Rent Only":getListingType(vehicle)==="SELL_AND_RENT"?"Sell & Rent":"Sell Only"}
export const saleListingFilter={$or:[{listingType:{$exists:false}},{listingType:{$ne:"RENT_ONLY"}}]};
export const rentalListingFilter={"rental.enabled":true,"rental.pricePerDay":{$gt:0}};
export function buyerPrice(vehicle:Pick<Vehicle,"price">){return vehicle.price}
