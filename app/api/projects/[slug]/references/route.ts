import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params
    const body = await req.json()
    const { references } = body // Expected to be an array of references

    if (!Array.isArray(references)) {
      return NextResponse.json({ error: "References must be an array" }, { status: 400 })
    }

    // Validate project access
    const project = await prisma.project.findFirst({
      where: { 
        slug: slug,
        members: {
          some: { userId: session.user.id }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Create Import Batch record first
    const batch = await prisma.importBatch.create({
      data: {
        filename: (body.filenames || []).join(", ") || "manual_import",
        format: (body.filenames || []).map((f: string) => f.split(".").pop()).filter(Boolean).join(", ") || "unknown",
        imported: references.length,
        duplicates: body.duplicateCount || 0,
        errors: body.parseErrors || 0,
        projectId: project.id
      }
    })

    // Bulk create references
    // Prisma doesn't support createMany with nested relations easily if we had any,
    // but here references are a flat list linked to projectId.
    const createdReferences = await prisma.$transaction(
      references.map((ref: any) => 
        prisma.reference.create({
          data: {
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
          }
        })
      )
    )

    // Create Activity Log
    await prisma.projectLog.create({
      data: {
        action: "IMPORT_REFERENCES",
        details: `Importou ${createdReferences.length} referências via ficheiro`,
        projectId: project.id,
        userId: session.user.id,
        metadata: {
          count: createdReferences.length,
          filenames: body.filenames || []
        }
      }
    })

    revalidatePath(`/projects/${slug}`)
    revalidatePath(`/projects/${slug}/dashboard`)

    return NextResponse.json(createdReferences)
  } catch (error) {
    console.error("[REFERENCES_POST]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
