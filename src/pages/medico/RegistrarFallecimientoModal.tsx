import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { axiosClient } from "../../api/axiosClient";
import { useAppSelector } from "../../hooks/hooks";

interface Props {
  onClose: () => void;
  preselectedAnimalId?: number;
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white";

export function RegistrarFallecimientoModal({ onClose, preselectedAnimalId }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const [confirmado, setConfirmado] = useState(false);

  const [form, setForm] = useState({
    animalId: preselectedAnimalId ? String(preselectedAnimalId) : "",
    fechaFallecimiento: new Date().toISOString().split("T")[0],
    causaFallecimiento: "",
    observaciones: "",
  });

  const { data: animales = [] } = useQuery({
    queryKey: ["animales-activos"],
    queryFn: () =>
      axiosClient
        .get("/animal")
        .then((r) => r.data.filter((a: any) => a.estadoGeneral === "Activo")),
  });

  const mutation = useMutation({
    mutationFn: () =>
     
      axiosClient
        .post("/fallecimiento", {
          animalId: Number(form.animalId),
          fechaFallecimiento: form.fechaFallecimiento,
          causaFallecimiento: form.causaFallecimiento,
          // Enviamos el id del usuario como fallback por si el service lo necesita
          // El controller los sobreescribe con el token de todas formas
          veterinarioId: user!.id,
          usuarioRegistroId: user!.id,
          observaciones: form.observaciones || null,
        })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Fallecimiento registrado correctamente");
      queryClient.invalidateQueries({ queryKey: ["animales"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["animales-activos"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["fallecimientos"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["tratamientos"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["historial-completo"], refetchType: "all" });
      onClose();
    },
    onError: (err: any) =>
      toast.error(
        err.response?.data?.mensaje ?? "Error al registrar fallecimiento",
      ),
  });

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));
  const canSubmit =
    form.animalId && form.causaFallecimiento.trim() && confirmado;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-semibold text-red-700">
              Registrar Fallecimiento
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Esta acción marcará al animal como fallecido y lo retirará del
            sistema. El registro quedará en el historial médico.
          </p>

          {/* Responsable automático — solo informativo */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.nombre?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-gray-400">Registrado por</p>
              <p className="text-sm font-semibold text-gray-900">
                {user?.nombre} ·{" "}
                <span className="text-gray-400 font-normal">{user?.rol}</span>
              </p>
            </div>
          </div>

          {/* Animal */}
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

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fecha de fallecimiento *
            </label>
            <input
              type="date"
              value={form.fechaFallecimiento}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => set("fechaFallecimiento", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Causa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Causa *
            </label>
            <input
              value={form.causaFallecimiento}
              onChange={(e) => set("causaFallecimiento", e.target.value)}
              placeholder="Ej: Insuficiencia renal, trauma, enfermedad..."
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

          {/* Confirmación obligatoria */}
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmado}
              onChange={(e) => setConfirmado(e.target.checked)}
              className="mt-0.5 accent-red-500"
            />
            <span className="text-xs text-gray-600">
              Confirmo que esta información es correcta y entiendo que esta
              acción no se puede deshacer.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Registrando...
              </>
            ) : (
              "Registrar Fallecimiento"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
