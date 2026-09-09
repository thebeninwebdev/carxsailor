import "server-only";
import {APIError, createAuthMiddleware} from "better-auth/api";
import {authLinkExpiresIn, sendAuthEmail} from "./auth-emails";
import {scheduleNotification} from "./schedule";
import {sendTransactionalEmail} from "./send-email";
import {renderEmail} from "./templates";
import {appUrl} from "./config";

export function createEmailAuthOptions(verifyAccount: (email:string) => Promise<void>) {
  return {
    verification:{storeIdentifier:"hashed" as const},
    emailAndPassword:{
      enabled:true, minPasswordLength:8,
      resetPasswordTokenExpiresIn:authLinkExpiresIn,
      revokeSessionsOnPasswordReset:true,
      sendResetPassword: (data:Parameters<typeof sendAuthEmail>[1]) => sendAuthEmail("password-reset",data),
    },
    emailVerification:{
      expiresIn:authLinkExpiresIn,
      // Preserve optional verification and existing sign-in behavior.
      sendOnSignUp:false,
      sendVerificationEmail: (data:Parameters<typeof sendAuthEmail>[1]) => sendAuthEmail("verification",data),
    },
    hooks:{
      before:createAuthMiddleware(async ctx => {
        if(ctx.path!=="/request-password-reset") return;
        // Better Auth 1.7.1's default runner catches dispatch errors. Override
        // only this request's runner so essential reset-email failures reach
        // the client. Token generation, expiry, and validation stay in Better Auth.
        return {context:{context:{
          runInBackgroundOrAwait:async (promise:Promise<unknown>|void) => await promise,
        }}};
      }),
      after:createAuthMiddleware(async ctx => {
      const user=ctx.context.newSession?.user;
      if(ctx.path!=="/sign-up/email" || !user || ctx.context.returned instanceof APIError) return;
      scheduleNotification("welcome",async () => sendTransactionalEmail({
        to:user.email,template:"welcome",
        ...renderEmail({kind:"welcome",name:user.name,url:appUrl("/cars")}),
      }));
      // Automatic verification is a post-registration notification; a failure
      // cannot strand an account without a session. Explicit resends are awaited.
      scheduleNotification("verification",() => verifyAccount(user.email));
    })},
  };
}
