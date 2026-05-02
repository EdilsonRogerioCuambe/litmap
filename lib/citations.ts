import type { Reference } from "./types"

function authorsAPA(authors: string[]): string {
  if (authors.length === 0) return "—"
  if (authors.length === 1) return authors[0]
  if (authors.length === 2) return `${authors[0]}, & ${authors[1]}`
  if (authors.length <= 20) {
    return authors.slice(0, -1).join(", ") + ", & " + authors[authors.length - 1]
  }
  return authors.slice(0, 19).join(", ") + ", ... " + authors[authors.length - 1]
}

function authorsVancouver(authors: string[]): string {
  if (authors.length === 0) return "—"
  const formatted = authors.slice(0, 6).map((a) => {
    // Last, First Middle  → Last FM
    const [last, rest] = a.split(",").map((x) => x.trim())
    if (!rest) return last
    const initials = rest
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase())
      .join("")
    return `${last} ${initials}`
  })
  return formatted.join(", ") + (authors.length > 6 ? ", et al." : "")
}

function authorsABNT(authors: string[]): string {
  if (authors.length === 0) return "—"
  return authors
    .map((a) => {
      const [last, rest] = a.split(",").map((x) => x.trim())
      if (!rest) return last.toUpperCase()
      return `${last.toUpperCase()}, ${rest}`
    })
    .join("; ")
}

export function citeAPA(r: Reference): string {
  const authors = authorsAPA(r.authors)
  const year = r.year ?? "s.d."
  const title = r.title
  const journal = r.journal ? `<i>${r.journal}</i>` : ""
  const doi = r.doi ? `https://doi.org/${r.doi}` : r.url || ""
  return `${authors} (${year}). ${title}.${journal ? " " + journal + "." : ""}${doi ? " " + doi : ""}`
}

export function citeVancouver(r: Reference): string {
  const authors = authorsVancouver(r.authors)
  const year = r.year ?? "s.d."
  return `${authors}. ${r.title}. ${r.journal}. ${year}.${r.doi ? " doi: " + r.doi : ""}`
}

export function citeABNT(r: Reference): string {
  const authors = authorsABNT(r.authors)
  const year = r.year ?? "s.d."
  return `${authors}. ${r.title}. <b>${r.journal}</b>, ${year}.${r.doi ? " DOI: " + r.doi + "." : ""}`
}

export function citePlain(r: Reference): string {
  return `${r.authors.join(", ") || "—"} (${r.year ?? "s.d."}). ${r.title}. ${r.journal}.${r.doi ? " DOI: " + r.doi : ""}`
}

export function toBibtex(r: Reference): string {
  const safeKey = (r.authors[0]?.split(",")[0] || "ref")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
  const key = `${safeKey}${r.year || ""}`
  const typeMap: Record<string, string> = {
    Artigo: "article",
    "Actas de Conferência": "inproceedings",
    Tese: "phdthesis",
    Livro: "book",
    "Capítulo de Livro": "incollection",
    Relatório: "techreport",
    Outro: "misc",
  }
  const t = typeMap[r.type] || "misc"
  const fields: string[] = [
    `  title = {${r.title}}`,
    `  author = {${r.authors.join(" and ")}}`,
  ]
  if (r.year) fields.push(`  year = {${r.year}}`)
  if (r.journal) fields.push(`  journal = {${r.journal}}`)
  if (r.doi) fields.push(`  doi = {${r.doi}}`)
  if (r.url) fields.push(`  url = {${r.url}}`)
  if (r.abstractNote) fields.push(`  abstract = {${r.abstractNote.replace(/[{}]/g, "")}}`)
  if (r.keywords.length) fields.push(`  keywords = {${r.keywords.join(", ")}}`)
  return `@${t}{${key},\n${fields.join(",\n")}\n}`
}

export function toRIS(r: Reference): string {
  const typeMap: Record<string, string> = {
    Artigo: "JOUR",
    "Actas de Conferência": "CONF",
    Tese: "THES",
    Livro: "BOOK",
    "Capítulo de Livro": "CHAP",
    Relatório: "RPRT",
    Outro: "GEN",
  }
  const lines: string[] = [`TY  - ${typeMap[r.type] || "GEN"}`]
  lines.push(`TI  - ${r.title}`)
  r.authors.forEach((a) => lines.push(`AU  - ${a}`))
  if (r.year) lines.push(`PY  - ${r.year}`)
  if (r.journal) lines.push(`JO  - ${r.journal}`)
  if (r.doi) lines.push(`DO  - ${r.doi}`)
  if (r.url) lines.push(`UR  - ${r.url}`)
  if (r.abstractNote) lines.push(`AB  - ${r.abstractNote}`)
  r.keywords.forEach((k) => lines.push(`KW  - ${k}`))
  lines.push("ER  - ")
  return lines.join("\n")
}

export function downloadFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
