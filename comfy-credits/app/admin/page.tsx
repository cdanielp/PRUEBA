"use client";
import { useState, useEffect } from "react";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  creditsBalance: number;
  createdAt: string;
  _count: { generations: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal de ajuste de créditos
  const [adjustUser, setAdjustUser] = useState<UserRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustResult, setAdjustResult] = useState("");

  async function loadUsers(q = "") {
    setLoading(true);
    const params = q ? `?search=${encodeURIComponent(q)}` : "";
    const res = await fetch(`/api/admin/users${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadUsers(search);
  }

  async function handleAdjust() {
    if (!adjustUser || !adjustAmount || !adjustDesc) return;
    setAdjusting(true);
    setAdjustResult("");

    const res = await fetch(`/api/admin/users/${adjustUser.id}/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseInt(adjustAmount),
        description: adjustDesc,
      }),
    });

    const data = await res.json();
    setAdjusting(false);

    if (res.ok) {
      setAdjustResult(`Nuevo saldo: ${data.newBalance}`);
      // Actualizar la tabla
      setUsers((prev) =>
        prev.map((u) =>
          u.id === adjustUser.id ? { ...u, creditsBalance: data.newBalance } : u
        )
      );
      // Limpiar form
      setTimeout(() => {
        setAdjustUser(null);
        setAdjustAmount("");
        setAdjustDesc("");
        setAdjustResult("");
      }, 1500);
    } else {
      setAdjustResult(`Error: ${data.error}`);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Usuarios</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email o nombre..."
          className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-600"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-neutral-800 text-sm rounded-lg hover:bg-neutral-700 transition"
        >
          Buscar
        </button>
      </form>

      {loading ? (
        <p className="text-neutral-500 text-sm">Cargando...</p>
      ) : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500">
                <th className="text-left px-4 py-3 font-medium">Usuario</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-center px-4 py-3 font-medium">Créditos</th>
                <th className="text-center px-4 py-3 font-medium">Generaciones</th>
                <th className="text-center px-4 py-3 font-medium">Registro</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/50">
                  <td className="px-4 py-3">
                    {user.name || "—"}
                    {user.role === "ADMIN" && (
                      <span className="ml-2 text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{user.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-bold text-green-400">{user.creditsBalance}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-400">{user._count.generations}</td>
                  <td className="px-4 py-3 text-center text-neutral-600 text-xs">
                    {new Date(user.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setAdjustUser(user); setAdjustResult(""); }}
                      className="text-xs px-3 py-1 bg-neutral-800 rounded hover:bg-neutral-700 transition"
                    >
                      Ajustar créditos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center text-neutral-500 text-sm py-8">Sin resultados</p>
          )}
        </div>
      )}

      {/* Modal ajuste de créditos */}
      {adjustUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="font-bold mb-1">Ajustar Créditos</h2>
            <p className="text-sm text-neutral-500 mb-4">
              {adjustUser.name || adjustUser.email} — Saldo actual:{" "}
              <span className="text-green-400 font-mono">{adjustUser.creditsBalance}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">
                  Cantidad (positivo para sumar, negativo para restar)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Ej: 100 o -10"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Motivo</label>
                <input
                  type="text"
                  value={adjustDesc}
                  onChange={(e) => setAdjustDesc(e.target.value)}
                  placeholder="Ej: Recarga manual, Compensación..."
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none"
                />
              </div>

              {adjustResult && (
                <div className={`text-sm p-2 rounded ${
                  adjustResult.startsWith("Error") ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                }`}>
                  {adjustResult}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setAdjustUser(null); setAdjustAmount(""); setAdjustDesc(""); }}
                  className="flex-1 py-2 text-sm border border-neutral-700 rounded-lg hover:bg-neutral-800 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdjust}
                  disabled={adjusting || !adjustAmount || !adjustDesc}
                  className="flex-1 py-2 text-sm bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50 transition font-medium"
                >
                  {adjusting ? "Aplicando..." : "Aplicar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
