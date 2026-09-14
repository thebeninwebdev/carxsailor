import {beforeEach,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({user:vi.fn(),update:vi.fn(),invalidate:vi.fn()}));
vi.mock("./auth",()=>({getCurrentUser:mocks.user}));
vi.mock("./db",()=>({connectMongoose:vi.fn()}));
vi.mock("./email/notifications",()=>({notifyListingOwner:vi.fn()}));
vi.mock("./invalidation",()=>({invalidateVendor:mocks.invalidate,invalidateInventory:vi.fn()}));
vi.mock("@/models/VendorProfile",()=>({VendorProfileModel:{updateOne:mocks.update,findOne:()=>({lean:async()=>({_id:"vendor"})})}}));
import {applyVendor,updateProfile} from "./mutations";
function form(nin="01234567890") {const f=new FormData();for(const [k,v]of Object.entries({displayName:"  Lagos Cars  ",businessName:"Ignored",nin,phoneNumber:"08012345678",state:"Lagos",city:"Ikeja",description:"Cars for sale"}))f.set(k,v);return f;}
beforeEach(()=>{vi.clearAllMocks();mocks.user.mockResolvedValue({id:"seller",role:"BUYER"});mocks.update.mockResolvedValue({matchedCount:1});});
it("stores NIN with leading zeros and one shared business/display name",async()=>{
 await expect(applyVendor(form())).resolves.toMatchObject({destination:"/vendor"});
 expect(mocks.update).toHaveBeenCalledWith({userId:"seller"},{$setOnInsert:expect.objectContaining({nin:"01234567890",displayName:"Lagos Cars",businessName:"Lagos Cars",status:"PENDING",location:{state:"Lagos",city:"Ikeja"}})},{upsert:true,runValidators:true});
});
it.each(["","1234567890","123456789012","0123456789a"])("rejects invalid NIN %s before saving",async nin=>{await expect(applyVendor(form(nin))).rejects.toMatchObject({status:422});expect(mocks.update).not.toHaveBeenCalled();});
it("requires NIN",async()=>{const f=form();f.delete("nin");await expect(applyVendor(f)).rejects.toMatchObject({status:422});expect(mocks.update).not.toHaveBeenCalled();});
it.each([undefined,{id:"admin",role:"ADMIN"}])("rejects unauthorized applications",async user=>{mocks.user.mockResolvedValue(user);await expect(applyVendor(form())).rejects.toMatchObject({status:user?403:401});expect(mocks.update).not.toHaveBeenCalled();});
it("keeps both stored names synchronized when editing",async()=>{await updateProfile(form());expect(mocks.update.mock.calls[0][1]).toEqual({$set:{displayName:"Lagos Cars",businessName:"Lagos Cars",description:"Cars for sale"}});});
