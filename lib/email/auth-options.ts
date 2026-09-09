import "server-only";
import {createAuthMiddleware} from "better-auth/api";
import {authLinkExpiresIn,sendAuthEmail} from "./auth-emails";
import {scheduleNotification} from "./schedule";
import {sendTransactionalEmail} from "./send-email";
import {renderEmail} from "./templates";
import {appUrl} from "./config";

export function createEmailAuthOptions(){
  return {
    verification:{storeIdentifier:"hashed" as const},
    emailAndPassword:{
      enabled:true,minPasswordLength:8,
      requireEmailVerification:true,
      autoSignIn:false,
      resetPasswordTokenExpiresIn:authLinkExpiresIn,
      revokeSessionsOnPasswordReset:true,
      sendResetPassword:(data:Parameters<typeof sendAuthEmail>[1])=>sendAuthEmail("password-reset",data),
    },
    emailVerification:{
      expiresIn:authLinkExpiresIn,
      sendOnSignUp:true,
      sendOnSignIn:true,
      autoSignInAfterVerification:true,
      sendVerificationEmail:(data:Parameters<typeof sendAuthEmail>[1])=>sendAuthEmail("verification",data),
      afterEmailVerification:async(user:{email:string;name:string})=>{
        scheduleNotification("welcome",async()=>sendTransactionalEmail({
          to:user.email,template:"welcome",
          ...renderEmail({kind:"welcome",name:user.name,url:appUrl("/cars")}),
        }));
      },
    },
    hooks:{before:createAuthMiddleware(async ctx=>{
      if(ctx.path!=="/request-password-reset")return;
      return {context:{context:{runInBackgroundOrAwait:async(promise:Promise<unknown>|void)=>await promise}}};
    })},
  };
}