import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { adminAdjustCredits } from "@/lib/credits";
import { z } from "zod";

const schema = z.object({
  amount: z.number().int().min(-10000).max(10000),
  description: z.string().min(1).max(200),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!(await requireAdmin(session))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { amount, description } = parsed.data;
    const adminEmail = session!.user!.email;
    const fullDesc = `[Admin: ${adminEmail}] ${description}`;

    const result = await adminAdjustCredits(params.id, amount, fullDesc);
    return NextResponse.json({ success: true, newBalance: result.newBalance });
  } catch (error: any) {
    if (error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "El usuario no tiene suficientes créditos" }, { status: 400 });
    }
    console.error("Error admin adjust:", error);
    return NextResponse.json({ error: "Error al ajustar créditos" }, { status: 500 });
  }
}
