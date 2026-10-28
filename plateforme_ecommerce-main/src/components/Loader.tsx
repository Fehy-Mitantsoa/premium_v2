/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function Loader({ fullPage = false }: { fullPage?: boolean }) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="font-sans text-sm font-medium text-slate-500 animate-pulse">Chargement en cours...</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
