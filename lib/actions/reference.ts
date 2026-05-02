"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

export async function addReferenceAction(slug: string, data: any) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const project = await prisma.project.findFirst({
    where: { 
      slug: slug,
      members: { some: { userId: session.user.id } }
    }
  })

  if (!project) {
    throw new Error("Projeto não encontrado ou sem permissão")
  }

  const reference = await prisma.reference.create({
    data: {
      ...data,
      projectId: project.id
    }
  })

  await prisma.projectLog.create({
    data: {
      action: "ADD_REFERENCE",
      details: `Adicionou manualmente a referência "${reference.title}"`,
      projectId: project.id,
      userId: session.user.id
    }
  })

  revalidatePath(`/projects/${slug}`)
  revalidatePath(`/projects/${slug}/references`)
  revalidatePath(`/projects/${slug}/dashboard`)

  return reference
}

export async function updateReferenceAction(slug: string, referenceId: string, data: any) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const project = await prisma.project.findFirst({
    where: { 
      slug: slug,
      members: { some: { userId: session.user.id } }
    }
  })

  if (!project) {
    throw new Error("Projeto não encontrado ou sem permissão")
  }

  const reference = await prisma.reference.update({
    where: { id: referenceId, projectId: project.id },
    data
  })

  // Optionally log the edit
  // await prisma.projectLog.create({
  //   data: {
  //     action: "UPDATE_REFERENCE",
  //     details: `Editou a referência "${reference.title}"`,
  //     projectId: project.id,
  //     userId: session.user.id
  //   }
  // })

  revalidatePath(`/projects/${slug}`)
  revalidatePath(`/projects/${slug}/references`)
  revalidatePath(`/projects/${slug}/kanban`)

  return reference
}

export async function moveReferenceAction(slug: string, referenceId: string, stage: string, extra?: { exclusionCategory?: string, exclusionReason?: string }) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const project = await prisma.project.findFirst({
    where: { 
      slug: slug,
      members: { some: { userId: session.user.id } }
    }
  })

  if (!project) {
    throw new Error("Projeto não encontrado ou sem permissão")
  }

  const reference = await prisma.reference.update({
    where: { id: referenceId, projectId: project.id },
    data: {
      stage,
      exclusionCategory: stage === "excluded" ? extra?.exclusionCategory : null,
      exclusionReason: stage === "excluded" ? extra?.exclusionReason : null,
    }
  })

  revalidatePath(`/projects/${slug}`)
  revalidatePath(`/projects/${slug}/references`)
  revalidatePath(`/projects/${slug}/kanban`)
  revalidatePath(`/projects/${slug}/dashboard`)

  return reference
}

export async function deleteReferenceAction(slug: string, referenceId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const project = await prisma.project.findFirst({
    where: { 
      slug: slug,
      members: { some: { userId: session.user.id } }
    }
  })

  if (!project) {
    throw new Error("Projeto não encontrado ou sem permissão")
  }

  const reference = await prisma.reference.delete({
    where: { id: referenceId, projectId: project.id }
  })

  await prisma.projectLog.create({
    data: {
      action: "DELETE_REFERENCE",
      details: `Removeu a referência "${reference.title}" permanentemente`,
      projectId: project.id,
      userId: session.user.id
    }
  })

  revalidatePath(`/projects/${slug}`)
  revalidatePath(`/projects/${slug}/references`)
  revalidatePath(`/projects/${slug}/kanban`)
  revalidatePath(`/projects/${slug}/dashboard`)

  return true
}
