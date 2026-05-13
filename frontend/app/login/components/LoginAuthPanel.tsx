"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";

type LoginAuthPanelProps = {
  redirectTo: string;
};

type AuthMode = "login" | "register";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PasswordRequirementStatus = {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  noWhitespace: boolean;
};

function getPasswordRequirementStatus(password: string): PasswordRequirementStatus {
  return {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*#?&]/.test(password),
    noWhitespace: !/\s/.test(password),
  };
}

type RequirementItemProps = {
  met: boolean;
  label: string;
};

function RequirementItem({ met, label }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`inline-flex size-4 items-center justify-center border ${met ? "border-[#7fb069] bg-[#3d5f3f]/40 text-[#7fb069]" : "border-[#7f4545] bg-[#5f3d3d]/40 text-[#d97777]"}`}>
        {met ? "✓" : "✗"}
      </span>
      <span className={met ? "text-[#7fb069]" : "text-[#d97777]"}>
        {label}
      </span>
    </div>
  );
}

function PasswordRequirementsDisplay({ password }: { password: string }) {
  const reqs = getPasswordRequirementStatus(password);
  const allMet = Object.values(reqs).every(Boolean);

  return (
    <div className={`border px-3 py-2 space-y-2 ${allMet ? "border-[#7fb069] bg-[#3d5f3f]/20" : "border-[#7f4545] bg-[#5f3d3d]/20"}`}>
      <p className={`text-[9px] tracking-[0.12em] font-semibold ${allMet ? "text-[#7fb069]" : "text-[#d97777]"}`}>
        {allMet ? "✓ REQUIREMENTS MET" : "⚠ REQUIREMENTS UNMET"}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <RequirementItem met={reqs.minLength} label="Minimum 12 characters" />
        <RequirementItem met={reqs.hasNumber} label="Contains number" />
        <RequirementItem met={reqs.hasUppercase} label="Contains uppercase" />
        <RequirementItem met={reqs.hasSpecialChar} label="Contains @$!%*#?&" />
        <RequirementItem met={reqs.hasLowercase} label="Contains lowercase" />
        <RequirementItem met={reqs.noWhitespace} label="No spaces" />
      </div>
    </div>
  );
}

export default function LoginAuthPanel({ redirectTo }: LoginAuthPanelProps) {
  const router = useRouter();
  const { login, register, isBusy, status, session } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusMessage = useMemo(() => {
    if (status === "authenticated" && session?.user) {
      return `AUTHENTICATED AS ${session.user.email.toUpperCase()}`;
    }

    return "AWAITING AUTH";
  }, [session?.user, status]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(redirectTo || "/portal");
    }
  }, [redirectTo, router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }

    if (mode === "register") {
      const reqs = getPasswordRequirementStatus(password);
      if (!Object.values(reqs).every(Boolean)) {
        setErrorMessage("Password does not meet all security requirements. See requirements below.");
        return;
      }
    }

    if (mode === "login" && password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (mode === "register" && name.trim().length < 2) {
      setErrorMessage("Name must be at least 2 characters.");
      return;
    }

    try {
      if (mode === "login") {
        await login({ email: trimmedEmail, password });
      } else {
        console.log("Registering with", { name: name.trim(), email: trimmedEmail, password });
        await register({
          name: name.trim(),
          email: trimmedEmail,
          password,
        });
      }

      router.push(redirectTo || "/portal");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to complete authentication.");
    }
  }

  return (
    <article className="relative overflow-hidden border border-[#343234] bg-[#1a191b]/88 p-8 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-[#ffb77b]" />

      <div className="mb-8 flex items-center justify-between text-[10px] tracking-[0.18em] text-[#8f7e76]">
        <p>
          SYSTEM STATUS: <span className="text-[#ffb77b]">{statusMessage}</span>
        </p>
        <span className="inline-block size-2 rounded-full bg-[#ffb77b]" aria-hidden="true" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 border border-[#343234] bg-[#252427] p-1 text-[10px] tracking-[0.18em]">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`px-3 py-2 transition ${
            mode === "login" ? "bg-[#ffb77b] text-[#2e1500]" : "text-[#b9a7a0] hover:text-[#e5e2e3]"
          }`}
        >
          LOGIN
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`px-3 py-2 transition ${
            mode === "register" ? "bg-[#ffb77b] text-[#2e1500]" : "text-[#b9a7a0] hover:text-[#e5e2e3]"
          }`}
        >
          REGISTER
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" ? (
          <div>
            <label className="mb-2 block text-[10px] tracking-[0.2em] text-[#8f7e76]" htmlFor="architect-name">
              ARCHITECT NAME
            </label>
            <input
              id="architect-name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              type="text"
              placeholder="Alex Mercer"
              className="w-full border border-[#343234] bg-[#2c2b2d] px-4 py-3 text-base text-[#e5e2e3] outline-none placeholder:text-[#6f6763] focus:border-[#ffb77b]"
            />
          </div>
        ) : null}



        <div>
          <label className="mb-2 block text-[10px] tracking-[0.2em] text-[#8f7e76]" htmlFor="architect-id">
            ARCHITECT ID
          </label>
          <input
            id="architect-id"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="name@kinetic.void"
            className="w-full border border-[#343234] bg-[#2c2b2d] px-4 py-3 text-base text-[#e5e2e3] outline-none placeholder:text-[#6f6763] focus:border-[#ffb77b]"
          />
        </div>

        <div>
          <label className="mb-2 block text-[10px] tracking-[0.2em] text-[#8f7e76]" htmlFor="architect-password">
            ACCESS KEY
          </label>
          <input
            id="architect-password"
            name="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="********"
            className="w-full border border-[#343234] bg-[#2c2b2d] px-4 py-3 text-base text-[#e5e2e3] outline-none placeholder:text-[#6f6763] focus:border-[#ffb77b]"
          />
        </div>

        {mode === "register" && password.length > 0 ? (
          <PasswordRequirementsDisplay password={password} />
        ) : null}

        {errorMessage ? (
          <p className="border border-[#7f2e2e] bg-[#451a1a]/40 px-3 py-2 text-xs tracking-[0.08em] text-[#ffc2b8]">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isBusy}
          className="flex w-full items-center justify-between bg-[#ffb77b] px-6 py-4 text-[13px] font-semibold tracking-[0.22em] text-[#2e1500] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "PROCESSING..." : mode === "login" ? "PROCEED" : "CREATE IDENTITY"}
          <span className="text-xl leading-none">-&gt;</span>
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-[9px] tracking-[0.16em] text-[#7a706b]">
        <span>{mode === "login" ? "ACCESS RECOVERY" : "ONBOARDING PROTOCOL"}</span>
        <span>//</span>
        <span>SECURITY PROTOCOL</span>
      </div>
    </article>
  );
}
