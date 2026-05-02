"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type {
  AppState,
  Extraction,
  ImportBatch,
  Project,
  Reference,
  Theme,
} from "./types"
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

export const EMPTY_STATE: AppState = {
  project: null,
  references: [],
  extractions: [],
  themes: [],
  imports: [],
}

const STORAGE_KEY = "litmap.state.v1"

type Ctx = {
  state: AppState
  hydrated: boolean
  /* project */
  setProject: (p: Project) => void
  updateProject: (patch: Partial<Project>) => void
  resetAll: () => void
  importState: (s: AppState) => void
  /* references */
  addReference: (r: Omit<Reference, "id" | "createdAt" | "updatedAt">) => Reference
  addReferences: (r: Omit<Reference, "id" | "createdAt" | "updatedAt">[]) => Reference[]
  updateReference: (id: string, patch: Partial<Reference>) => void
  deleteReference: (id: string) => void
  moveReference: (
    id: string,
    stage: Reference["stage"],
    extra?: { exclusionCategory?: Reference["exclusionCategory"]; exclusionReason?: string },
  ) => void
  /* extractions */
  upsertExtraction: (referenceId: string, patch: Partial<Extraction>) => Extraction
  /* themes */
  addTheme: (t: Omit<Theme, "id" | "referenceIds">) => Theme
  updateTheme: (id: string, patch: Partial<Theme>) => void
  deleteTheme: (id: string) => void
  toggleThemeReference: (themeId: string, referenceId: string) => void
  /* imports */
  recordImport: (b: Omit<ImportBatch, "id">) => void
  /* prisma */
  setPrismaItem: (id: string, patch: Partial<{ checked: boolean; notes: string }>) => void
  setPrismaNotes: (s: string) => void
  loadSample: () => void
}

const StoreContext = createContext<Ctx | null>(null)

const now = () => new Date().toISOString()

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE)
  const [hydrated, setHydrated] = useState(false)
  const initialized = useRef(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
      if (raw) {
        const parsed = JSON.parse(raw) as AppState
        setState(parsed)
      }
    } catch (err) {
      console.log("[v0] Failed to load state:", err)
    }
    setHydrated(true)
  }, [])

  // Persist on every change
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (err) {
      console.log("[v0] Failed to persist state:", err)
    }
  }, [state, hydrated])

  const setProject = useCallback((p: Project) => {
    setState((s) => ({ ...s, project: p }))
  }, [])

  const updateProject = useCallback((patch: Partial<Project>) => {
    setState((s) => (s.project ? { ...s, project: { ...s.project, ...patch } } : s))
  }, [])

  const resetAll = useCallback(() => {
    setState(EMPTY_STATE)
  }, [])

  const importState = useCallback((s: AppState) => {
    setState(s)
  }, [])

  const addReference = useCallback(
    (r: any) => {
      const ref: Reference = { 
        ...r, 
        id: r.id || uid("ref"), 
        createdAt: r.createdAt || now(), 
        updatedAt: r.updatedAt || now() 
      }
      setState((s) => ({ ...s, references: [ref, ...s.references] }))
      return ref
    },
    [],
  )

  const addReferences = useCallback(
    (rs: any[]) => {
      const created = rs.map(
        (r) =>
          ({
            ...r,
            id: r.id || uid("ref"),
            createdAt: r.createdAt || now(),
            updatedAt: r.updatedAt || now(),
          }) as Reference,
      )
      setState((s) => ({ ...s, references: [...created, ...s.references] }))
      return created
    },
    [],
  )

  const updateReference = useCallback((id: string, patch: Partial<Reference>) => {
    setState((s) => ({
      ...s,
      references: s.references.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: now() } : r,
      ),
    }))
  }, [])

  const deleteReference = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      references: s.references.filter((r) => r.id !== id),
      extractions: s.extractions.filter((e) => e.referenceId !== id),
      themes: s.themes.map((t) => ({
        ...t,
        referenceIds: t.referenceIds.filter((rid) => rid !== id),
      })),
    }))
  }, [])

  const moveReference = useCallback<Ctx["moveReference"]>((id, stage, extra) => {
    setState((s) => ({
      ...s,
      references: s.references.map((r) =>
        r.id === id
          ? {
              ...r,
              stage,
              exclusionCategory:
                stage === "excluded" ? extra?.exclusionCategory : undefined,
              exclusionReason: stage === "excluded" ? extra?.exclusionReason : undefined,
              updatedAt: now(),
            }
          : r,
      ),
    }))
  }, [])

  const upsertExtraction = useCallback<Ctx["upsertExtraction"]>((referenceId, patch) => {
    let result: Extraction | null = null
    setState((s) => {
      const existing = s.extractions.find((e) => e.referenceId === referenceId)
      if (existing) {
        result = { ...existing, ...patch }
        return {
          ...s,
          extractions: s.extractions.map((e) => (e.referenceId === referenceId ? result! : e)),
        }
      }
      const created: Extraction = {
        id: uid("ext"),
        referenceId,
        objective: "",
        participantsContext: "",
        educationalLevel: "",
        country: "",
        ageRange: "",
        participantsN: "",
        duration: "",
        methodology: "",
        instruments: [],
        toolPlatform: "",
        gamificationElements: [],
        gamificationFramework: "",
        gamificationType: "",
        keyFindings: "",
        motivationImpact: "",
        performanceImpact: "",
        theoreticalFramework: "",
        limitations: "",
        pedagogicalImplications: "",
        synthesisNotes: "",
        personalRelevance: "",
        qualityScore: 0,
        ...patch,
      }
      result = created
      return { ...s, extractions: [...s.extractions, created] }
    })
    return result as unknown as Extraction
  }, [])

  const addTheme = useCallback<Ctx["addTheme"]>((t) => {
    const created: Theme = { ...t, id: uid("theme"), referenceIds: [] }
    setState((s) => ({ ...s, themes: [...s.themes, created] }))
    return created
  }, [])

  const updateTheme = useCallback((id: string, patch: Partial<Theme>) => {
    setState((s) => ({
      ...s,
      themes: s.themes.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }, [])

  const deleteTheme = useCallback((id: string) => {
    setState((s) => ({ ...s, themes: s.themes.filter((t) => t.id !== id) }))
  }, [])

  const toggleThemeReference = useCallback<Ctx["toggleThemeReference"]>((themeId, referenceId) => {
    setState((s) => ({
      ...s,
      themes: s.themes.map((t) =>
        t.id === themeId
          ? {
              ...t,
              referenceIds: t.referenceIds.includes(referenceId)
                ? t.referenceIds.filter((r) => r !== referenceId)
                : [...t.referenceIds, referenceId],
            }
          : t,
      ),
    }))
  }, [])

  const recordImport = useCallback<Ctx["recordImport"]>((b) => {
    const created: ImportBatch = { ...b, id: uid("imp") }
    setState((s) => ({ ...s, imports: [created, ...s.imports] }))
  }, [])

  const setPrismaItem = useCallback<Ctx["setPrismaItem"]>((id, patch) => {
    setState((s) =>
      s.project
        ? {
            ...s,
            project: {
              ...s.project,
              prismaChecklist: {
                ...s.project.prismaChecklist,
                [id]: Object.assign(
                  { checked: false, notes: "" },
                  s.project.prismaChecklist[id] || {},
                  patch
                ),
              },
            },
          }
        : s,
    )
  }, [])

  const setPrismaNotes = useCallback<Ctx["setPrismaNotes"]>((notes) => {
    setState((s) => (s.project ? { ...s, project: { ...s.project, prismaNotes: notes } } : s))
  }, [])

  const loadSample = useCallback(() => {
    // Placeholder for loading sample data
    console.log("Loading sample data...")
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      state,
      hydrated,
      setProject,
      updateProject,
      resetAll,
      importState,
      addReference,
      addReferences,
      updateReference,
      deleteReference,
      moveReference,
      upsertExtraction,
      addTheme,
      updateTheme,
      deleteTheme,
      toggleThemeReference,
      recordImport,
      setPrismaItem,
      setPrismaNotes,
      loadSample,
    }),
    [
      state,
      hydrated,
      setProject,
      updateProject,
      resetAll,
      importState,
      addReference,
      addReferences,
      updateReference,
      deleteReference,
      moveReference,
      upsertExtraction,
      addTheme,
      updateTheme,
      deleteTheme,
      toggleThemeReference,
      recordImport,
      setPrismaItem,
      setPrismaNotes,
      loadSample,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
