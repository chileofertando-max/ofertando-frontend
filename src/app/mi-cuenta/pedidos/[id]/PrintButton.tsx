"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800"
    >
      Imprimir / Guardar PDF
    </button>
  );
}
