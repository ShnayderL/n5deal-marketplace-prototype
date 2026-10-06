"use client";

import Image from "next/image";
import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";
import { IMAGES } from "@/lib/images";

const QUICK_REPLIES = [
  "What is KYF Deal Readiness?",
  "How does Mandate Matcher work?",
  "Help me contact a seller",
];

const REPLY_MAP: Record<string, string> = {
  default:
    "I'm Maya, your N5Deal AI expert. Ask me about KYF Deal Readiness, Mandate Matcher, Smart Asset ID, or how to start a deal conversation.",
  kyf: "KYF Deal Readiness scores each listing on banking continuity, compliance roles, passporting, entity type, and change-of-control notes — signals buyers use before NDA. Open any asset to see the full breakdown.",
  mandate:
    "Mandate Matcher ranks assets against your buyer profile: category, jurisdiction, budget, required banking/passporting, and services overlap. Edit your mandate under Profile, then check the Buyer dashboard.",
  assetId:
    "Smart Asset ID validation blocks thin listings — sellers must declare license type, banking status, and entity type. CoC notes and regulator improve the KYF grade.",
  emi: "Filter assets by category EMI or try smart search: “EMI in Lithuania with banking under €3m”. KYF badges show deal readiness on each card.",
  verification:
    "Verified buyers have a completed mandate profile. Sellers prioritize serious acquisition interest with banking/passporting requirements filled in.",
  contact:
    "Sign in as a Buyer, open a listing, and use the Contact form. Your message appears in Messages for both parties.",
};

function replyFor(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("kyf") || lower.includes("readiness")) return REPLY_MAP.kyf;
  if (lower.includes("mandate") || lower.includes("match")) return REPLY_MAP.mandate;
  if (lower.includes("asset id") || lower.includes("publish") || lower.includes("validat")) return REPLY_MAP.assetId;
  if (lower.includes("emi") || lower.includes("listing")) return REPLY_MAP.emi;
  if (lower.includes("verif")) return REPLY_MAP.verification;
  if (lower.includes("contact") || lower.includes("seller")) return REPLY_MAP.contact;
  return REPLY_MAP.default;
}

type Msg = { role: "user" | "assistant"; text: string };

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: REPLY_MAP.default },
  ]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }, { role: "assistant", text: replyFor(trimmed) }]);
    setInput("");
  }

  return (
    <>
      {open ? (
        <div className="fixed bottom-24 right-4 z-[55] flex h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:bottom-28 md:right-6">
          <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-[var(--accent)]">
              <Image src={IMAGES.assistant} alt="Maya — AI Expert" fill className="object-cover" sizes="44px" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[var(--text)]">Maya</div>
              <div className="text-xs text-[var(--muted)]">AI Expert · N5Deal</div>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              className="rounded-full p-2 text-[var(--muted)] hover:bg-white"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div
                key={`${i}-${msg.text.slice(0, 12)}`}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "ml-auto bg-[var(--accent-2)] text-white"
                    : "bg-[var(--bg-soft)] text-[var(--text)]"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[var(--border)] px-3 py-2">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                type="button"
                className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--muted)] hover:border-[var(--accent-2)]"
                onClick={() => send(q)}
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-[var(--border)] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              className="input !py-2"
              placeholder="Ask Maya about deals…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary shrink-0 !px-3" aria-label="Send">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Open AI assistant"
        className="fixed bottom-6 right-4 z-[55] flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-2)] text-white shadow-lg ring-4 ring-white transition hover:scale-105 md:bottom-8 md:right-6"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Image
              src={IMAGES.assistant}
              alt=""
              width={56}
              height={56}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]">
              <MessageCircle className="h-3 w-3 text-[#0a3d36]" />
            </span>
          </>
        )}
      </button>
    </>
  );
}
