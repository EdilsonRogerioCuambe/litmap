import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"

// Function to generate a slug from the title
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    
    // Validate required fields
    if (!data.title || !data.researchQuestion || !data.area || !data.reviewType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate a unique slug
    let baseSlug = slugify(data.title)
    if (!baseSlug) baseSlug = 'project'
    
    let slug = baseSlug
    let counter = 1
    
    while (true) {
      const existing = await prisma.project.findUnique({ where: { slug } })
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create the project in the database
    const project = await prisma.project.create({
      data: {
        title: data.title,
        researchQuestion: data.researchQuestion,
        area: data.area,
        reviewType: data.reviewType,
        reviewFramework: data.reviewFramework || "Outro",
        slug: slug,
        userId: session.user.id,
        // Novos campos do onboarding
        databases: data.databases || [],
        yearFrom: data.yearFrom ? parseInt(data.yearFrom, 10) : null,
        yearTo: data.yearTo ? parseInt(data.yearTo, 10) : null,
        keywords: data.keywords || [],
        languages: data.languages || [],
        inclusionCriteria: data.inclusionCriteria || [],
        exclusionCriteria: data.exclusionCriteria || [],
        methodologicalNotes: data.methodologicalNotes || null,
        searchStrings: data.searchStrings || {},
      }
    })

    // Also add the user as an ADMIN member of the project
    await prisma.projectMember.create({
      data: {
        role: "ADMIN",
        projectId: project.id,
        userId: session.user.id
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("[PROJECTS_POST]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        _count: {
          select: { members: true, references: true }
        }
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("[PROJECTS_GET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
