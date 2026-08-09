import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { adopcionApi } from "../../api/adopcionesApi";
import { axiosClient } from "../../api/axiosClient";
import { useAppSelector } from "../../hooks/hooks";

interface Props {
  onClose: () => void;
  preselectedAnimalId?: number;
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white";

export function AdopcionFormModal({ onClose, preselectedAnimalId }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    animalId: preselectedAnimalId ? String(preselectedAnimalId) : "",
    nombreAdoptante: "",
    documentoIdentidad: "",
    telefonoAdoptante: "",
    emailAdoptante: "",
    direccionAdoptante: "",
    observaciones: "",
  });

  const { data: animales = [] } = useQuery({
    queryKey: ["animales-disponibles"],
    queryFn: () =>
      axiosClient
        .get("/animal")
        .then((r) => r.data.filter((a: any) => a.estadoGeneral === "Activo")),
  });

  const mutation = useMutation({
    mutationFn: () =>
      adopcionApi.registrar({
        animalId: Number(form.animalId),
        nombreAdoptante: form.nombreAdoptante,
        telefonoAdoptante: form.telefonoAdoptante || undefined,
        emailAdoptante: form.emailAdoptante || undefined,
        direccionAdoptante: form.direccionAdoptante || undefined,
        documentoIdentidad: form.documentoIdentidad || undefined,
        fechaAdopcion: new Date().toISOString().split("T")[0],
        usuarioResponsableId: user!.id,
      }),
    onSuccess: () => {
      toast.success("Adopción registrada correctamente");
      queryClient.invalidateQueries({ queryKey: ["adopciones"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["animales"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["animales-activos"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.mensaje ?? "Error al registrar adopción");
    },
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSubmit =
    form.animalId &&
    form.nombreAdoptante &&
    form.documentoIdentidad &&
    form.telefonoAdoptante &&
    form.emailAdoptante &&
    form.direccionAdoptante;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-gray-900">
            Registrar Nueva Adopción
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Animal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Animal a Adoptar *
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

          {/* Nombre + Documento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre del Adoptante *
              </label>
              <input
                value={form.nombreAdoptante}
                onChange={(e) => set("nombreAdoptante", e.target.value)}
                placeholder="Nombre completo"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Documento de Identidad *
              </label>
              <input
                value={form.documentoIdentidad}
                onChange={(e) => set("documentoIdentidad", e.target.value)}
                placeholder="Cédula, pasaporte, etc."
                className={inputClass}
              />
            </div>
          </div>

          {/* Teléfono + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Teléfono *
              </label>
              <input
                value={form.telefonoAdoptante}
                onChange={(e) => set("telefonoAdoptante", e.target.value)}
                placeholder="+1 809-000-0000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={form.emailAdoptante}
                onChange={(e) => set("emailAdoptante", e.target.value)}
                placeholder="correo@ejemplo.com"
                className={inputClass}
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Dirección *
            </label>
            <input
              value={form.direccionAdoptante}
              onChange={(e) => set("direccionAdoptante", e.target.value)}
              placeholder="Calle, número, sector, ciudad"
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
              rows={3}
              placeholder="Información adicional sobre el adoptante..."
              className={`${inputClass} resize-none`}
            />
          </div>
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
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
              </>
            ) : (
              "Registrar Adopción"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
