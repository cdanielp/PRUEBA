"use client";
import { useState, useEffect } from "react";

interface WorkflowRow {
  id: string;
  name: string;
  description: string | null;
  deploymentId: string;
  creditsCost: number;
  category: string | null;
  active: boolean;
  createdAt: string;
}

export default function AdminWorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deploymentId, setDeploymentId] = useState("");
  const [creditsCost, setCreditsCost] = useState("2");
  const [category, setCategory] = useState("image");
  const [creating, setCreating] = useState(false);

  async function loadWorkflows() {
    const res = await fetch("/api/admin/workflows");
    const data = await res.json();
    setWorkflows(data.workflows || []);
    setLoading(false);
  }

  useEffect(() => { loadWorkflows(); }, []);

  async function toggleActive(wf: WorkflowRow) {
    await fetch(`/api/admin/workflows/${wf.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !wf.active }),
    });
    setWorkflows((prev) =>
      prev.map((w) => (w.id === wf.id ? { ...w, active: !w.active } : w))
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const res = await fetch("/api/admin/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || undefined,
        deploymentId,
        creditsCost: parseInt(creditsCost),
        category,
        inputSchema: {
          fields: [
            {
              name: "positive_prompt",
              label: "Prompt",
              type: "textarea",
              required: true,
              placeholder: "Describe lo que quieres generar...",
              maxLength: 1000,
            },
          ],
        },
      }),
    });

    setCreating(false);

    if (res.ok) {
      setName(""); setDescription(""); setDeploymentId(""); setCreditsCost("2");
      setShowCreate(false);
      loadWorkflows();
    }
  }

  if (loading) return <p className="text-neutral-500 text-sm">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Workflows</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 text-sm bg-green-600 rounded-lg hover:bg-green-500 transition font-medium"
        >
          {showCreate ? "Cancelar" : "+ Nuevo Workflow"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="border border-neutral-800 rounded-xl p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Nombre</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none"
                placeholder="Ej: Text to Image Pro"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Deployment ID</label>
              <input
                value={deploymentId} onChange={(e) => setDeploymentId(e.target.value)} required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none font-mono"
                placeholder="dpl_xxxxxxxxxxxx"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Descripción</label>
            <input
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Costo (créditos)</label>
              <input
                type="number" value={creditsCost} onChange={(e) => setCreditsCost(e.target.value)} min="1"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Categoría</label>
              <select
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm focus:outline-none"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="upscale">Upscale</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <button
            type="submit" disabled={creating}
            className="px-6 py-2 text-sm bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50 transition font-medium"
          >
            {creating ? "Creando..." : "Crear Workflow"}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-500">
              <th className="text-left px-4 py-3 font-medium">Workflow</th>
              <th className="text-left px-4 py-3 font-medium">Deployment ID</th>
              <th className="text-center px-4 py-3 font-medium">Costo</th>
              <th className="text-center px-4 py-3 font-medium">Estado</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((wf) => (
              <tr key={wf.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{wf.name}</div>
                  {wf.description && <div className="text-xs text-neutral-500">{wf.description}</div>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">{wf.deploymentId}</td>
                <td className="px-4 py-3 text-center font-mono">{wf.creditsCost}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    wf.active ? "bg-green-500/10 text-green-400" : "bg-neutral-500/10 text-neutral-500"
                  }`}>
                    {wf.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleActive(wf)}
                    className={`text-xs px-3 py-1 rounded transition ${
                      wf.active
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                    }`}
                  >
                    {wf.active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
