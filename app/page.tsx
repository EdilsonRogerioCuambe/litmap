import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, ShieldCheck, BookOpen, Layers, BarChart3, CheckCircle2 } from "lucide-react";

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const user = session?.user;
  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#1C1C1E] selection:bg-[#5c7e6b]/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#FAF8F4]/80 backdrop-blur-md border-b border-[#e2ddd8]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#5c7e6b] rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl">
              L
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">LitMap</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5c5955]">
            <a href="#features" className="hover:text-[#5c7e6b] transition-colors">Funcionalidades</a>
            <a href="#workflow" className="hover:text-[#5c7e6b] transition-colors">Metodologia</a>
            <a href="#pricing" className="hover:text-[#5c7e6b] transition-colors">Preços</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-xs font-medium text-[#5c5955]">
                  Olá, <span className="text-[#1C1C1E]">{user.email?.split('@')[0]}</span>
                </span>
                <Link href="/projects">
                  <Button className="bg-[#5c7e6b] hover:bg-[#44664b] text-white px-5 rounded-full text-sm font-bold tracking-wide flex gap-2">
                    Painel Principal
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-sm font-medium hover:text-[#5c7e6b]">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-[#5c7e6b] hover:bg-[#44664b] text-white px-5 rounded-full text-sm font-bold tracking-wide">
                    Começar Grátis
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5c7e6b]/10 border border-[#5c7e6b]/20 text-[#5c7e6b] text-xs font-bold uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Potenciado por IA & Supabase
            </div>

            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-[#1C1C1E] mb-8 max-w-4xl mx-auto leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Mapeie o Conhecimento com <span className="text-[#5c7e6b]">Precisão Académica.</span>
            </h1>

            <p className="text-lg md:text-xl text-[#5c5955] max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-1000">
              A plataforma definitiva para revisões sistemáticas e mapeamento literário. Organize, trie e analise os seus estudos num fluxo de trabalho impecável.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              {user ? (
                <Link href="/projects">
                  <Button className="bg-[#1C1C1E] text-white px-8 py-7 rounded-2xl text-lg font-bold transition-all hover:scale-105 shadow-lg group">
                    Continuar Investigação
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button className="bg-[#5c7e6b] hover:bg-[#44664b] text-white px-8 py-7 rounded-2xl text-lg font-bold transition-all hover:scale-105 shadow-lg shadow-[#5c7e6b]/20 group">
                      Criar o meu Projeto
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" className="border-[#e2ddd8] bg-white text-[#1C1C1E] px-8 py-7 rounded-2xl text-lg font-bold hover:bg-[#FAF8F4] transition-all">
                      <Github className="mr-2 w-5 h-5" />
                      Entrar com GitHub
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Dashboard Preview Mockup */}
            <div className="mt-20 relative max-w-5xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#5c7e6b] to-[#8fb39d] rounded-[32px] blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white border border-[#e2ddd8] rounded-[24px] shadow-2xl overflow-hidden aspect-video group">
                <div className="absolute inset-0 bg-[#5c7e6b]/5 flex items-center justify-center group-hover:bg-transparent transition-colors duration-500">
                  <div className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <BookOpen className="w-8 h-8 text-[#5c7e6b]" />
                  </div>
                </div>
                {/* Imagem Placeholder Decorativa */}
                <div className="h-full w-full bg-[radial-gradient(#e2ddd8_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-white border-y border-[#e2ddd8]/50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1C1C1E] mb-4">Construído para a Excelência em Investigação</h2>
              <p className="text-[#5c5955] max-w-xl mx-auto">Ferramentas poderosas que simplificam cada etapa da sua revisão sistemática.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Layers className="w-6 h-6" />,
                  title: "Gestão PRISMA",
                  desc: "Geração automática de diagramas de fluxo para o seu relatório final, sem complicações manuais."
                },
                {
                  icon: <BarChart3 className="w-6 h-6" />,
                  title: "Analytics Avançado",
                  desc: "Visualize tendências, anos de publicação e distribuição geográfica dos seus estudos com um clique."
                },
                {
                  icon: <ShieldCheck className="w-6 h-6" />,
                  title: "Triagem Cega",
                  desc: "Colabore com a sua equipa mantendo a integridade da triagem através do sistema de votos independentes."
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-3xl border border-[#e2ddd8] bg-[#FAF8F4]/30 hover:border-[#5c7e6b]/30 transition-all group">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-[#5c7e6b] group-hover:bg-[#5c7e6b] group-hover:text-white transition-all">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-3">{feature.title}</h3>
                  <p className="text-sm text-[#5c5955] leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto bg-[#1C1C1E] rounded-[40px] p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[#5c7e6b] rounded-full blur-[100px] opacity-20"></div>

            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 relative z-10">
              Pronto para elevar o nível da sua <br/><span className="text-[#8fb39d]">investigação académica?</span>
            </h2>
            <p className="text-[#9c9894] mb-10 text-lg relative z-10">Junte-se a centenas de investigadores que já usam o LitMap para organizar o seu conhecimento.</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link href="/register">
                <Button className="bg-[#5c7e6b] hover:bg-[#44664b] text-white px-10 py-7 rounded-2xl text-lg font-bold">
                  Começar agora gratuitamente
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#8fb39d]" />
                Sem cartão de crédito
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-[#e2ddd8]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#5c7e6b] rounded flex items-center justify-center text-white font-serif font-bold text-sm">L</div>
            <span className="font-serif font-bold text-lg">LitMap</span>
          </div>
          <p className="text-sm text-[#9c9894]">© 2026 LitMap. Desenvolvido para cientistas por cientistas.</p>
          <div className="flex gap-6 text-sm text-[#5c5955]">
            <a href="#" className="hover:text-[#5c7e6b]">Privacidade</a>
            <a href="#" className="hover:text-[#5c7e6b]">Termos</a>
            <a href="#" className="hover:text-[#5c7e6b]">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
