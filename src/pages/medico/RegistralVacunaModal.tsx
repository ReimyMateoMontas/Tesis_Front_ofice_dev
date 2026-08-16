import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { medicoApi } from "../../api/medicoApi";
import { axiosClient } from "../../api/axiosClient";
import { useAppSelector } from "../../hooks/hooks";

interface Props {
  animalId?: number;
  animalNombre?: string;
  onClose: () => void;
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";

export function RegistrarVacunaModal({
  animalId,
  animalNombre,
  onClose,
}: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    animalId: animalId ? String(animalId) : "",
    tipoVacunaId: "",
    fechaAplicacion: new Date().toISOString().split("T")[0],
    proximaDosis: "",
    lote: "",
    observaciones: "",
  });

  const { data: animales = [] } = useQuery({
    queryKey: ["animales-activos"],
    queryFn: () =>
      axiosClient
        .get("/animal")
        .then((r) => r.data.filter((a: any) => a.estadoGeneral === "Activo")),
    enabled: !animalId,
  });

  const { data: tiposVacuna = [] } = useQuery({
    queryKey: ["tipos-vacuna"],
    queryFn: medicoApi.getTiposVacuna,
  });

  const mutation = useMutation({
    mutationFn: () =>
      medicoApi.registrarVacuna({
        animalId: Number(form.animalId),
        tipoVacunaId: Number(form.tipoVacunaId),
        fechaAplicacion: form.fechaAplicacion,
        proximaDosis: form.proximaDosis || undefined,
        lote: form.lote || undefined,
        veterinarioId: user!.id,
        observaciones: form.observaciones || undefined,
      }),
    onSuccess: () => {
      toast.success("Vacuna registrada correctamente");
      queryClient.invalidateQueries({
        queryKey: ["vacunas", Number(form.animalId)],
      });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al registrar vacuna"),
  });

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Registrar Vacuna
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Animal (si no viene fijo) */}
          {!animalId ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Animal *
              </label>
              <select
                value={form.animalId}
                onChange={(e) => set("animalId", e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona un animal</option>
                {animales.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                    {a.especie ? ` (${a.especie})` : ""}
                    {a.raza ? ` — ${a.raza}` : ""}
                    {` · #${a.id}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-green-50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500">Animal</p>
              <p className="text-sm font-semibold text-gray-900">
                {animalNombre}
              </p>
            </div>
          )}

          {/* Tipo de vacuna */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo de vacuna *
            </label>
            <select
              value={form.tipoVacunaId}
              onChange={(e) => set("tipoVacunaId", e.target.value)}
              className={inputClass}
            >
              <option value="">Selecciona tipo</option>
              {tiposVacuna.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha aplicación *
              </label>
              <input
                type="date"
                value={form.fechaAplicacion}
                onChange={(e) => set("fechaAplicacion", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Próxima dosis
              </label>
              <input
                type="date"
                value={form.proximaDosis}
                onChange={(e) => set("proximaDosis", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Lote */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lote
            </label>
            <input
              value={form.lote}
              onChange={(e) => set("lote", e.target.value)}
              placeholder="Número de lote"
              className={inputClass}
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observaciones
            </label>
            <textarea
              value={form.observaciones}
              onChange={(e) => set("observaciones", e.target.value)}
              rows={2}
              placeholder="Notas adicionales..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={
              !form.animalId || !form.tipoVacunaId || mutation.isPending
            }
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
              </>
            ) : (
              "Registrar Vacuna"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
