import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(await requireAdmin(session))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const users = await db.user.findMany({
    where: search
      ? { OR: [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ]}
      : {},
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, name: true, email: true, role: true,
      creditsBalance: true, createdAt: true,
      _count: { select: { generations: true } },
    },
  });

  return NextResponse.json({ users });
}
