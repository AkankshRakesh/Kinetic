
"use client";

import { Suspense, useState } from "react";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["600", "700"],
});


type ResponseState = "ready" | "submitting" | "accepted" | "rejected" | "invalid" | "error";
type InviteDecision = "accepted" | "rejected";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<ResponseState>("ready");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("Add an optional note, then choose how you would like to respond.");
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  async function submitResponse(decision: InviteDecision) {
    if (!token) {
      setState("invalid");
      setStatusMessage("This invitation link is missing its token.");
      return;
    }

    setState("submitting");
    setStatusMessage(decision === "accepted" ? "Accepting your invitation..." : "Rejecting your invitation...");

    try {
        const apiUrl = (process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? "").replace(/\/$/, "");
        const baseUrl = apiUrl ? apiUrl : "";
        const endpoint = baseUrl + `/api/invitations/${encodeURIComponent(token)}/respond`;

        const response = await fetch(endpoint, {
        method: "POST",
          headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decision,
          message,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        data?: { uploadUrl?: string | null };
      };

      if (!response.ok) {
        setState(response.status === 404 ? "invalid" : "error");
        setStatusMessage(data.message || "We could not save your response.");
        return;
      }

      setState(decision);
      setStatusMessage(data.message || (decision === "accepted" ? "Invitation accepted." : "Invitation rejected."));
      if (decision === "accepted" && data.data?.uploadUrl) {
        setUploadUrl(data.data.uploadUrl);
      }
    } catch (err: unknown) {
      setState("error");
      setStatusMessage(err instanceof Error ? err.message : "We could not reach the invitation server.");
    }
  }

  const hasResponded = state === "accepted" || state === "rejected";
  const isBusy = state === "submitting";
  const isMissingToken = !token;

  return (
    <main className={`${uiFont.className} grid min-h-screen place-items-center bg-[#090b10] px-6 text-[#e6dad3]`}>
      <section className="w-full max-w-lg border border-[#2b2520]/70 bg-[#0d1118] p-8">
        <p className="mb-3 text-[10px] font-semibold tracking-[0.28em] text-[#8f8078]">
          INVITATION_RESPONSE
        </p>
        <h1 className={`${displayFont.className} text-4xl font-semibold italic text-[#ffb77b]`}>
          {state === "accepted"
            ? "You are on the list"
            : state === "rejected"
              ? "Response recorded"
            : state === "invalid" || isMissingToken
                ? "Invite not found"
                : "Respond to invite"}
        </h1>
        <p className="mt-5 text-sm leading-6 text-[#bbaaa2]">
          {isMissingToken ? "This invitation link is missing its token." : statusMessage}
        </p>

        {!hasResponded && state !== "invalid" && !isMissingToken && (
          <div className="mt-6">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full resize-none rounded-sm border border-[#3b3430]/80 bg-[#090b10] px-4 py-3 text-sm text-[#dac7bd] placeholder:text-[#5a4e48] focus:border-[#ffb77b]/60 focus:outline-none"
              placeholder="Leave a message for the host"
              disabled={isBusy}
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => submitResponse("accepted")}
                disabled={isBusy}
                className="bg-[#ffb77b] px-5 py-3 text-xs font-bold tracking-[0.18em] text-[#2e1500] transition hover:bg-[#ffc994] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? "Saving..." : "Accept Invite"}
              </button>
              <button
                type="button"
                onClick={() => submitResponse("rejected")}
                disabled={isBusy}
                className="border border-[#ff7b7b]/35 bg-[#2a1111] px-5 py-3 text-xs font-bold tracking-[0.18em] text-[#ffb3b3] transition hover:bg-[#ff7b7b]/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reject Invite
              </button>
            </div>
          </div>
        )}

        {state === "accepted" && uploadUrl && (
          <div className="mt-6">
            <Link
              href={uploadUrl}
              className="inline-flex w-full items-center justify-center bg-[#ffb77b] px-5 py-3 text-xs font-bold tracking-[0.18em] text-[#2e1500] transition hover:bg-[#ffc994]"
            >
              OPEN UPLOAD + SCHEDULE PAGE
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <main className={`${uiFont.className} grid min-h-screen place-items-center bg-[#090b10] px-6 text-[#e6dad3]`}>
          <section className="w-full max-w-lg border border-[#2b2520]/70 bg-[#0d1118] p-8">
            <p className="text-sm leading-6 text-[#bbaaa2]">Loading invitation...</p>
          </section>
        </main>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
