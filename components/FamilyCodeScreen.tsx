"use client";

import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { hashCode } from "@/lib/hash";
import { loginAnonymous } from "@/lib/auth";
import { saveDeviceLogin } from "@/lib/device";
import { updateDoc } from "firebase/firestore";


export default function FamilyCodeScreen() {

    const [code, setCode] = useState("");

    const [error, setError] = useState("");

    const [loading, setLoading] = useState(false);


    async function handleSubmit() {

        setLoading(true);

        setError("");


        try {

            const hash = await hashCode(code);


            const ref = doc(
                db,
                "app_config",
                "access"
            );


            const snapshot = await getDoc(ref);


            if (!snapshot.exists()) {

                throw new Error("Configuration missing");

            }


            const data = snapshot.data();


            if (data.locked) {

                throw new Error(
                    "Access locked"
                );

            }


            if (hash !== data.codeHash) {

                const attempts =
                    (data.failedAttempts || 0) + 1;


                await updateDoc(ref, {

                    failedAttempts: attempts,

                    locked: attempts >= 5,

                });


                if (attempts >= 5) {

                    throw new Error(
                        "Access locked"
                    );

                }


                throw new Error(
                    `Invalid code. Attempt ${attempts}/5`
                );

            }


            await loginAnonymous();

            await updateDoc(ref, {

                failedAttempts: 0,

                locked: false,

            });

            saveDeviceLogin();


            window.location.reload();


        } catch (err: any) {

            setError(
                err.message || "Invalid code"
            );

        }


        setLoading(false);

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

                <h1 className="text-xl font-bold">
                    🛒 MyGrocery
                </h1>


                <p>
                    Enter family code
                </p>


                <input

                    type="password"

                    value={code}

                    onChange={(e) => setCode(e.target.value)}

                    className="
          border
          rounded-lg
          p-2
          w-full
          "

                />


                {error && (

                    <p className="text-red-500 text-sm">
                        {error}
                    </p>

                )}


                <button

                    onClick={handleSubmit}

                    disabled={loading}

                    className="
          bg-black
          text-white
          rounded-lg
          px-4
          py-2
          w-full
          "

                >

                    {loading
                        ? "Checking..."
                        : "Continue"
                    }

                </button>


            </div>

        </main>

    );

}