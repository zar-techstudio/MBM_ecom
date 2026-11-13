"use client";

import { useEffect, useRef, useState } from "react";
import { api, mergeAfterSignIn, refreshMe, setMe, type Me } from "@/lib/account";

type Channel = "whatsapp" | "sms" | "email";
const CHANNEL_TEXT: Record<Channel, string> = { whatsapp: "WhatsApp", sms: "SMS", email: "email" };

// The ways the ERP offers (asked once per visit).
let optionsCache: Promise<Channel[]> | null = null;
function signInChannels() {
  optionsCache ??= api<{ channels: Channel[] }>("signin-options")
    .then((o) => (o.channels?.length ? o.channels : (["whatsapp", "sms"] as Channel[])))
    .catch(() => ["whatsapp", "sms"] as Channel[]);
  return optionsCache;
}

const isEmail = (v: string) => v.includes("@");
const digits = (v: string) => v.replace(/\D/g, "");
/** A 10-digit Indian mobile, from any way of writing it (+91, spaces, a leading 0). */
const mobileOf = (v: string) => digits(v).slice(-10);
const looksValid = (v: string) => (isEmail(v) ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) : mobileOf(v).length === 10);

const WA = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3.2a8.7 8.7 0 0 0-7.5 13.1L3.3 20.8l4.6-1.2A8.7 8.7 0 1 0 12 3.2z" />
    <path className="fill" d="M8.9 7.9c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.4l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.2.3 0 .6.6 1 1.4 1.8 2.4 2.3.3.2.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.4.4 0 .5-.2 1.1-.6 1.4-.5.4-1.4.7-2.3.5-1-.2-2.4-.8-3.7-2-1.3-1.2-2.1-2.6-2.3-3.5-.2-.9 0-1.7.4-2.1z" />
  </svg>
);

/**
 * Sign in with a mobile number or an email: the code comes by WhatsApp or SMS (mobile) or by
 * email, as the ERP offers. Then (first time only) the shopper's name.
 * With mode "phone": add and confirm a mobile number on the signed-in account (needed before
 * checkout); if that number already has showroom bills, the account joins that customer.
 */
export function SignIn({
  title = "Sign in",
  onDone,
  mode = "signin",
}: {
  title?: string;
  onDone?: (info?: { joined?: boolean }) => void;
  mode?: "signin" | "phone";
}) {
  const phoneOnly = mode === "phone";
  const [step, setStep] = useState<"target" | "code" | "name">("target");
  const [target, setTarget] = useState("");
  const [channels, setChannels] = useState<Channel[]>(["whatsapp", "sms"]);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [wait, setWait] = useState(0); // seconds until "send again"
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    void signInChannels().then((c) => {
      if (!live) return;
      setChannels(c);
      setChannel((now) => (c.includes(now) ? now : (c.find((x) => x !== "email") ?? c[0])));
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const email = !phoneOnly && isEmail(target);
  const mobileWays: Channel[] = channels.filter((c) => c !== "email");
  const emailOffered = !phoneOnly && channels.includes("email");
  // The way the code goes for what was typed.
  const way: Channel = email ? "email" : mobileWays.includes(channel) ? channel : (mobileWays[0] ?? "sms");
  const shown = email ? target.trim() : `+91 ${mobileOf(target)}`;

  const send = async (via: Channel = way) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api("otp", {
        target: email ? target.trim() : mobileOf(target),
        channel: via,
        ...(phoneOnly ? { purpose: "phone" } : {}),
      });
      setChannel(via);
      setStep("code");
      setCode("");
      setWait(30);
      window.setTimeout(() => codeInput.current?.focus(), 50);
    } catch (e) {
      const msg = (e as Error).message;
      // Not on WhatsApp: switch to SMS and let the shopper send again.
      if (/not on whatsapp/i.test(msg) && mobileWays.includes("sms")) {
        setChannel("sms");
        setNotice("This number is not on WhatsApp. We'll send the code by SMS instead.");
      } else setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length < 4) return;
    setBusy(true);
    setError(null);
    try {
      if (phoneOnly) {
        const r = await api<{ ok: boolean; me?: Me; joined?: boolean; error?: string }>("verify-phone", {
          phone: mobileOf(target),
          code: value,
        });
        if (!r.ok) {
          setError(r.error ?? "That code didn't work. Please try again.");
          return;
        }
        if (r.me) setMe(r.me);
        else await refreshMe();
        onDone?.({ joined: Boolean(r.joined) });
        return;
      }
      const r = await api<{ ok: boolean; needs_name?: boolean; error?: string }>("verify", {
        target: email ? target.trim() : mobileOf(target),
        code: value,
      });
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
      {step === "name" || title ? <h2 className="co-h">{step === "name" ? "Welcome! What should we call you?" : title}</h2> : null}
      {step === "target" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label className="field">
            <span>{phoneOnly ? "Mobile number" : emailOffered ? "Mobile number or email" : "Mobile number"}</span>
            <div className={`field-phone${email ? " is-email" : ""}`}>
              {email ? null : <span>+91</span>}
              <input
                type={emailOffered ? "text" : "tel"}
                inputMode={emailOffered ? "email" : "numeric"}
                autoComplete={emailOffered ? "username" : "tel-national"}
                autoCapitalize="none"
                spellCheck={false}
                value={target}
                onChange={(e) => setTarget(e.target.value.slice(0, 120))}
                placeholder={emailOffered ? "Mobile number or email" : "10-digit mobile number"}
                required
              />
            </div>
          </label>
          {!email && mobileWays.length > 1 ? (
            <div className="signin-ways" role="radiogroup" aria-label="Send the code by">
              <span>Send the code by</span>
              {mobileWays.map((c) => (
                <label key={c} className={way === c ? "on" : undefined}>
                  <input type="radio" name="way" checked={way === c} onChange={() => setChannel(c)} />
                  {CHANNEL_TEXT[c]}
                </label>
              ))}
            </div>
          ) : null}
          {notice ? <p className="co-ok">{notice}</p> : null}
          <p className="co-small signin-note">
            We&rsquo;ll send a one-time code by {CHANNEL_TEXT[way]}. No password needed.
          </p>
          <button className="co-btn signin-send" disabled={busy || !looksValid(target)}>
            {way === "whatsapp" ? WA : null}
            {busy ? "Sending…" : "Send Verification Code"}
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
            <span>
              Enter the 6-digit code sent by {CHANNEL_TEXT[way]} to {shown}
            </span>
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
            <button type="button" className="co-link" onClick={() => setStep("target")}>
              {email ? "Change email" : "Change number"}
            </button>
            {" · "}
            {wait > 0 ? (
              <span>Send again in {wait}s</span>
            ) : (
              <>
                <button type="button" className="co-link" onClick={() => void send()} disabled={busy}>
                  Send again
                </button>
                {!email && mobileWays.length > 1 ? (
                  <>
                    {" · "}
                    <button
                      type="button"
                      className="co-link"
                      onClick={() => void send(way === "whatsapp" ? "sms" : "whatsapp")}
                      disabled={busy}
                    >
                      Send by {way === "whatsapp" ? "SMS" : "WhatsApp"} instead
                    </button>
                  </>
                ) : null}
              </>
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
