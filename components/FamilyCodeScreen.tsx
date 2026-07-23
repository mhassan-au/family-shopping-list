"use client";

import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { hashCode } from "@/lib/hash";
import { loginAnonymous } from "@/lib/auth";
import { saveDeviceLogin } from "@/lib/device";
import { saveNotificationToken } from "@/lib/notificationToken";
import { requestNotificationPermission } from "@/lib/messaging";

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

            const ref = doc(
                db,
                "families",
                familyCode,
                "users",
                username.toLowerCase()
            );

            const snapshot = await getDoc(ref);

            if (!snapshot.exists()) {
                throw new Error("Invalid login");
            }

            const data = snapshot.data();

            const passwordHash = await hashCode(password);

            if (passwordHash !== data.passwordHash) {
                throw new Error("Invalid login");
            }

            await loginAnonymous();

            saveDeviceLogin(
                familyCode,
                username.toLowerCase()
            );

            try {

                const token =
                    await requestNotificationPermission();

                if (token) {

                    await saveNotificationToken(
                        familyCode,
                        username,
                        token
                    );

                }

            }
            catch (error) {

                console.log(
                    "Notification setup skipped",
                    error
                );

            }

            window.location.reload();

        } catch (err: any) {

            setError(
                err.message || "Login failed"
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
      "
        >

            <div
                className="
    w-full
    max-w-sm
    border
    rounded-xl
    p-5
    space-y-4
  "
            >

                <h1 className="text-2xl font-bold text-center">
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
                        className="
        mt-1
        border
        rounded-lg
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
                        className="
        mt-1
        border
        rounded-lg
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
                        className="
        mt-1
        border
        rounded-lg
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
                    className="w-full btn-primary"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>

            </div>

        </main>

    );

}