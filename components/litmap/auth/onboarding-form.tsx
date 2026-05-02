"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GraduationCap, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
  const [loading, setLoading] = useState(false);
  const [academicTitle, setAcademicTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicTitle || !institution) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      // Aqui chamaremos uma Server Action para atualizar o perfil no Prisma
      // const result = await completeOnboarding({ academicTitle, institution });
      
      toast.success("Perfil atualizado com sucesso!");
      router.push("/projects");
    } catch (error) {
      toast.error("Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-[#e2ddd8] bg-white animate-in fade-in zoom-in duration-500">
      <CardHeader className="space-y-1">
        <div className="w-12 h-12 bg-[#5c7e6b]/10 rounded-full flex items-center justify-center mb-4">
          <GraduationCap className="w-6 h-6 text-[#5c7e6b]" />
        </div>
        <CardTitle className="text-2xl font-serif font-bold text-[#1C1C1E]">
          Bem-vindo ao LitMap
        </CardTitle>
        <CardDescription className="text-[#5c5955]">
          Para começarmos, precisamos de saber um pouco mais sobre o seu perfil académico.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-[#1C1C1E]">Qual é o seu título/formação?</Label>
            <Select onValueChange={setAcademicTitle} required>
              <SelectTrigger id="title" className="border-[#e2ddd8] focus:ring-[#5c7e6b]">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doutorado">Doutorado / PhD</SelectItem>
                <SelectItem value="mestrado">Mestrado</SelectItem>
                <SelectItem value="graduado">Graduado</SelectItem>
                <SelectItem value="estudante">Estudante de Graduação</SelectItem>
                <SelectItem value="investigador">Investigador Independente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="institution" className="text-sm font-medium text-[#1C1C1E]">Instituição de Ensino / Afiliação</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-4 h-4 text-[#9c9894]" />
              <Input 
                id="institution"
                placeholder="Ex: Universidade de Coimbra"
                className="pl-10 border-[#e2ddd8] focus:ring-[#5c7e6b]"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#5c7e6b] hover:bg-[#44664b] text-white py-6 rounded-lg font-bold tracking-widest uppercase transition-all"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Concluir Registo"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
