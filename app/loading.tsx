export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#FAF8F4] z-[9999]">
      <div className="relative flex items-center justify-center">
        {/* Pulsing rings */}
        <div className="absolute w-24 h-24 bg-[#5c7e6b]/20 rounded-full animate-ping"></div>
        <div className="absolute w-16 h-16 bg-[#5c7e6b]/40 rounded-full animate-pulse"></div>
        
        {/* Central Logo Box */}
        <div className="relative w-12 h-12 bg-[#5c7e6b] rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-xl shadow-[#5c7e6b]/30">
          L
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-2">
        <h3 className="font-serif font-bold text-[#1C1C1E] text-lg">Sincronizando Biblioteca</h3>
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 bg-[#5c7e6b] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-[#5c7e6b] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-[#5c7e6b] rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
