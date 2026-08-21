import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { zonaApi } from "../../api/zonaApi";
import { animalImg, especieImg } from "../../utils/animalImg";
import type { AnimalEnZona, Zona } from "../../types/index";

interface Props {
  animal: AnimalEnZona;
  zonaActualId: number;
  zonas: Zona[];
  onClose: () => void;
  onSuccess: () => void;
}

export function MoverAnimalModal({
  animal,
  zonaActualId,
  zonas,
  onClose,
  onSuccess,
}: Props) {
  const [zonaDestinoId, setZonaDestinoId] = useState<number | "">("");
  const [motivo, setMotivo] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      zonaApi.moverAnimal({
        animalId: animal.id,
        zonaDestinoId: zonaDestinoId as number,
        motivo,
      }),
    onSuccess: () => {
      toast.success(`${animal.nombre} movido correctamente`);
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.mensaje ?? "Error al mover el animal");
    },
  });

  const zonasDisponibles = zonas.filter(
    (z) =>
      z.id !== zonaActualId && z.isActive && z.currentCapacity < z.maxCapacity,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Mover Animal</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Animal info */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <img
              src={animalImg(animal.fotografiaUrl, animal.especie)}
              alt={animal.nombre}
              className="w-12 h-12 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = especieImg(animal.especie);
              }}
            />
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {animal.nombre}
              </p>
              <p className="text-xs text-gray-500">
                {animal.especie ?? ""}
                {animal.raza ? ` · ${animal.raza}` : ""}
              </p>
            </div>
          </div>

          {/* Zona destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Zona destino *
            </label>
            {zonasDisponibles.length === 0 ? (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                No hay zonas disponibles con capacidad
              </p>
            ) : (
              <select
                value={zonaDestinoId}
                onChange={(e) => setZonaDestinoId(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona una zona</option>
                {zonasDisponibles.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.currentCapacity}/{zone.maxCapacity})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Motivo
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Completó período de observación"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
            disabled={!zonaDestinoId || mutation.isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Moviendo...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" /> Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
