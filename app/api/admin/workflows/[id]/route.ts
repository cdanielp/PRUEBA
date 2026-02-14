import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH: Actualizar workflow (toggle active, editar campos)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!(await requireAdmin(session))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();

  // Solo permitir campos editables
  const allowedFields = ["name", "description", "deploymentId", "creditsCost", "category", "active", "inputSchema"];
  const updateData: Record<string, any> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) updateData[key] = body[key];
  }

  const workflow = await db.workflow.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ workflow });
}
