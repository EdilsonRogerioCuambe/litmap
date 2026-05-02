"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { Project, Reference } from "@/lib/types"
import { Prisma } from "@prisma/client"

export type UpdateProjectInput = {
  title?: string
  researchQuestion?: string
  area?: string
  reviewType?: string | null
  reviewFramework?: string | null
  databases?: string[]
  yearFrom?: number | null
  yearTo?: number | null
  keywords?: string[]
  languages?: string[]
  inclusionCriteria?: string[]
  exclusionCriteria?: string[]
  methodologicalNotes?: string | null
  searchStrings?: Record<string, string>
  exportPreferences?: Project["exportPreferences"]
  status?: string
  isFavorite?: boolean
}

export async function updateProjectAction(slug: string, data: UpdateProjectInput) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const existingProject = await prisma.project.findFirst({
    where: { 
      slug: slug,
      members: {
        some: { userId: session.user.id }
      }
    }
  })

  if (!existingProject) {
    throw new Error("Projeto não encontrado ou sem permissão")
  }

  // Only include fields that were explicitly sent - prevents one tab's save from wiping another tab's data
  const updateData: Prisma.ProjectUpdateInput = {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.researchQuestion !== undefined && { researchQuestion: data.researchQuestion }),
    ...(data.area !== undefined && { area: data.area }),
    ...(data.reviewType !== undefined && { reviewType: data.reviewType }),
    ...(data.reviewFramework !== undefined && { reviewFramework: data.reviewFramework }),
    ...(data.databases !== undefined && { databases: data.databases }),
    ...(data.yearFrom !== undefined && { yearFrom: data.yearFrom }),
    ...(data.yearTo !== undefined && { yearTo: data.yearTo }),
    ...(data.keywords !== undefined && { keywords: data.keywords }),
    ...(data.languages !== undefined && { languages: data.languages }),
    ...(data.inclusionCriteria !== undefined && { inclusionCriteria: data.inclusionCriteria }),
    ...(data.exclusionCriteria !== undefined && { exclusionCriteria: data.exclusionCriteria }),
    ...(data.methodologicalNotes !== undefined && { methodologicalNotes: data.methodologicalNotes }),
    ...(data.searchStrings !== undefined && { searchStrings: data.searchStrings as Prisma.InputJsonValue }),
    ...(data.exportPreferences !== undefined && { exportPreferences: data.exportPreferences as Prisma.InputJsonValue }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
  }

  const updatedProject = await prisma.project.update({
    where: { id: existingProject.id },
    data: updateData,
    include: {
      references: true,
      themes: true,
      members: {
        include: { user: true }
      },
      logs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50
      }
    }
  })

  try {
    const logMetadata = data as unknown as Prisma.InputJsonValue
    await prisma.projectLog.create({
      data: {
        action: data.inclusionCriteria || data.exclusionCriteria ? "UPDATE_CRITERIA" : 
                data.databases || data.searchStrings ? "UPDATE_STRATEGY" : "UPDATE_PROJECT",
        details: "Atualizou as definições do projeto",
        projectId: existingProject.id,
        userId: session.user.id,
        metadata: logMetadata
      }
    })
  } catch (logError) {
    console.error("[ACTION_LOG_ERROR]", logError)
  }

  revalidatePath(`/projects/${slug}`)
  revalidatePath(`/projects/${slug}/settings`)
  
  return updatedProject
}

export async function getProjectAction(slug: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const project = await prisma.project.findFirst({
    where: { 
      slug: slug,
      members: {
        some: { userId: session.user.id }
      }
    },
    include: {
      references: true,
      themes: true,
      members: {
        include: { user: true }
      },
      logs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50
      },
      importBatches: true
    }
  })

  if (!project) {
    throw new Error("Projeto não encontrado ou sem permissão")
  }

  return project
}

export async function importReferencesAction(slug: string, data: { references: any[], filenames?: string[], duplicateCount?: number, parseErrors?: number }) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const { references } = data

  if (!Array.isArray(references)) {
    throw new Error("References must be an array")
  }

  const project = await prisma.project.findFirst({
    where: { 
      slug: slug,
      members: {
        some: { userId: session.user.id }
      }
    }
  })

  if (!project) {
    throw new Error("Projeto não encontrado ou sem permissão")
  }

  const batch = await prisma.importBatch.create({
    data: {
      filename: (data.filenames || []).join(", ") || "manual_import",
      format: (data.filenames || []).map((f: string) => f.split(".").pop()).filter(Boolean).join(", ") || "unknown",
      imported: references.length,
      duplicates: data.duplicateCount || 0,
      errors: data.parseErrors || 0,
      projectId: project.id
    }
  })

  await prisma.reference.createMany({
    data: references.map((ref: any) => ({
      title: ref.title,
      authors: ref.authors,
      year: ref.year,
      journal: ref.journal || "",
      doi: ref.doi || "",
      url: ref.url || "",
      abstractNote: ref.abstractNote || "",
      keywords: ref.keywords || [],
      database: ref.database || "",
      type: ref.type || "Artigo",
      stage: ref.stage || "identification",
      importedFrom: ref.importedFrom || "",
      volume: ref.volume,
      issue: ref.issue,
      pages: ref.pages,
      publisher: ref.publisher,
      isbn: ref.isbn,
      language: ref.language,
      zoteroKey: ref.zoteroKey,
      issn: ref.issn,
      publicationDate: ref.publicationDate,
      dateAdded: ref.dateAdded ? new Date(ref.dateAdded) : null,
      dateModified: ref.dateModified ? new Date(ref.dateModified) : null,
      accessDate: ref.accessDate,
      numPages: ref.numPages,
      numberOfVolumes: ref.numberOfVolumes,
      journalAbbreviation: ref.journalAbbreviation,
      shortTitle: ref.shortTitle,
      series: ref.series,
      seriesNumber: ref.seriesNumber,
      seriesText: ref.seriesText,
      seriesTitle: ref.seriesTitle,
      place: ref.place,
      rights: ref.rights,
      archive: ref.archive,
      archiveLocation: ref.archiveLocation,
      callNumber: ref.callNumber,
      extra: ref.extra,
      fileAttachments: ref.fileAttachments,
      linkAttachments: ref.linkAttachments,
      editor: ref.editor,
      seriesEditor: ref.seriesEditor,
      translator: ref.translator,
      contributor: ref.contributor,
      bookAuthor: ref.bookAuthor,
      number: ref.number,
      edition: ref.edition,
      conferenceName: ref.conferenceName,
      meetingName: ref.meetingName,
      country: ref.country,
      programmingLanguage: ref.programmingLanguage,
      version: ref.version,

      // New Fields
      itemType: ref.itemType,
      libraryCatalog: ref.libraryCatalog,
      manualTags: ref.manualTags,
      automaticTags: ref.automaticTags,
      attorneyAgent: ref.attorneyAgent,
      castMember: ref.castMember,
      commenter: ref.commenter,
      composer: ref.composer,
      cosponsor: ref.cosponsor,
      counsel: ref.counsel,
      interviewer: ref.interviewer,
      producer: ref.producer,
      recipient: ref.recipient,
      reviewedAuthor: ref.reviewedAuthor,
      scriptwriter: ref.scriptwriter,
      wordsBy: ref.wordsBy,
      guest: ref.guest,
      runningTime: ref.runningTime,
      scale: ref.scale,
      medium: ref.medium,
      artworkSize: ref.artworkSize,
      filingDate: ref.filingDate,
      applicationNumber: ref.applicationNumber,
      assignee: ref.assignee,
      issuingAuthority: ref.issuingAuthority,
      court: ref.court,
      bibReferences: ref.bibReferences,
      reporter: ref.reporter,
      legalStatus: ref.legalStatus,
      priorityNumbers: ref.priorityNumbers,
      system: ref.system,
      code: ref.code,
      codeNumber: ref.codeNumber,
      section: ref.section,
      session: ref.session,
      committee: ref.committee,
      history: ref.history,
      legislativeBody: ref.legislativeBody,

      bibliographicExtras: ref.bibliographicExtras || {},
      projectId: project.id,
      importBatchId: batch.id
    }))
  })

  const createdReferences = await prisma.reference.findMany({
    where: { importBatchId: batch.id }
  })

  await prisma.projectLog.create({
    data: {
      action: "IMPORT_REFERENCES",
      details: `Importou ${createdReferences.length} referências via ficheiro`,
      projectId: project.id,
      userId: session.user.id,
      metadata: {
        count: createdReferences.length,
        filenames: data.filenames || []
      }
    }
  })

  revalidatePath(`/projects/${slug}`)
  revalidatePath(`/projects/${slug}/import`)
  revalidatePath(`/projects/${slug}/dashboard`)

  return createdReferences as any as Reference[]
}

export async function deleteImportBatchAction(slug: string, batchId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const project = await prisma.project.findFirst({
    where: { 
      slug: slug,
      members: {
        some: { userId: session.user.id }
      }
    }
  })

  if (!project) {
    throw new Error("Projeto não encontrado ou sem permissão")
  }

  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId }
  })

  if (!batch || batch.projectId !== project.id) {
    throw new Error("Lote não encontrado")
  }

  // Use a transaction to delete all references associated with this batch AND the batch itself.
  await prisma.$transaction([
    prisma.reference.deleteMany({
      where: { importBatchId: batchId }
    }),
    prisma.importBatch.delete({
      where: { id: batchId }
    })
  ])

  await prisma.projectLog.create({
    data: {
      action: "DELETE_IMPORT",
      details: `Removeu o lote de importação (${batch.filename}) e as suas referências`,
      projectId: project.id,
      userId: session.user.id
    }
  })

  revalidatePath(`/projects/${slug}`)
  revalidatePath(`/projects/${slug}/import`)
  revalidatePath(`/projects/${slug}/dashboard`)

  return true
}
