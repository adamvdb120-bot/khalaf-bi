"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="nl">
      <body className="bg-gray-50 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-5">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={26} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy-700 mb-1">Er ging iets fout</h1>
            <p className="text-sm text-gray-500">
              We hebben de fout automatisch gemeld. Probeer het opnieuw —
              werkt het nog steeds niet, neem dan contact op.
            </p>
            {error.digest && (
              <p className="text-[10px] text-gray-300 mt-3 font-mono">ref: {error.digest}</p>
            )}
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={reset}
              className="bg-navy-700 hover:bg-navy-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Opnieuw proberen
            </button>
            <a
              href="/"
              className="border border-gray-200 hover:border-navy-300 text-navy-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Terug naar home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
