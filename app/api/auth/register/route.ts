import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { addWelcomeCredits } from "@/lib/credits";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const emailLower = email.toLowerCase();

    const existing = await db.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { name, email: emailLower, hashedPassword: hashed, creditsBalance: 0 },
    });

    // Créditos de bienvenida (5)
    await addWelcomeCredits(user.id);

    return NextResponse.json({
      success: true,
      message: "Cuenta creada. Tienes 5 créditos gratis.",
    });
  } catch (error: any) {
    console.error("Error en registro:", error);
    return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 });
  }
}
