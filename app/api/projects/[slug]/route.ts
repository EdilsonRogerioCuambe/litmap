import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params

    const project = await prisma.project.findFirst({
      where: { 
        slug: slug,
        members: {
          some: {
            userId: session.user.id
          }
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
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("[PROJECT_GET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params
    const body = await req.json()

    // Validate access
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

    // Update project - mapped all possible fields
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        researchQuestion: body.researchQuestion !== undefined ? body.researchQuestion : undefined,
        area: body.area !== undefined ? body.area : undefined,
        reviewType: body.reviewType !== undefined ? body.reviewType : undefined,
        reviewFramework: body.reviewFramework !== undefined ? body.reviewFramework : undefined,
        databases: body.databases !== undefined ? body.databases : undefined,
        yearFrom: body.yearFrom !== undefined ? body.yearFrom : undefined,
        yearTo: body.yearTo !== undefined ? body.yearTo : undefined,
        keywords: body.keywords !== undefined ? body.keywords : undefined,
        languages: body.languages !== undefined ? body.languages : undefined,
        inclusionCriteria: body.inclusionCriteria !== undefined ? body.inclusionCriteria : undefined,
        exclusionCriteria: body.exclusionCriteria !== undefined ? body.exclusionCriteria : undefined,
        methodologicalNotes: body.methodologicalNotes !== undefined ? body.methodologicalNotes : undefined,
        searchStrings: body.searchStrings !== undefined ? body.searchStrings : undefined,
        exportPreferences: body.exportPreferences !== undefined ? body.exportPreferences : undefined,
        status: body.status !== undefined ? body.status : undefined,
        isFavorite: body.isFavorite !== undefined ? body.isFavorite : undefined,
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
        }
      }
    })

    // Revalidar caminhos para atualização instantânea (Next.js Cache)
    revalidatePath(`/projects/${slug}`)
    revalidatePath(`/projects/${slug}/settings`)
    revalidatePath(`/projects/${slug}/dashboard`)

    // Criar Log de Atividade
    try {
      let action = "UPDATE_PROJECT"
      let details = "Atualizou as definições do projeto"

      if (body.inclusionCriteria || body.exclusionCriteria) {
        action = "UPDATE_CRITERIA"
        details = "Atualizou os critérios de elegibilidade"
      } else if (body.databases || body.searchStrings) {
        action = "UPDATE_STRATEGY"
        details = "Atualizou a estratégia de pesquisa"
      } else if (body.exportPreferences) {
        action = "UPDATE_EXPORT"
        details = "Atualizou as preferências de exportação"
      } else if (body.title || body.area || body.reviewType) {
        action = "UPDATE_IDENTITY"
        details = `Atualizou a identidade do projeto: ${body.title || project.title}`
      }

      await prisma.projectLog.create({
        data: {
          action,
          details,
          projectId: project.id,
          userId: session.user.id,
          metadata: body
        }
      })
    } catch (logError) {
      console.error("[PROJECT_LOG_ERROR]", logError)
    }

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("[PROJECT_PATCH]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
