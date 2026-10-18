import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import {MongoDBAdapter} from "@auth/mongodb-adapter";
import {mongoClient} from "@/lib/db";
import {renderEmail} from "@/lib/email/templates";
import {sendTransactionalEmail} from "@/lib/email/send-email";

export const {handlers, auth} = NextAuth({
  // Retain the existing deployment secret during the Better Auth → Auth.js migration.
  // New deployments should set AUTH_SECRET.
  secret: process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
  adapter: MongoDBAdapter(mongoClient),
  providers: [
    Google({
      // Google is the sole provider trusted to prove an existing email identity.
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        if (!profile.email_verified) throw new Error("GOOGLE_EMAIL_NOT_VERIFIED");
        return {id: profile.sub, name: profile.name, email: profile.email.trim().toLowerCase(), image: profile.picture};
      },
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({identifier, url, provider}) {
        const email = renderEmail({kind: "magic-link", url, expiresInMinutes: 60});
        const result = await sendTransactionalEmail({
          to: identifier,
          template: "magic-link",
          ...email,
        });
        if (!result.success) throw new Error("EMAIL_DELIVERY_FAILED");
      },
    }),
  ],
  pages: {signIn: "/login", verifyRequest: "/login?checkEmail=1"},
  callbacks: {
    session({session, user}) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as typeof user & {role?: "ADMIN" | "BUYER"}).role ?? "BUYER";
      }
      return session;
    },
  },
});
