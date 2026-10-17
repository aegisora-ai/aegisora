"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Shield, Activity } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

// Geliştirici odaklı daha teknik ifadeler
const PHRASES = [
  "Intercepting tool call: execute_sql_query...",
  "Analyzing semantic intent for prompt injection...",
  "Enforcing least-privilege API access...",
  "Blocking unauthorized PII data transfer...",
  "Generating immutable audit log...",
];

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(50);

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % PHRASES.length;
      const fullText = PHRASES[i];

      setCurrentText(
        isDeleting
          ? fullText.substring(0, currentText.length - 1)
          : fullText.substring(0, currentText.length + 1),
      );

      setTypingSpeed(isDeleting ? 20 : 50);

      if (!isDeleting && currentText === fullText) {
        setTimeout(() => setIsDeleting(true), 2500);
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, loopNum, typingSpeed]);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-transparent overflo w-hidden font-sans">
      {/* Arka Plan Işık Hüzmeleri (Glow Effects) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : { rotate: [0, 90, 0], scale: [1, 1.2, 1] }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] min-w-[300px] min-h-[300px] rounded-full bg-blue-600/10 blur-[100px] will-change-transform"
        />
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : { rotate: [0, -90, 0], scale: [1, 1.3, 1] }
          }
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] min-w-[350px] min-h-[350px] rounded-full bg-blue-500/10 blur-[120px] will-change-transform"
        />
      </div>

      <div className="max-w-[1240px] w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10 mx-auto">
        {/* SOL KOLON: Metinler ve Butonlar */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border b order-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Activity className="w-4 h-4" />
            <span>Open Source AI Agent Security</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-medium text-zinc-100 leading-[1.05] tracking-tight mb-6">
            Operational <br className="hidden lg:block" />
            Control for <br className="hidden lg:block" />
            <span className="text-blue-500">AI Agents.</span>
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg font-light">
            Stop selling abstract &quot;safety&quot;. Aegisora is the narrow
            control plane for agent tool and API calls. Enforce least-privilege
            access, block PII leaks, and generate readable audit logs—without
            the bloated black-box middleware.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3.5 px-6 rounded-lg transition-colors text-sm font-medium shado w-lg shado w-blue-600/20"
            >
              Start building
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="https://github.com/ozereray/aegisora.ai"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 transition-colors text-zinc-100 py-3.5 px-6 rounded-lg text-sm font-medium border b order-zinc-800 hover:b order-zinc-700"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        {/* SAĞ KOLON: Mühendislik Vizyonu (Terminal Görünümü) */}
        <div className="lg:col-span-6 relative w-full mx-auto mt-8 lg:mt-0">
          <div className="relative rounded-xl overflo w-hidden shado w-2xl border b order-zinc-800 bg-[#0c0c0e]">
            {/* Terminal Üst Barı (Mac stili) */}
            <div className="flex items-center px-4 py-3 bg-zinc-900/80 b order-b b order-zinc-800">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yello w-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="mx-auto flex items-center text-xs text-zinc-500 font-mono">
                <Shield className="w-3 h-3 mr-2" />
                aegisora-runtime-proxy
              </div>
            </div>

            {/* Terminal Gövdesi ve Dinamik Yazı Efekti */}
            <div className="p-5 font-mono text-sm leading-relaxed text-zinc-300 h-[280px] sm:h-[320px] flex flex-col">
              <div className="text-zinc-500 mb-2">
                # Aegisora Control Plane Initialized
              </div>
              <div className="text-blue-400 mb-4">
                $ tail -f /var/log/aegisora/audit.log
              </div>

              <div className="flex-1 overflo w-hidden">
                <div className="flex gap-3 text-zinc-400 mb-2">
                  <span className="text-zinc-600">14:02:41</span>
                  <span className="text-green-400">[INFO]</span>
                  <span>VPC network isolated.</span>
                </div>
                <div className="flex gap-3 text-zinc-400 mb-2">
                  <span className="text-zinc-600">14:02:42</span>
                  <span className="text-green-400">[INFO]</span>
                  <span>Proxy intercepting port 8080.</span>
                </div>
                <div className="flex gap-3 text-zinc-200 mb-2">
                  <span className="text-zinc-600">14:02:45</span>
                  <span className="text-yello w-400">[WARN]</span>
                  <span>
                    {currentText}
                    <span className="inline-block w-[2px] h-4 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                  </span>
                </div>
              </div>
            </div>

            {/* Terminalin Altındaki Åık Mavi Glow Efekti */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
