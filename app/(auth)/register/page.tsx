"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        toast.error(error.message || "Erro ao registar conta.");
      } else {
        toast.success("Conta criada com sucesso!");
        router.push("/projects");
      }
    } catch (err) {
      toast.error("Ocorreu um erro no registo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setGithubLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/projects",
      });
    } catch (err) {
      toast.error("Ocorreu um erro com o GitHub SignIn");
      setGithubLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#5c7e6b]/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-top-4 duration-700">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-10 h-10 bg-[#5c7e6b] rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-lg shadow-[#5c7e6b]/20 group-hover:scale-110 transition-transform">
            L
          </div>
          <span className="font-serif font-bold text-2xl tracking-tight text-[#1C1C1E]">LitMap</span>
        </Link>
        
        <h2 className="text-center text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#1C1C1E]">
          Criar conta gratuita
        </h2>
        <p className="mt-2 text-center text-sm text-[#5c5955]">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-[#5c7e6b] hover:text-[#44664b] transition-colors">
            Faça login aqui
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] border border-[#e2ddd8]">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#1C1C1E]">
                Nome completo
              </label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-[#e2ddd8] px-3 py-2 placeholder-[#9c9894] shadow-sm focus:border-[#5c7e6b] focus:outline-none focus:ring-[#5c7e6b] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1C1C1E]">
                Endereço de e-mail
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-[#e2ddd8] px-3 py-2 placeholder-[#9c9894] shadow-sm focus:border-[#5c7e6b] focus:outline-none focus:ring-[#5c7e6b] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1C1C1E]">
                Palavra-passe
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-[#e2ddd8] px-3 py-2 placeholder-[#9c9894] shadow-sm focus:border-[#5c7e6b] focus:outline-none focus:ring-[#5c7e6b] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-[#1C1C1E] py-6 text-sm font-bold text-white shadow-lg hover:opacity-90 transition-all tracking-widest uppercase active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Registar"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e2ddd8]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-[#9c9894]">Ou registar com</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={handleGithubSignIn}
                disabled={githubLoading}
                variant="outline"
                className="w-full border-[#e2ddd8] text-[#1C1C1E] bg-white hover:bg-[#faf8f4] flex items-center gap-2 font-medium"
              >
                {githubLoading ? (
                  <Loader2 className="animate-spin w-5 h-5 text-[#5c5955]" />
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                    GitHub
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
