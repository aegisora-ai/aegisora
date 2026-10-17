"use client";

import { useState } from "react";
import Link from "next/link";
import { Sun, Moon, Globe, Lock } from "lucide-react";

export default function ProtectIdentityPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "Eray",
    middleName: "Not set",
    lastName: "Özer",
  });

  return (
    <main
      className={`min-h-screen w-full flex flex-col justify-between p-6 lg:p-10 font-sans transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#f4f4f5] text-[#111111]"}`}
    >
      <header className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span className="text-[18px] font-serif tracking-tight mt-0.5">
            Serus
          </span>
        </div>
        <div
          className={`flex items-center p-1 rounded-full border ${isDarkMode ? "b order-gray-800 bg-[#141414]" : "b order-gray-300 bg-white"}`}
        >
          <button
            onClick={() => setIsDarkMode(false)}
            className="p-1.5 rounded-full text-gray-400"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsDarkMode(true)}
            className="p-1.5 rounded-full text-white bg-[#222]"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full py-10 text-center">
        <h1 className="text-3xl lg:text-4xl font-serif tracking-tight mb-2">
          What&apos;s your name?
        </h1>
        <p
          className={`text-[13px] font-mono mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          Verify that Serus is looking for the right person.
        </p>

        {/* Küçük Etiket */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161619] border b order-gray-800 text-[11px] font-mono text-gray-400 mb-8">
          <Globe className="w-3 h-3 text-blue-400" />
          <span>Used to find your exposure</span>
        </div>

        {/* Input Formu */}
        <div className="flex flex-col gap-4 w-full text-left mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400">
                First name*
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full bg-[#141417] border b order-gray-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:b order-gray-600"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400">
                Middle name
              </label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) =>
                  setFormData({ ...formData, middleName: e.target.value })
                }
                className="w-full bg-[#141417] border b order-gray-800 rounded-xl px-3.5 py-3 text-xs text-gray-500 focus:outline-none focus:b order-gray-600"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-gray-400">
              Last name*
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full bg-[#141417] border b order-gray-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:b order-gray-600"
            />
          </div>
        </div>

        <div className="w-full max-w-sm flex flex-col items-center gap-3 mb-10">
          <Link href="/onboarding/protect/location" className="w-full">
            <button className="w-full py-3.5 bg-[#b490ff] hover:bg-[#a37bf5] text-black font-medium text-[14px] rounded-full transition-colors shado w-sm cursor-pointer">
              Continue
            </button>
          </Link>
          <Link
            href="/onboarding/protect/light-scan-intro"
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors py-1"
          >
            Back
          </Link>
        </div>

        {/* Güvenlik Kutusu */}
        <div className="w-full bg-[#0d1c14] border b order-emerald-900/30 rounded-2xl p-4 text-left font-mono text-xs text-emerald-400/90 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <Lock className="w-4 h-4" />
            <span>Built on trust.</span>
          </div>
          <p className="text-[11px] text-gray-400">
            • We will never sell any user information or data.
          </p>
          <p className="text-[11px] text-gray-400">
            • All data is encrypted in transit and when stored.
          </p>
          <p className="text-[11px] text-gray-400">
            • Designed to support SOC 2 and GDPR programs.
          </p>
          <p className="text-[11px] text-gray-400">
            • You can delete your account and data anytime.
          </p>
        </div>
      </div>

      <div className="w-full h-4"></div>
    </main>
  );
}
