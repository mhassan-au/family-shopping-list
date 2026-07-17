"use client";


interface Props {

  title: string;

  message?: string;

  confirmText: string;

  loading?: boolean;

  onCancel: ()=>void;

  onConfirm: ()=>void;

}


export default function ConfirmDialog({

  title,

  message,

  confirmText,

  loading = false,

  onCancel,

  onConfirm

}: Props) {


  {/* Confirmation Modal */}

  return (

    <div
      className="
      fixed
      inset-0
      bg-black/40
      flex
      items-center
      justify-center
      z-50
      "
    >


      <div
        className="
        bg-white
        rounded-lg
        p-5
        w-80
        "
      >


        {/* Title */}

        <h2 className="font-bold mb-3">

          {title}

        </h2>



        {/* Message */}

        {message && (

          <p className="mb-5">

            {message}

          </p>

        )}



        {/* Buttons */}

        <div className="flex justify-end gap-3">


          <button

            onClick={onCancel}

            className="px-4 py-2"

          >

            Cancel

          </button>



          <button

            onClick={onConfirm}

            className="
            bg-red-500
            text-white
            px-4
            py-2
            rounded
            "

          >

            {loading ? "Please wait..." : confirmText}

          </button>


        </div>


      </div>


    </div>

  );

}