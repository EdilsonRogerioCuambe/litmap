export type Stage =
  | "identification"
  | "screening"
  | "eligibility"
  | "included"
  | "excluded"

export const STAGES: Stage[] = [
  "identification",
  "screening",
  "eligibility",
  "included",
  "excluded",
]

export const STAGE_LABELS: Record<Stage, string> = {
  identification: "Identificação",
  screening: "Triagem",
  eligibility: "Elegibilidade",
  included: "Incluído",
  excluded: "Excluído",
}

export const STAGE_COLORS: Record<
  Stage,
  { bg: string; text: string; border: string }
> = {
  identification: { bg: "#E8EFF8", text: "#3A6FA8", border: "#3A6FA8" },
  screening: { bg: "#FDF3E7", text: "#C4914A", border: "#C4914A" },
  eligibility: { bg: "#EAF1ED", text: "#5C7E6B", border: "#5C7E6B" },
  included: { bg: "#E8F5EE", text: "#2E7D52", border: "#2E7D52" },
  excluded: { bg: "#FDEAEA", text: "#B94040", border: "#B94040" },
}

export type ReferenceType =
  | "Artigo"
  | "Tese"
  | "Capítulo de Livro"
  | "Actas de Conferência"
  | "Livro"
  | "Relatório"
  | "Outro"

export type ExclusionCategory =
  | "Remoção por Título"
  | "Remoção por Resumo/Abstract"
  | "Artigo Retratado"
  | "Duplicado"
  | "Capítulo de Livro"
  | "Livro"
  | "Tese/Dissertação"
  | "Relatório/Técnico"
  | "Estudo Secundário/Terciário"
  | "Critério de Inclusão"
  | "Metodologia"
  | "População"
  | "Período"
  | "Sem Texto Completo"
  | "Idioma"
  | "Tipo de Publicação"
  | "Outro"
  | string // allows custom categories

export interface Reference {
  id: string
  title: string
  authors: string[]
  year: number | null
  journal: string | null
  doi: string | null
  url: string | null
  abstractNote: string | null
  keywords: string[]
  database: string
  type: ReferenceType
  stage: Stage
  exclusionReason?: string | null
  exclusionCategory?: ExclusionCategory | null
  notes?: string | null
  qualityScore?: number | null // 1-5
  importedFrom?: string | null
  importBatchId?: string | null
  volume?: string | null
  issue?: string | null
  pages?: string | null
  publisher?: string | null
  isbn?: string | null
  language?: string | null

  // Zotero / Excel Fields
  zoteroKey?: string | null
  issn?: string | null
  publicationDate?: string | null
  dateAdded?: string | null
  dateModified?: string | null
  accessDate?: string | null
  numPages?: string | null
  numberOfVolumes?: string | null
  journalAbbreviation?: string | null
  shortTitle?: string | null
  series?: string | null
  seriesNumber?: string | null
  seriesText?: string | null
  seriesTitle?: string | null
  place?: string | null
  rights?: string | null
  archive?: string | null
  archiveLocation?: string | null
  callNumber?: string | null
  extra?: string | null
  fileAttachments?: string | null
  linkAttachments?: string | null
  editor?: string | null
  seriesEditor?: string | null
  translator?: string | null
  contributor?: string | null
  bookAuthor?: string | null
  number?: string | null
  edition?: string | null
  conferenceName?: string | null
  meetingName?: string | null
  country?: string | null
  programmingLanguage?: string | null
  version?: string | null

  itemType?: string | null
  libraryCatalog?: string | null
  manualTags?: string | null
  automaticTags?: string | null
  attorneyAgent?: string | null
  castMember?: string | null
  commenter?: string | null
  composer?: string | null
  cosponsor?: string | null
  counsel?: string | null
  interviewer?: string | null
  producer?: string | null
  recipient?: string | null
  reviewedAuthor?: string | null
  scriptwriter?: string | null
  wordsBy?: string | null
  guest?: string | null
  runningTime?: string | null
  scale?: string | null
  medium?: string | null
  artworkSize?: string | null
  filingDate?: string | null
  applicationNumber?: string | null
  assignee?: string | null
  issuingAuthority?: string | null
  court?: string | null
  bibReferences?: string | null
  reporter?: string | null
  legalStatus?: string | null
  priorityNumbers?: string | null
  system?: string | null
  code?: string | null
  codeNumber?: string | null
  section?: string | null
  session?: string | null
  committee?: string | null
  history?: string | null
  legislativeBody?: string | null

  screeningPhase?: string
  bibliographicExtras?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Extraction {
  id: string
  referenceId: string
  objective: string
  participantsContext: string
  educationalLevel: string
  country: string
  ageRange: string
  participantsN: string
  duration: string
  methodology: string
  instruments: string[]
  toolPlatform: string
  gamificationElements: string[]
  gamificationFramework: string
  gamificationType: string
  keyFindings: string
  motivationImpact: string
  performanceImpact: string
  theoreticalFramework: string
  limitations: string
  pedagogicalImplications: string
  synthesisNotes: string
  personalRelevance: string
  qualityScore: number
}

export interface Theme {
  id: string
  name: string
  color: string
  description: string
  referenceIds: string[]
}

export interface CustomScreeningColumn {
  id: string
  label: string
  defaultExclusionCategory: ExclusionCategory
  color?: string
}

export interface Project {
  id: string
  slug: string
  title: string
  researchQuestion: string
  area: string
  reviewType: string | null
  reviewFramework: string | null
  databases: string[]
  searchStrings: Record<string, string>
  yearFrom: number | null
  yearTo: number | null
  keywords: string[]
  languages: string[]
  inclusionCriteria: string[]
  exclusionCriteria: string[]
  methodologicalNotes: string | null
  prismaNotes: string | null
  prismaChecklist: Record<string, { checked: boolean; notes: string }>
  exportPreferences: {
    format: string
    includeAbstracts: boolean
    includeExclusions: boolean
    includeNotes: boolean
    includeHistory: boolean
  }
  status: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  logs?: ProjectLog[]
  members?: (ProjectMember & { user: UserProfile })[]
  customScreeningColumns?: CustomScreeningColumn[]
}

export interface UserProfile {
  id: string
  name: string
  email: string
  image: string | null
}

export interface ProjectMember {
  id: string
  role: string
  userId: string
  projectId: string
  createdAt: string
}

export interface ProjectLog {
  id: string
  action: string
  details: string | null
  createdAt: string
  user?: UserProfile
}

export interface ImportBatch {
  id: string
  date: string
  filename: string
  format: string
  imported: number
  duplicates: number
  errors: number
}

export interface AppState {
  project: Project | null
  references: Reference[]
  extractions: Extraction[]
  themes: Theme[]
  imports: ImportBatch[]
}

export const PRISMA_CHECKLIST: Array<{
  id: string
  section: string
  item: string
}> = [
  { id: "1", section: "Título", item: "Identificar o relato como uma revisão sistemática." },
  { id: "2", section: "Resumo", item: "Ver checklist do resumo PRISMA 2020." },
  { id: "3", section: "Introdução / Justificativa", item: "Descrever a justificativa da revisão no contexto do conhecimento existente." },
  { id: "4", section: "Introdução / Objectivos", item: "Apresentar uma declaração explícita dos objectivos ou questões de investigação." },
  { id: "5", section: "Métodos / Critérios de elegibilidade", item: "Especificar os critérios de inclusão e exclusão." },
  { id: "6", section: "Métodos / Fontes de informação", item: "Identificar todas as bases de dados, registos e outras fontes." },
  { id: "7", section: "Métodos / Estratégia de pesquisa", item: "Apresentar a estratégia completa de pesquisa para todas as bases." },
  { id: "8", section: "Métodos / Selecção dos estudos", item: "Especificar os métodos usados para decidir se um estudo cumpre os critérios." },
  { id: "9", section: "Métodos / Processo de extracção de dados", item: "Especificar os métodos usados para colectar dados dos relatos." },
  { id: "10a", section: "Métodos / Itens dos dados", item: "Listar e definir todos os desfechos para os quais foram procurados dados." },
  { id: "10b", section: "Métodos / Itens dos dados", item: "Listar e definir todas as outras variáveis para as quais foram procurados dados." },
  { id: "11", section: "Métodos / Avaliação do risco de viés", item: "Descrever os métodos para avaliar o risco de viés nos estudos." },
  { id: "12", section: "Métodos / Medidas de efeito", item: "Especificar as medidas de efeito para cada desfecho." },
  { id: "13a", section: "Métodos / Síntese", item: "Descrever os processos para decidir quais estudos eram elegíveis para cada síntese." },
  { id: "13b", section: "Métodos / Síntese", item: "Descrever os métodos usados para preparar os dados para apresentação ou síntese." },
  { id: "13c", section: "Métodos / Síntese", item: "Descrever os métodos para tabular ou apresentar visualmente os resultados." },
  { id: "13d", section: "Métodos / Síntese", item: "Descrever os métodos para sintetizar os resultados." },
  { id: "13e", section: "Métodos / Síntese", item: "Descrever os métodos para explorar a heterogeneidade entre os resultados." },
  { id: "13f", section: "Métodos / Síntese", item: "Descrever as análises de sensibilidade conduzidas." },
  { id: "14", section: "Métodos / Risco de viés de relato", item: "Descrever os métodos para avaliar o risco de viés de relato." },
  { id: "15", section: "Métodos / Avaliação da certeza", item: "Descrever os métodos para avaliar a certeza no corpo de evidências." },
  { id: "16a", section: "Resultados / Selecção dos estudos", item: "Descrever os resultados do processo de pesquisa e selecção." },
  { id: "16b", section: "Resultados / Selecção dos estudos", item: "Citar estudos que pareciam cumprir os critérios mas foram excluídos." },
  { id: "17", section: "Resultados / Características dos estudos", item: "Citar cada estudo incluído e apresentar as suas características." },
  { id: "18", section: "Resultados / Risco de viés", item: "Apresentar avaliações de risco de viés para cada estudo." },
  { id: "19", section: "Resultados / Resultados de cada estudo", item: "Apresentar todos os resultados para cada estudo." },
  { id: "20", section: "Resultados / Síntese dos resultados", item: "Apresentar os resultados de cada síntese." },
  { id: "21", section: "Discussão", item: "Apresentar a interpretação geral dos resultados no contexto." },
]
