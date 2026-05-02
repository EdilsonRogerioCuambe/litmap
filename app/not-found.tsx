import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileSearch, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-[#5c7e6b]/10 blur-3xl rounded-full"></div>
          <FileSearch className="w-24 h-24 text-[#5c7e6b] relative z-10 mx-auto" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-6xl font-serif font-black text-[#1C1C1E]">404</h1>
          <h2 className="text-2xl font-serif font-bold text-[#1C1C1E]">Referência Não Encontrada</h2>
          <p className="text-[#5c5955] leading-relaxed">
            Parece que a página que procura foi removida ou o endereço está incorreto. Vamos voltar para um lugar seguro?
          </p>
        </div>

        <div className="pt-6">
          <Link href="/">
            <Button className="bg-[#5c7e6b] hover:bg-[#44664b] text-white px-8 py-6 rounded-2xl font-bold flex gap-2 mx-auto transition-transform hover:scale-105 shadow-lg shadow-[#5c7e6b]/20">
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Início
            </Button>
          </Link>
        </div>

        <p className="text-[10px] text-[#9c9894] uppercase tracking-[0.2em] pt-8">
          Erro de Sistema: LITMAP_REF_NOT_FOUND
        </p>
      </div>
    </div>
  );
}
