'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-[#e2ddd8] rounded-[32px] p-10 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-[#1C1C1E]">Algo correu mal</h2>
          <p className="text-[#5c5955] text-sm leading-relaxed">
            Ocorreu um erro inesperado no processamento da página. A nossa equipa foi notificada.
          </p>
          {error.digest && (
            <code className="block text-[10px] bg-[#FAF8F4] p-2 rounded mt-4 text-[#9c9894] font-mono">
              ID do Erro: {error.digest}
            </code>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={() => reset()}
            className="bg-[#5c7e6b] hover:bg-[#44664b] text-white py-6 rounded-2xl font-bold flex gap-2 items-center justify-center transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Tentar Novamente
          </Button>
          
          <Link href="/" className="w-full">
            <Button variant="ghost" className="w-full text-[#5c5955] hover:text-[#1C1C1E] py-6 flex gap-2">
              <Home className="w-5 h-5" />
              Voltar à Página Inicial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
