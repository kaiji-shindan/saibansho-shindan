"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-500/30 active:scale-[0.97]"
    >
      <Printer className="h-4 w-4" />
      PDF として保存 / 印刷
    </button>
  );
}
