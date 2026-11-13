"use client";

import { useState } from "react";
import { api, useAccount } from "@/lib/account";
import { SignIn } from "./SignIn";

/** Sold-out product: "Tell me when it is back". The ERP sends one WhatsApp message when it is on sale
 * again. Needs a signed-in shopper (that is who the message goes to); guests sign in here first. */
export function NotifyBack({ slug }: { slug: string }) {
  const { status } = useAccount();
  const [state, setState] = useState<"idle" | "signin" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    setState("busy");
    setError(null);
    try {
      await api("notify-back", { slug });
      setState("done");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  };

  if (state === "done")
    return <p className="co-ok notify-back-ok">Done. We&rsquo;ll message you on WhatsApp as soon as it&rsquo;s back.</p>;
  if (state === "signin")
    return (
      <div className="notify-back-signin">
        <SignIn title="Sign in so we know where to message you" onDone={() => void ask()} />
      </div>
    );
  return (
    <>
      <button
        type="button"
        className="btn-outline notify-back"
        disabled={state === "busy" || status === "unknown"}
        onClick={() => (status === "signed" ? void ask() : setState("signin"))}
      >
        <span>{state === "busy" ? "Saving…" : "Tell me when it’s back"}</span>
      </button>
      {error ? <p className="co-error">{error}</p> : null}
    </>
  );
}
