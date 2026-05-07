"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authWithGoogle, register } from "@/actions/auth-actions";

const planFeatures = [
    "Persistent team rooms",
    "Spatial audio presence",
    "Live activity analytics",
];

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
            fill="currentColor"
            d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.4h3.1c1.8-1.7 3.1-4.1 3.1-7.1Z"
        />
        <path
            fill="currentColor"
            d="M12 22c2.7 0 4.9-.9 6.5-2.4l-3.1-2.4c-.9.6-2 .9-3.4.9a6 6 0 0 1-5.7-4.2H3.1v2.5A9.8 9.8 0 0 0 12 22Z"
        />
        <path
            fill="currentColor"
            d="M6.3 13.9a6.1 6.1 0 0 1 0-3.8V7.6H3.1a10 10 0 0 0 0 8.8l3.2-2.5Z"
        />
        <path
            fill="currentColor"
            d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.5 9.5 0 0 0 12 2a9.8 9.8 0 0 0-8.9 5.6l3.2 2.5A6 6 0 0 1 12 5.9Z"
        />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
            d="m5 12 4 4 10-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        </svg>
    );
}

export default function RegisterPage() {
    const searchParams = useSearchParams();
    const errorMessage = useMemo(() => searchParams.get("error"), [searchParams]);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <main className="vo-shell vo-grid min-h-screen px-5 py-6 text-[var(--text-primary)] sm:px-8 lg:p-0">
            <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-7xl overflow-hidden rounded-3xl border border-[var(--border-base)] bg-[rgba(8,12,20,0.78)] shadow-[var(--shadow-hero)] backdrop-blur-xl lg:min-h-screen lg:grid-cols-[45fr_55fr] lg:rounded-none lg:border-0">
                <section className="relative hidden overflow-hidden border-r border-[var(--border-base)] p-10 lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(144,221,240,0.18),transparent_32%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-72 bg-[radial-gradient(circle_at_50%_100%,rgba(7,57,60,0.28),transparent_58%)]" />

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-3 font-[var(--font-brand)] text-2xl font-bold tracking-[-0.04em]">
                    <span className="h-3 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_24px_var(--accent-glow)]" />
                    VirtualOffice
                    </Link>
                    <div className="mt-16 max-w-md">
                    <p className="font-[var(--font-ui-mono)] text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                        Start your team space
                    </p>
                    <h1 className="mt-5 font-[var(--font-serif)] text-5xl font-bold leading-tight tracking-[-0.04em]">
                        Build a workplace people can feel.
                    </h1>
                    <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">
                        Create a persistent office for daily standups, deep work, design reviews, and spontaneous hallway chats.
                    </p>
                    </div>
                </div>

                <div className="relative z-10 rounded-2xl border border-[var(--border-base)] bg-[rgba(15,23,42,0.48)] p-6">
                    <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-[var(--text-tertiary)]">Starter workspace</p>
                        <p className="mt-2 font-[var(--font-serif)] text-4xl font-bold tracking-[-0.04em]">Free</p>
                    </div>
                    <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
                        ⭐⭐⭐
                    </span>
                    </div>
                    <ul className="mt-6 space-y-4">
                    {planFeatures.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                            <CheckIcon />
                        </span>
                        {feature}
                        </li>
                    ))}
                    </ul>
                </div>
                </section>

                <section className="flex items-center justify-center px-5 py-12 sm:px-8 lg:px-16">
                <div className="w-full max-w-md">
                    <Link href="/" className="mb-10 inline-flex items-center gap-3 font-[var(--font-brand)] text-xl font-bold tracking-[-0.04em] lg:hidden">
                    <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
                    VirtualOffice
                    </Link>

                    <p className="font-[var(--font-ui-mono)] text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
                    Create account
                    </p>
                    <h2 className="mt-3 font-[var(--font-serif)] text-4xl font-bold leading-tight tracking-[-0.04em]">
                    Set up your virtual office.
                    </h2>

                    {errorMessage ? (
                        <div
                        className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                        role="alert"
                        >
                        {errorMessage}
                        </div>
                    ) : null}

                    <form action={register} className="mt-6 space-y-5">
                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">Full name</span>
                        <input
                        type="text"
                        name="name"
                        placeholder="Juan Dela Cruz"
                        required
                        className="h-11 w-full rounded-xl border border-[var(--border-base)] bg-[rgba(15,23,42,0.5)] px-4 text-sm text-white placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-glow)]"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">Work email</span>
                        <input
                        type="email"
                        name="email"
                        placeholder="you@company.com"
                        required
                        className="h-11 w-full rounded-xl border border-[var(--border-base)] bg-[rgba(15,23,42,0.5)] px-4 text-sm text-white placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-glow)]"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">Password</span>
                        <span className="flex h-11 items-center rounded-xl border border-[var(--border-base)] bg-[rgba(15,23,42,0.5)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent-glow)]">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Create a password"
                            required
                            className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm text-white placeholder:text-[var(--text-faint)] focus:outline-none"
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword((current) => !current)}
                            className="mr-3 rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--accent-soft)] hover:text-white"
                        >
                            <EyeIcon />
                        </button>
                        </span>
                    </label>

                    <label className="flex items-start gap-3 text-sm leading-6 text-[var(--text-tertiary)]">
                        <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[var(--border-base)] accent-[var(--accent)]" />
                        I agree to the Terms of Service and Privacy Policy.
                    </label>

                    <button type="submit" className="vo-button-primary h-12 w-full rounded-xl font-[var(--font-brand)] text-base font-bold text-white">
                        Create Workspace
                    </button>
                    </form>

                    <div className="mt-4">
                        <form action={authWithGoogle}>
                        <button
                            type="submit"
                            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[var(--border-base)] bg-[rgba(15,23,42,0.5)] text-sm font-semibold text-white transition hover:border-[rgba(99,102,241,0.5)] hover:bg-[rgba(15,23,42,0.7)]"
                        >
                            <GoogleIcon />
                            Continue with Google
                        </button>
                        </form>
                    </div>

                    <p className="mt-8 text-center text-sm text-[var(--text-tertiary)]">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-[var(--accent)] hover:text-white">
                        Log in
                    </Link>
                    </p>
                </div>
                </section>
            </div>
            </main>
        </Suspense>
    );
}
