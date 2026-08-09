import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconX, IconLoader2, IconUpload, IconLink } from "@tabler/icons-react";
import toast from "react-hot-toast";
import { axiosClient } from "../../api/axiosClient";
import { formatearEdad } from "../../utils/Edad";
import type { Animal } from "../../types";

interface Props {
  animal: Animal;
  onClose: () => void;
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white";

export function EditarAnimalModal({ animal, onClose }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nombre: animal.nombre ?? "",
    especieId: String(animal.especieId ?? ""),
    raza: animal.raza ?? "",
    fechaNacimiento: animal.fechaNacimiento ?? "",
    fechaNacimientoEstimada: animal.fechaNacimientoEstimada ?? false,
    sexo: animal.sexo ?? "",
    color: animal.color ?? "",
    fotografiaUrl: animal.fotografiaUrl ?? "",
    observaciones: animal.observaciones ?? "",
  });

  const [preview, setPreview] = useState(animal.fotografiaUrl ?? "");

  const { data: especie = [] } = useQuery({
    queryKey: ["especie"],
    queryFn: () => axiosClient.get("/animal/especie").then((r) => r.data),
  });

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      set("fotografiaUrl", base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreview(e.target.value);
    set("fotografiaUrl", e.target.value);
  };

  const mutation = useMutation({
    mutationFn: () =>
      axiosClient
        .put(`/animal/${animal.id}`, {
          nombre: form.nombre,
          especieId: Number(form.especieId),
          raza: form.raza || undefined,
          fechaNacimiento: form.fechaNacimiento || undefined,
          fechaNacimientoEstimada: form.fechaNacimientoEstimada,
          sexo: form.sexo || undefined,
          color: form.color || undefined,
          fotografiaUrl: form.fotografiaUrl || undefined,
          observaciones: form.observaciones || undefined,
          // Campos requeridos por el PUT que no se editan aquí
          zonaActualId: animal.zonaActualId,
          usuarioRegistroId: undefined,
          fechaIngreso: animal.fechaIngreso,
        })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Animal actualizado correctamente");
      queryClient.invalidateQueries({
        queryKey: ["animales"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["animal", animal.id],
        refetchType: "all",
      });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al actualizar"),
  });

  const canSubmit = form.nombre.trim() && form.especieId;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-gray-900">
            Editar Animal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <IconX size={20} stroke={1.8} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre *
            </label>
            <input
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: Max"
              className={inputClass}
            />
          </div>

          {/* Especie + Raza */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Especie *
              </label>
              <select
                value={form.especieId}
                onChange={(e) => set("especieId", e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona especie</option>
                {especie.length > 0 ? (
                  especie.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">Perro</option>
                    <option value="2">Gato</option>
                    <option value="3">Ave</option>
                    <option value="4">Otro</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Raza
              </label>
              <input
                value={form.raza}
                onChange={(e) => set("raza", e.target.value)}
                placeholder="Ej: Labrador"
                className={inputClass}
              />
            </div>
          </div>

          {/* Fecha de nacimiento + Sexo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={form.fechaNacimiento}
                onChange={(e) => set("fechaNacimiento", e.target.value)}
                className={inputClass}
              />
              <label className="flex items-center gap-2 mt-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.fechaNacimientoEstimada}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      fechaNacimientoEstimada: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                La fecha es estimada (no se conoce la exacta)
              </label>
              {form.fechaNacimiento && (
                <p className="text-xs text-green-600 mt-1.5">
                  Edad actual: {formatearEdad(form.fechaNacimiento)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sexo
              </label>
              <select
                value={form.sexo}
                onChange={(e) => set("sexo", e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona sexo</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Color
            </label>
            <input
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
              placeholder="Ej: Negro con marrón"
              className={inputClass}
            />
          </div>

          {/* Fotografía */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fotografía
            </label>

            {/* Preview */}
            {preview && (
              <div className="mb-3 rounded-xl overflow-hidden h-36 bg-gray-100">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setPreview("")}
                />
              </div>
            )}

            {/* Upload */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors mb-3"
            >
              <IconUpload
                size={20}
                stroke={1.5}
                className="text-gray-300 mx-auto mb-1"
              />
              <p className="text-sm text-gray-400">
                Haz clic para subir una imagen
              </p>
              <p className="text-xs text-gray-300 mt-0.5">PNG, JPG — máx 2MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* URL */}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">o pegar URL</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="relative">
              <IconLink
                size={16}
                stroke={1.8}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
              />
              <input
                type="url"
                placeholder="https://..."
                defaultValue={
                  animal.fotografiaUrl?.startsWith("data:")
                    ? ""
                    : animal.fotografiaUrl
                }
                className={`${inputClass} pl-9`}
                onChange={handleUrlChange}
              />
            </div>
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
              placeholder="Notas adicionales sobre el animal..."
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
                <IconLoader2 size={16} className="animate-spin" /> Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}