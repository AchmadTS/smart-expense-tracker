import { Suspense } from "react";
import { Wallet } from "lucide-react";
import AuthHero from "@/components/AuthHero";
import Spinner from "@/components/Spinner";
import ResetForm from "@/components/reset-password/ResetForm";

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex bg-white w-full">
      <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-14 py-8 order-1">
        <div className="flex justify-start items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">
            Smart Expense
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center py-10 relative">
          <Suspense
            fallback={
              <div className="flex flex-col items-center gap-4">
                <Spinner />
                <p className="text-sm text-slate-500 font-medium">
                  Preparing secure session...
                </p>
              </div>
            }
          >
            <ResetForm />
          </Suspense>
        </div>

        <div className="flex justify-start gap-6 text-xs text-slate-500">
          <a className="hover:text-slate-900 transition cursor-pointer">
            Privacy Policy
          </a>
          <a className="hover:text-slate-900 transition cursor-pointer">
            Terms
          </a>
          <a className="hover:text-slate-900 transition cursor-pointer">FAQ</a>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] order-2">
        <AuthHero
          headline="Protected"
          subheadline="Data security is our priority"
        />
      </div>
    </div>
  );
}
