"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function DPAPage() {
  return (
    <main className="min-h-screen w-full flex flex-col justify-between font-sans bg-[#f4f4f5] text-[#111111] pt-28">
      {/* Üst Menü / Navbar */}
      <Navbar />

      {/* DPA / Legal İçerik Alanı */}
      <div className="max-w-[760px] w-full mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-5xl font-serif tracking-tight mb-4 leading-tight">
            Data Processing Agreement (DPA)
          </h1>
          <p className="text-xs font-mono text-gray-500">
            Last updated: July 2026
          </p>
        </div>

        <div className="space-y-6 text-sm font-mono text-gray-700 leading-relaxed">
          <h2 className="text-2xl font-serif text-black pt-4">
            1. Purpose and Scope
          </h2>
          <p>
            This Data Processing Agreement (&quot;DPA&quot;) reflects the parties&apos;
            agreement with respect to the processing of enterprise data by
            Aegisora on behalf of business customers, in accordance with
            applicable data protection laws.
          </p>
          <h2 className="text-2xl font-serif text-black pt-4">
            2. Processing of Personal Data
          </h2>
          <p>
            Aegisora shall process organizational data and agent logs only on
            documented instructions from the controller, including with regard
            to transfers of corporate data to a third country or an
            international organization, unless required to do so by union or
            member state law.
          </p>
          <h2 className="text-2xl font-serif text-black pt-4">
            3. Subprocessors
          </h2>
          <p>
            The customer authorizes Aegisora to engage subprocessors as
            necessary to provide the AI governance, monitoring, and security
            platform. Aegisora maintains an up-to-date list of subprocessors
            available upon request.
          </p>
        </div>

        <div className="mt-16 pt-8 b order-t b order-gray-300/60 flex items-center justify-between">
          <Link
            href="/"
            className="text-[13px] font-mono underline text-[#0066EE] hover:text-black transition-colors"
          >
            ← Back to Home
          </Link>
          <Link
            href="/contact/support"
            className="px-6 py-3 bg-[#0066EE] text-white text-[13px] font-medium rounded-full hover:bg-[#005bb5] transition-all shado w-[0_8px_20px_rgba(0,102,238,0.25)]"
          >
            Contact Legal Team
          </Link>
        </div>
      </div>

      {/* Kusursuz Aegisora Ana Footer */}
      <footer className="w-full b order-t py-16 px-6 mt-20 b order-gray-200 bg-[#f4f4f5]">
        <div className="max-w-[1000px] mx-auto flex flex-col items-center">
          <Link
            href="/"
            className="flex items-center gap-3 group cursor-pointer mb-5"
          >
            <svg
              className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
              <circle cx="7" cy="7" r="1.5" />
              <circle cx="17" cy="17" r="1.5" />
              <circle cx="7" cy="17" r="1.5" />
              <circle cx="17" cy="7" r="1.5" />
            </svg>
            <span className="text-xl font-serif font-bold tracking-tight text-[#111111]">
              Aegisora
            </span>
          </Link>

          <p className="text-[13px] text-gray-500 font-mono text-center max-w-[550px] leading-relaxed mb-8">
            You deserve control over your autonomous systems. Aegisora monitors
            what&apos;s happening, helps you manage it, and works to enforce your
            governance policies, so you can deploy AI safely.
          </p>

          <div className="flex items-center gap-6 text-gray-400 mb-16">
            <Link
              href="https://aegisora.ai"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </Link>
            <Link
              href="https://x.com/aegisora_ai"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-[18px] h-[18px]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
            </Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </Link>
            <Link
              href="https://www.linkedin.com/company/aegisora/posts/?feedView=all&viewAsMember=true"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.847-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.588 0 4.257 2.36 4.257 5.39v6.351zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
              </svg>
            </Link>
          </div>

          <div className="w-full flex flex-wrap md:flex-nowrap justify-between gap-y-10 pt-10 b order-t b order-gray-300/60 text-[12.5px] font-mono text-gray-500 text-left">
            <div className="flex flex-col gap-3 w-1/2 md:w-auto">
              <span className="font-bold text-gray-900 mb-2">Company</span>
              <Link
                href="/about"
                className="hover:text-gray-900 transition-colors"
              >
                About
              </Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">
                Careers
              </Link>
              <Link
                href="/blog"
                className="hover:text-gray-900 transition-colors"
              >
                Blog
              </Link>
            </div>
            <div className="flex flex-col gap-3 w-1/2 md:w-auto">
              <span className="font-bold text-gray-900 mb-2">Help</span>
              <Link
                href="/contact/support"
                className="hover:text-gray-900 transition-colors"
              >
                Support
              </Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">
                Status
              </Link>
            </div>
            <div className="flex flex-col gap-3 w-1/2 md:w-auto">
              <span className="font-bold text-gray-900 mb-2">Security</span>
              <Link
                href="/security"
                className="hover:text-gray-900 transition-colors"
              >
                Our Practices
              </Link>
              <Link
                href="/legal/gdpr"
                className="hover:text-gray-900 transition-colors"
              >
                GDPR
              </Link>
              <Link
                href="/legal/dpa"
                className="hover:text-gray-900 transition-colors"
              >
                DPA
              </Link>
            </div>
            <div className="flex flex-col gap-3 w-1/2 md:w-auto">
              <span className="font-bold text-gray-900 mb-2">Product</span>
              <Link
                href="/get-started"
                className="hover:text-gray-900 transition-colors"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/business"
                className="hover:text-gray-900 transition-colors"
              >
                For businesses
              </Link>
              <Link
                href="/pricing"
                className="hover:text-gray-900 transition-colors"
              >
                Pricing
              </Link>
            </div>
            <div className="flex flex-col gap-3 w-1/2 md:w-auto">
              <span className="font-bold text-gray-900 mb-2">Contact</span>
              <Link
                href="/contact/sales"
                className="hover:text-gray-900 transition-colors"
              >
                Contact Sales
              </Link>
              <Link
                href="/contact/business-inquiry"
                className="hover:text-gray-900 transition-colors"
              >
                Business inquiry
              </Link>
              <Link
                href="/contact/partnership"
                className="hover:text-gray-900 transition-colors"
              >
                Partnership
              </Link>
            </div>
            <div className="flex flex-col gap-3 w-1/2 md:w-auto">
              <span className="font-bold text-gray-900 mb-2">Legal</span>
              <Link
                href="/legal/dpa"
                className="hover:text-gray-900 transition-colors"
              >
                Acceptable Use
              </Link>
              <Link
                href="/legal/gdpr"
                className="hover:text-gray-900 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
