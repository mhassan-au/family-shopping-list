export default function Loading() {
  return (
    <main
      className="
      min-h-screen
      flex
      flex-col
      items-center
      justify-center
      bg-green-600
      "
    >

      {/* App Icon */}

      <img
        src="/cart.png"
        alt="MyGrocery"
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
        text-white
        "
      >
        MyGrocery
      </h1>


      {/* Loading Text */}

      <p
        className="
        mt-3
        text-white
        text-sm
        "
      >
        Loading...
      </p>

    </main>
  );
}