"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading") return <p className="p-8 text-neutral-500">Cargando...</p>;

  const tabs = [
    { href: "/admin", label: "Usuarios" },
    { href: "/admin/workflows", label: "Workflows" },
  ];

  return (
    <div className="min-h-screen">
      {/* Admin Nav */}
      <nav className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between sticky top-0 bg-neutral-950/80 backdrop-blur z-50">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-white transition">
            ← Dashboard
          </Link>
          <span className="font-bold text-sm text-amber-400">Admin Panel</span>
          <div className="flex gap-1">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  pathname === t.href
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">{children}</main>
    </div>
  );
}
