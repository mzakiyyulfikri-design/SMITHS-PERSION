"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }
    if (password !== "smiths") {
      setError("Username/Password Incorrect");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex-1 grid md:grid-cols-2 min-h-screen">
      {/* Brand panel */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[var(--primary)] to-[#0b3d3a] text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 grid place-items-center text-xl font-bold">
            S
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">SMITHS</div>
            <div className="text-xs text-white/70 tracking-[0.2em]">PERSION</div>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Perioperative Anesthesia Workstation
          </h2>
          <p className="mt-4 text-white/80 leading-relaxed max-w-md">
            Decision support system for operating room prioritization,
            scoring-based scheduling, and end-to-end surgical workflow
            monitoring.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold">8</div>
              <div className="text-white/70">Scoring variables</div>
            </div>
            <div>
              <div className="text-2xl font-bold">6</div>
              <div className="text-white/70">Operating rooms</div>
            </div>
            <div>
              <div className="text-2xl font-bold">4</div>
              <div className="text-white/70">Surgery phases</div>
            </div>
          </div>
        </div>
        <p className="text-xs text-white/60">
          © 2026 SMITHS Healthcare Suite. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)] text-white grid place-items-center font-bold">
              S
            </div>
            <div>
              <div className="text-base font-bold">SMITHS</div>
              <div className="text-[11px] text-[var(--muted)] tracking-widest">
                PERSION
              </div>
            </div>
          </div>

          {!forgot ? (
            <>
              <h1 className="text-2xl font-bold">Sign in to your workspace</h1>
              <p className="text-sm text-[var(--muted)] mt-1.5">
                Enter your credentials to access the perioperative workstation.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label className="label-base">Username</label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="e.g. zhaq"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-base">Password</label>
                  <input
                    type="password"
                    className="input-base"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-[11px] text-[var(--muted)] mt-1.5">
                    Hint for prototype: password is <code>smiths</code>
                  </p>
                </div>

                {error && (
                  <div className="text-sm rounded-lg bg-[var(--priority-high-soft)] text-[var(--priority-high)] px-3 py-2 border border-red-200">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full">
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => setForgot(true)}
                  className="text-sm text-[var(--primary)] hover:underline w-full text-center"
                >
                  Forgot password?
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Forgot password</h1>
              <p className="text-sm text-[var(--muted)] mt-1.5">
                Enter your registered email or NIP/STR. We will send a reset
                link.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Reset link sent (prototype).");
                  setForgot(false);
                }}
                className="mt-8 space-y-4"
              >
                <div>
                  <label className="label-base">Email or NIP / STR</label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="you@hospital.id"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Send reset link
                </button>
                <button
                  type="button"
                  onClick={() => setForgot(false)}
                  className="text-sm text-[var(--muted-foreground)] hover:underline w-full text-center"
                >
                  Back to login
                </button>
              </form>
            </>
          )}

          <p className="mt-10 text-xs text-[var(--muted)] text-center">
            Back to{" "}
            <Link href="/" className="text-[var(--primary)] hover:underline">
              SMITHS Suite
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
