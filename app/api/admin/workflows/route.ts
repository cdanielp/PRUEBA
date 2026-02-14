import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// GET: Listar todos los workflows (incluidos inactivos)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(await requireAdmin(session))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const workflows = await db.workflow.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ workflows });
}

// POST: Crear nuevo workflow
const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  deploymentId: z.string().min(1),
  creditsCost: z.number().int().min(1).max(100),
  category: z.string().max(50).optional(),
  inputSchema: z.any().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(await requireAdmin(session))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const workflow = await db.workflow.create({ data: parsed.data });
  return NextResponse.json({ workflow });
}
