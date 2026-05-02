import type { Reference, ReferenceType } from "./types"

export type ParsedReference = Omit<Reference, "id" | "createdAt" | "updatedAt"> & {
  __duplicate?: boolean
}

const TYPE_MAP: Record<string, ReferenceType> = {
  article: "Artigo",
  inproceedings: "Actas de Conferência",
  conference: "Actas de Conferência",
  proceedings: "Actas de Conferência",
  book: "Livro",
  inbook: "Capítulo de Livro",
  incollection: "Capítulo de Livro",
  thesis: "Tese",
  phdthesis: "Tese",
  mastersthesis: "Tese",
  techreport: "Relatório",
  report: "Relatório",
}

function blankRef(): ParsedReference {
  return {
    title: "",
    authors: [],
    year: null,
    journal: "",
    doi: "",
    url: "",
    abstractNote: "",
    keywords: [],
    database: "",
    type: "Artigo",
    stage: "identification",
    bibliographicExtras: {},
  }
}

function splitAuthors(s: string): string[] {
  if (!s) return []
  // BibTeX uses " and "; RIS sometimes ";"
  return s
    .split(/\s+and\s+|;/i)
    .map((x) => x.trim())
    .filter(Boolean)
}

function splitKeywords(s: string): string[] {
  if (!s) return []
  return s
    .split(/[;,]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

/* ----------------------------- BibTeX ------------------------------- */
export function parseBibtex(text: string): ParsedReference[] {
  const refs: ParsedReference[] = []
  const entries = text.split(/^@/m).slice(1)
  for (const entry of entries) {
    const headerMatch = entry.match(/^(\w+)\s*\{([^,]*),/)
    if (!headerMatch) continue
    const type = headerMatch[1].toLowerCase()
    const ref = blankRef()
    ref.type = TYPE_MAP[type] ?? "Artigo"

    const body = entry.slice(headerMatch[0].length, entry.lastIndexOf("}"))
    // Match field = {value} or field = "value"
    const fieldRegex = /(\w+)\s*=\s*(\{((?:[^{}]|\{[^{}]*\})*)\}|"([^"]*)")/g
    let m: RegExpExecArray | null
    while ((m = fieldRegex.exec(body))) {
      const key = m[1].toLowerCase()
      const val = (m[3] ?? m[4] ?? "").replace(/\s+/g, " ").trim()
      switch (key) {
        case "title":
          ref.title = val.replace(/[{}]/g, "")
          break
        case "author":
          ref.authors = splitAuthors(val)
          break
        case "year":
          ref.year = parseInt(val, 10) || null
          break
        case "journal":
        case "booktitle":
          ref.journal = val
          break
        case "doi":
          ref.doi = val.replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "")
          break
        case "url":
          ref.url = val
          break
        case "abstractNote":
          ref.abstractNote = val
          break
        case "keywords":
          ref.keywords = splitKeywords(val)
          break
        case "volume":
          ref.volume = val
          break
        case "number":
        case "issue":
          ref.issue = val
          break
        case "pages":
          ref.pages = val
          break
        case "publisher":
          ref.publisher = val
          break
        case "isbn":
          ref.isbn = val
          break
        case "language":
          ref.language = val
          break
        default:
          if (ref.bibliographicExtras) {
            ref.bibliographicExtras[key] = val
          }
          break
      }
    }
    
    // Auto-detect database if not set
    if (!ref.database) {
      if (ref.doi?.startsWith("10.1145/")) ref.database = "ACM Digital Library"
      else if (ref.publisher?.toLowerCase().includes("acm")) ref.database = "ACM Digital Library"
      else if (ref.publisher?.toLowerCase().includes("ieee")) ref.database = "IEEE Xplore"
      else if (ref.publisher?.toLowerCase().includes("sciencedirect") || ref.publisher?.toLowerCase().includes("elsevier")) ref.database = "Scopus"
    }

    if (ref.title) refs.push(ref)
  }
  return refs
}

/* ------------------------------- RIS -------------------------------- */
const RIS_TYPE_MAP: Record<string, ReferenceType> = {
  JOUR: "Artigo",
  CONF: "Actas de Conferência",
  CPAPER: "Actas de Conferência",
  THES: "Tese",
  BOOK: "Livro",
  CHAP: "Capítulo de Livro",
  RPRT: "Relatório",
}

export function parseRIS(text: string): ParsedReference[] {
  const refs: ParsedReference[] = []
  // Split by ER tag
  const blocks = text.split(/^ER\s*-.*$/m)
  for (const block of blocks) {
    const lines = block.split(/\r?\n/)
    let current: ParsedReference | null = null
    for (const line of lines) {
      const m = line.match(/^([A-Z0-9]{2})\s*-\s*(.*)$/)
      if (!m) continue
      const tag = m[1]
      const value = m[2].trim()
      if (tag === "TY") {
        current = blankRef()
        current.type = RIS_TYPE_MAP[value] ?? "Artigo"
        continue
      }
      if (!current) {
        current = blankRef()
      }
      switch (tag) {
        case "TI":
        case "T1":
          current.title = current.title ? current.title + " " + value : value
          break
        case "AU":
        case "A1":
          if (value) current.authors.push(value)
          break
        case "PY":
        case "Y1": {
          const yearMatch = value.match(/(\d{4})/)
          if (yearMatch) current.year = parseInt(yearMatch[1], 10)
          break
        }
        case "JO":
        case "JF":
        case "T2":
          current.journal = current.journal || value
          break
        case "DO":
          current.doi = value.replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "")
          break
        case "UR":
          current.url = current.url || value
          break
        case "AB":
        case "N2":
          current.abstractNote = current.abstractNote ? current.abstractNote + " " + value : value
          break
        case "KW":
          if (value) current.keywords.push(value)
          break
        default:
          if (current.bibliographicExtras) {
            current.bibliographicExtras[tag] = value
          }
          break
      }
    }
    if (current && current.title) refs.push(current)
  }
  return refs
}

/* ------------------------------ NBIB -------------------------------- */
export function parseNBIB(text: string): ParsedReference[] {
  // NBIB uses 4-character tags like "TI  - " on continuation lines without tag
  const refs: ParsedReference[] = []
  const blocks = text.split(/\n(?=PMID-\s)/)
  for (const block of blocks) {
    const lines = block.split(/\r?\n/)
    const current = blankRef()
    let lastKey: string | null = null
    const acc: Record<string, string[]> = {}
    for (const line of lines) {
      const m = line.match(/^([A-Z]{2,4})\s*-\s(.*)$/)
      if (m) {
        lastKey = m[1]
        acc[lastKey] = acc[lastKey] || []
        acc[lastKey].push(m[2])
      } else if (line.startsWith("      ") && lastKey && acc[lastKey]) {
        acc[lastKey][acc[lastKey].length - 1] += " " + line.trim()
      }
    }
    current.title = (acc.TI || []).join(" ").trim()
    current.authors = acc.AU || acc.FAU || []
    if (acc.DP && acc.DP[0]) {
      const ym = acc.DP[0].match(/(\d{4})/)
      if (ym) current.year = parseInt(ym[1], 10)
    }
    current.journal = (acc.TA || acc.JT || [])[0] || ""
    current.doi = (acc.LID || []).find((v) => /\[doi\]/i.test(v))?.replace(/\s*\[doi\].*$/i, "") || ""
    current.abstractNote = (acc.AB || []).join(" ").trim()
    current.keywords = acc.MH || acc.OT || []
    current.type = "Artigo"
    
    // Extra tags
    Object.entries(acc).forEach(([k, v]) => {
      const known = ["TI", "AU", "FAU", "DP", "TA", "JT", "LID", "AB", "MH", "OT"]
      if (!known.includes(k) && current.bibliographicExtras) {
        current.bibliographicExtras[k] = v.join(" ").trim()
      }
    })

    if (current.title) refs.push(current)
  }
  return refs
}

/* ------------------------------ CSV/TSV ------------------------------ */

const HEADER_MAP: Record<string, keyof ParsedReference> = {
  title: "title",
  título: "title",
  titulo: "title",
  "document title": "title",
  author: "authors",
  authors: "authors",
  autor: "authors",
  autores: "authors",
  year: "year",
  ano: "year",
  "publication year": "year",
  "year of publication": "year",
  journal: "journal",
  source: "journal",
  fonte: "journal",
  "source title": "journal",
  "journal title": "journal",
  "publication title": "journal",
  publisher: "journal",
  doi: "doi",
  url: "url",
  link: "url",
  "pdf link": "url",
  abstract: "abstractNote",
  "abstract note": "abstractNote",
  resumo: "abstractNote",
  keywords: "keywords",
  "palavras-chave": "keywords",
  "author keywords": "keywords",
  "index keywords": "keywords",
  "ieee terms": "keywords",
  volume: "volume",
  number: "issue",
  issue: "issue",
  pages: "pages",
  isbn: "isbn",
  isbns: "isbn",
  language: "language",
  língua: "language",
  lingua: "language",

  // Zotero Specific Headers
  key: "zoteroKey",
  issn: "issn",
  date: "publicationDate",
  "date added": "dateAdded",
  "date modified": "dateModified",
  "access date": "accessDate",
  "num pages": "numPages",
  "number of volumes": "numberOfVolumes",
  "journal abbreviation": "journalAbbreviation",
  "short title": "shortTitle",
  series: "series",
  "series number": "seriesNumber",
  "series text": "seriesText",
  "series title": "seriesTitle",
  place: "place",
  rights: "rights",
  archive: "archive",
  "archive location": "archiveLocation",
  "call number": "callNumber",
  extra: "extra",
  "file attachments": "fileAttachments",
  "link attachments": "linkAttachments",
  editor: "editor",
  "series editor": "seriesEditor",
  translator: "translator",
  contributor: "contributor",
  "book author": "bookAuthor",
  edition: "edition",
  "conference name": "conferenceName",
  "meeting name": "meetingName",
  country: "country",
  "programming language": "programmingLanguage",
  version: "version",

  // Additional Zotero Headers
  "item type": "itemType",
  "library catalog": "libraryCatalog",
  "manual tags": "manualTags",
  "automatic tags": "automaticTags",
  "attorney agent": "attorneyAgent",
  "cast member": "castMember",
  commenter: "commenter",
  composer: "composer",
  cosponsor: "cosponsor",
  counsel: "counsel",
  interviewer: "interviewer",
  producer: "producer",
  recipient: "recipient",
  "reviewed author": "reviewedAuthor",
  scriptwriter: "scriptwriter",
  "words by": "wordsBy",
  guest: "guest",
  "running time": "runningTime",
  scale: "scale",
  medium: "medium",
  "artwork size": "artworkSize",
  "filing date": "filingDate",
  "application number": "applicationNumber",
  assignee: "assignee",
  "issuing authority": "issuingAuthority",
  court: "court",
  references: "bibReferences",
  reporter: "reporter",
  "legal status": "legalStatus",
  "priority numbers": "priorityNumbers",
  system: "system",
  code: "code",
  "code number": "codeNumber",
  section: "section",
  session: "session",
  committee: "committee",
  history: "history",
  "legislative body": "legislativeBody",
}

export function parseCSV(text: string): ParsedReference[] {
  // 1. Detect separator from first line
  const firstLineEnd = text.indexOf("\n")
  const firstLine = firstLineEnd === -1 ? text : text.substring(0, firstLineEnd)
  
  let sep: "," | "\t" | ";" = ","
  if (firstLine.includes("\t")) sep = "\t"
  else if (firstLine.includes(";")) {
    const commas = (firstLine.match(/,/g) || []).length
    const semis = (firstLine.match(/;/g) || []).length
    if (semis >= commas) sep = ";"
  }

  // 2. Robust CSV Parser (handles multi-line cells)
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ""
  let inQuotes = false
  
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const nextCh = text[i+1]
    
    if (inQuotes) {
      if (ch === '"' && nextCh === '"') {
        currentCell += '"'
        i++ // skip next quote
      } else if (ch === '"') {
        inQuotes = false
      } else {
        currentCell += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === sep) {
        currentRow.push(currentCell.trim())
        currentCell = ""
      } else if (ch === "\n" || (ch === "\r" && nextCh === "\n")) {
        currentRow.push(currentCell.trim())
        if (currentRow.some(c => c !== "")) {
           rows.push(currentRow)
        }
        currentRow = []
        currentCell = ""
        if (ch === "\r") i++ // skip \n
      } else {
        currentCell += ch
      }
    }
  }
  // push last row if exists
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    rows.push(currentRow)
  }

  if (rows.length < 2) return []

  const header = rows[0].map(h => h.toLowerCase().replace(/^"|"$/g, "").trim())
  const refs: ParsedReference[] = []
  
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i]
    const ref = blankRef()
    let startPage = ""
    let endPage = ""
    
    for (let j = 0; j < header.length; j++) {
      const headerKey = header[j]
      const key = HEADER_MAP[headerKey]
      const value = (cells[j] || "").replace(/^"|"$/g, "").trim()
      
      // Handle Start/End pages specifically
      if (headerKey === "start page") {
        startPage = value
        continue
      }
      if (headerKey === "end page") {
        endPage = value
        continue
      }

      if (!key) {
        if (ref.bibliographicExtras) {
          ref.bibliographicExtras[headerKey] = value
        }
        continue
      }
      
      switch (key) {
        case "title":
          ref.title = value
          break
        case "authors":
          ref.authors = splitAuthors(value)
          break
        case "year":
          ref.year = parseInt(value, 10) || null
          break
        case "journal":
          ref.journal = value
          break
        case "doi":
          ref.doi = value.replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "")
          break
        case "url":
          ref.url = value
          break
        case "abstractNote":
          ref.abstractNote = value
          break
        case "keywords":
          // merge if already has keywords
          const news = splitKeywords(value)
          ref.keywords = Array.from(new Set([...ref.keywords, ...news]))
          break
        default:
          // @ts-ignore
          ref[key] = value
          break
      }
    }
    
    // Combine pages
    if (startPage || endPage) {
      ref.pages = startPage && endPage ? `${startPage}-${endPage}` : (startPage || endPage)
    }

    if (ref.title) refs.push(ref)
  }
  return refs
}

/* ------------------------------- XML -------------------------------- */
export function parseXML(text: string): ParsedReference[] {
  if (typeof window === "undefined") return []
  const refs: ParsedReference[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, "application/xml")

  // PubMed: <PubmedArticle>
  const articles = doc.querySelectorAll("PubmedArticle, article, record")
  articles.forEach((node) => {
    const ref = blankRef()
    const t =
      node.querySelector("ArticleTitle, title, dc\\:title")?.textContent ||
      node.querySelector("ArticleTitle")?.textContent ||
      ""
    ref.title = t.trim()
    const authorNodes = node.querySelectorAll(
      "Author, author, AuthorName, dc\\:creator",
    )
    authorNodes.forEach((a) => {
      const last = a.querySelector("LastName")?.textContent
      const fore = a.querySelector("ForeName, FirstName, Initials")?.textContent
      if (last) {
        ref.authors.push(`${last}${fore ? ", " + fore : ""}`)
      } else if (a.textContent) {
        ref.authors.push(a.textContent.trim())
      }
    })
    const year = node.querySelector("PubDate Year, Year, pub-year")?.textContent
    ref.year = year ? parseInt(year, 10) : null
    ref.journal =
      node.querySelector("Journal Title, ISOAbbreviation, source")?.textContent || ""
    const doi = Array.from(node.querySelectorAll("ArticleId, ELocationID")).find(
      (n) => (n.getAttribute("IdType") || n.getAttribute("EIdType")) === "doi",
    )?.textContent
    ref.doi = doi || ""
    ref.abstractNote = node.querySelector("AbstractText, abstract")?.textContent || ""
    ref.type = "Artigo"
    if (ref.title) refs.push(ref)
  })
  return refs
}

/* ----------------------------- Dispatch ----------------------------- */
export function parseFile(filename: string, text: string): ParsedReference[] {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  switch (ext) {
    case "bib":
      return parseBibtex(text)
    case "ris":
      return parseRIS(text)
    case "nbib":
      return parseNBIB(text)
    case "xml":
      return parseXML(text)
    case "csv":
    case "tsv":
      return parseCSV(text)
    case "txt":
      // Try auto-detect: tagged formats first
      if (/^TY\s*-/m.test(text)) return parseRIS(text)
      if (/^@\w+\s*\{/m.test(text)) return parseBibtex(text)
      if (/^PMID\s*-/m.test(text)) return parseNBIB(text)
      return parseCSV(text)
    default:
      return []
  }
}

/* --------------------------- Duplicates ----------------------------- */
/* --------------------------- Duplicates ----------------------------- */

/**
 * Jaro-Winkler Similarity Algorithm
 * Returns a score between 0 and 1
 */
export function jaroWinkler(s1: string, s2: string): number {
  if (s1.length === 0 || s2.length === 0) return 0
  if (s1 === s2) return 1

  const m = 0
  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1
  const s1Matches = new Array(s1.length).fill(false)
  const s2Matches = new Array(s2.length).fill(false)

  let matches = 0
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow)
    const end = Math.min(i + matchWindow + 1, s2.length)
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true
        s2Matches[j] = true
        matches++
        break
      }
    }
  }

  if (matches === 0) return 0

  let transpositions = 0
  let k = 0
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++
      if (s1[i] !== s2[k]) transpositions++
      k++
    }
  }

  const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3
  const prefixLength = 0
  const p = 0.1
  
  // Winkler adjustment
  let prefix = 0
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++
    else break
  }

  return jaro + prefix * p * (1 - jaro)
}

const STOPWORDS = new Set([
  "the", "a", "an", "of", "in", "and", "or", "for", "to", "with", "on", "at", "by", "from", "up", "about", "into", "over", "after",
  "o", "a", "os", "as", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas", "e", "ou", "para", "com", "por", "sobre"
])

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word && !STOPWORDS.has(word))
    .join(" ")
    .trim()
}

export function markDuplicates(
  parsed: ParsedReference[],
  existing: { title: string; doi: string | null }[] = [],
): ParsedReference[] {
  const seenDois = new Set(existing.filter((e) => e.doi).map((e) => (e.doi as string).toLowerCase().trim()))
  const seenTitlesNormalized = new Set(existing.map((e) => normalize(e.title)))
  
  // For fuzzy matching
  const fuzzyTitles = existing.length < 5000 ? existing.map(e => ({ original: e.title, normalized: normalize(e.title) })) : []

  const out: ParsedReference[] = []
  
  for (const r of parsed) {
    const normalizedTitle = normalize(r.title)
    const doiLower = r.doi?.toLowerCase().trim()

    // 1. Check exact DOI
    const dupByDoi = !!doiLower && seenDois.has(doiLower)
    
    // 2. Check exact normalized title
    const dupByExactTitle = !dupByDoi && seenTitlesNormalized.has(normalizedTitle)

    // 3. Check fuzzy similarity (Jaro-Winkler > 0.85)
    let dupByFuzzy = false
    if (!dupByDoi && !dupByExactTitle && fuzzyTitles.length > 0 && fuzzyTitles.length < 1000) {
      dupByFuzzy = fuzzyTitles.some(t => jaroWinkler(t.normalized, normalizedTitle) > 0.85)
    }

    // 4. Check duplicate within the new batch
    const dupInBatch = !dupByDoi && !dupByExactTitle && !dupByFuzzy
      ? out.some(
          (o) =>
            (o.doi && r.doi && o.doi.toLowerCase().trim() === r.doi.toLowerCase().trim()) ||
            normalize(o.title) === normalizedTitle
        )
      : false

    const isDuplicate = dupByDoi || dupByExactTitle || dupByFuzzy || dupInBatch
    out.push({ ...r, __duplicate: isDuplicate })

    // Update trackers for next iterations in the same batch
    if (doiLower) seenDois.add(doiLower)
    seenTitlesNormalized.add(normalizedTitle)
    if (fuzzyTitles.length < 1000) {
      fuzzyTitles.push({ original: r.title, normalized: normalizedTitle })
    }
  }
  return out
}
