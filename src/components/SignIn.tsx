"use client";

import { useEffect, useRef, useState } from "react";
import { api, mergeAfterSignIn, setMe, type Me } from "@/lib/account";

/**
 * Sign in with a mobile number: send a code, type it, and (first time only) tell us your name.
 * The ERP decides whether the number is new or already a customer (showroom bills included).
 */
export function SignIn({ title = "Sign in with your mobile", onDone }: { title?: string; onDone?: () => void }) {
  const [step, setStep] = useState<"phone" | "code" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0); // seconds until "send again"
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("otp", { phone });
      setStep("code");
      setCode("");
      setWait(30);
      window.setTimeout(() => codeInput.current?.focus(), 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length < 4) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ ok: boolean; needs_name?: boolean; error?: string }>("verify", { phone, code: value });
      if (!r.ok) {
        setError(r.error ?? "That code didn't work. Please try again.");
        return;
      }
      await mergeAfterSignIn();
      if (r.needs_name) setStep("name");
      else onDone?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveName = async () => {
    setBusy(true);
    setError(null);
    try {
      setMe(await api<Me>("profile", { name }));
      onDone?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="signin">
      <h2 className="co-h">{step === "name" ? "Welcome! What should we call you?" : title}</h2>
      {step === "phone" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label className="field">
            <span>Mobile number</span>
            <div className="field-phone">
              <span>+91</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, "").slice(0, 15))}
                placeholder="98765 43210"
                required
                autoFocus
              />
            </div>
          </label>
          <p className="co-small">We&rsquo;ll send a one-time code on WhatsApp or SMS. No password needed.</p>
          <button className="co-btn" disabled={busy || phone.replace(/\D/g, "").length < 10}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : step === "code" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <label className="field">
            <span>Enter the 6-digit code sent to +91 {phone.replace(/\D/g, "").slice(-10)}</span>
            <input
              ref={codeInput}
              className="field-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                if (v.length === 6) void verify(v);
              }}
              placeholder="••••••"
              required
            />
          </label>
          <button className="co-btn" disabled={busy || code.length < 4}>
            {busy ? "Checking…" : "Continue"}
          </button>
          <p className="co-small">
            <button type="button" className="co-link" onClick={() => setStep("phone")}>
              Change number
            </button>
            {" · "}
            {wait > 0 ? (
              <span>Send again in {wait}s</span>
            ) : (
              <button type="button" className="co-link" onClick={() => void send()} disabled={busy}>
                Send again
              </button>
            )}
          </p>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void saveName();
          }}
        >
          <label className="field">
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 80))} autoComplete="name" required autoFocus />
          </label>
          <button className="co-btn" disabled={busy || !name.trim()}>
            {busy ? "Saving…" : "Continue"}
          </button>
        </form>
      )}
      {error ? (
        <p className="co-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
