"use client";

import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { hashCode } from "@/lib/hash";
import { loginAnonymous } from "@/lib/auth";
import { saveDeviceLogin } from "@/lib/device";
import {
    isDeviceApproved,
    requestDeviceApproval,
} from "@/lib/deviceApproval";

export default function FamilyCodeScreen() {

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [familyCode, setFamilyCode] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit() {

        setLoading(true);
        setError("");

        try {
            const normalizedFamilyCode = familyCode.trim();
            const normalizedUsername = username.trim().toLocaleLowerCase();

            const ref = doc(
                db,
                "families",
                normalizedFamilyCode,
                "users",
                normalizedUsername
            );

            const snapshot = await getDoc(ref);

            if (!snapshot.exists()) {
                throw new Error("Invalid login");
            }

            const data = snapshot.data();
            const role = data.role;
            const passwordHash = await hashCode(password);

            if (passwordHash !== data.passwordHash) {
                throw new Error("Invalid login");
            }

            const firebaseUser = await loginAnonymous();

            const approved = await isDeviceApproved(firebaseUser.uid);

            if (!approved) {
                await requestDeviceApproval(
                    firebaseUser.uid,
                    normalizedFamilyCode,
                    normalizedUsername
                );
            }

            saveDeviceLogin(
                normalizedFamilyCode,
                normalizedUsername,
                role,
                firebaseUser.uid
            );

            window.location.reload();

        } catch (err: unknown) {

            setError(
                err instanceof Error ? err.message : "Login failed"
            );

        } finally {

            setLoading(false);

        }

    }
    return (

        <main
            className="
      min-h-screen
      flex
      items-center
      justify-center
      p-5
      bg-slate-50
      dark:bg-slate-900
      "
        >

            <div
                className="
    w-full
    max-w-sm
    border
    border-blue-200
    rounded-xl
    p-5
    space-y-4
    bg-white
    shadow-sm
    dark:border-blue-800
    dark:bg-slate-800
  "
            >

                <h1 className="rounded-xl bg-gradient-to-r from-blue-100 to-cyan-50 px-3 py-3 text-center text-2xl font-bold dark:from-blue-950 dark:to-slate-900">
                    🛒 MyGrocery
                </h1>

                <p className="text-center text-sm text-gray-500">
                    Sign in to your family shopping list
                </p>

                {/* Family Code */}

                <div>
                    <label className="text-sm font-medium">
                        Family Code
                    </label>

                    <input
                        type="text"
                        value={familyCode}
                        onChange={(e) => setFamilyCode(e.target.value)}
                        className="input
        mt-1
        p-2
        w-full
      "
                    />
                </div>

                {/* Username */}

                <div>
                    <label className="text-sm font-medium">
                        Username
                    </label>

                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="input
        mt-1
        p-2
        w-full
      "
                    />
                </div>

                {/* Password */}

                <div>
                    <label className="text-sm font-medium">
                        Password
                    </label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input
        mt-1
        p-2
        w-full
      "
                    />
                </div>

                {error && (
                    <p className="text-red-500 text-sm">
                        {error}
                    </p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full rounded-lg border border-blue-700 bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>

            </div>

        </main>

    );

}
