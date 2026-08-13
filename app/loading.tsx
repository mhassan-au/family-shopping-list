import Image from "next/image";
import { UI_TEXT } from "@/lib/uiText";

export default function Loading() {
  return (
    <main
      className="
      min-h-screen
      flex
      flex-col
      items-center
      justify-center
      bg-slate-50
      text-slate-900
      dark:bg-slate-900
      dark:text-slate-50
      "
    >

      {/* App Icon */}

      <Image
        src="/cart.png"
        alt={UI_TEXT.appName}
        width={128}
        height={128}
        className="
        w-32
        h-32
        mb-5
        rounded-3xl
        "
      />


      {/* App Name */}

      <h1
        className="
        text-3xl
        font-bold
        text-slate-900
        dark:text-slate-50
        "
      >
        {UI_TEXT.appName}
      </h1>


      {/* Loading Text */}

      <p
        className="
        mt-3
        text-slate-500
        dark:text-slate-400
        text-sm
        "
      >
        {UI_TEXT.loading}
      </p>

    </main>
  );
}
