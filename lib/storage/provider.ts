import "server-only";
import {v2 as cloudinary} from "cloudinary";

export type StoredImage={url:string;publicId:string;alt:string};
export interface ImageStorageProvider{upload(file:File,options:{folder:string;alt:string}):Promise<StoredImage>;delete(publicId:string):Promise<void>}

function ensureConfigured(){
  if(process.env.CLOUDINARY_URL)return;
  const{CLOUDINARY_CLOUD_NAME:cloud_name,CLOUDINARY_API_KEY:api_key,CLOUDINARY_API_SECRET:api_secret}=process.env;
  if(!cloud_name||!api_key||!api_secret)throw new Error("Cloudinary is not configured. Set CLOUDINARY_URL or the three CLOUDINARY_* credentials.");
  cloudinary.config({cloud_name,api_key,api_secret,secure:true});
}

export function getImageStorageProvider():ImageStorageProvider{return{
  async upload(file,options){
    validateVehicleImage(file);ensureConfigured();
    const bytes=Buffer.from(await file.arrayBuffer());
    const result=await new Promise<{secure_url:string;public_id:string}>((resolve,reject)=>{
      const stream=cloudinary.uploader.upload_stream({folder:`carxsailor/vehicles/${options.folder}`,resource_type:"image",use_filename:false,unique_filename:true,overwrite:false},(error,value)=>error||!value?reject(error??new Error("Cloudinary upload failed.")):resolve(value));
      stream.end(bytes);
    });
    return{url:result.secure_url,publicId:result.public_id,alt:options.alt};
  },
  async delete(publicId){ensureConfigured();await cloudinary.uploader.destroy(publicId,{resource_type:"image",invalidate:true})}
}}

export function validateVehicleImage(file:File){const allowed=new Set(["image/jpeg","image/png","image/webp"]);if(!allowed.has(file.type))throw new Error("Only JPEG, PNG and WebP images are allowed.");if(file.size>8*1024*1024)throw new Error("Images must be 8 MB or smaller.");return file}
