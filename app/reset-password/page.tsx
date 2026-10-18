import type {Metadata} from "next";
import Link from "next/link";
export const metadata:Metadata={title:"Reset password",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function Page() {
  return <div className="container grid min-h-[70vh] place-items-center py-14"><div className="card w-full max-w-md p-7 sm:p-9">
    <p className="eyebrow">Passwordless sign in</p><h1 className="display mt-3 text-4xl">No password to reset.</h1>
    <p className="my-6 text-sm text-[#68756f]">Use a new sign-in link whenever you need access to your account.</p>
    <Link className="btn btn-dark" href="/login">Send me a sign-in link</Link>
  </div></div>;
}
