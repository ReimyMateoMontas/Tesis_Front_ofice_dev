import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { axiosClient } from "../../api/axiosClient";
import { useAppSelector } from "../../hooks/hooks";
import type { Animal } from "../../types";
import { getZoneColor } from "../../components/ZonaConstants";

interface Zona {
  id: number;
  name: string;
  description?: string;
  maxCapacity: number;
  currentCapacity: number;
  isActive: boolean;
}

interface Props {
  animal: Animal;
  onClose: () => void;
}

export function CambiarZonaModal({ animal, onClose }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const [zonaDestinoId, setZonaDestinoId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState("");

  const { data: zonas = [], isLoading } = useQuery<Zona[]>({
    queryKey: ["zonas"],
    queryFn: () => axiosClient.get("/zone").then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: () =>
      axiosClient
        .post("/zone/mover-animal", {
          animalId: animal.id,
          zonaDestinoId,
          motivo: motivo || "Cambio de zona",
          veterinarioId: user!.id,
          usuarioRegistroId: user!.id,
        })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success(`${animal.nombre} movido correctamente`);
      queryClient.invalidateQueries({
        queryKey: ["zonas"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["zona-animales"],
        refetchType: "all",
      });
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
      toast.error(err.response?.data?.mensaje ?? "Error al mover el animal"),
  });

  // Buscar la zona actual del animal
  const zonaActual = zonas.find(
    (z) => z.name === animal.zonaActual || z.name === animal.zona,
  );

  const zonasDisponibles = zonas.filter(
    (z) =>
      z.isActive &&
      z.currentCapacity < z.maxCapacity &&
      z.id !== zonaActual?.id,
  );

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Cambiar de Zona</h3>
            <p className="text-xs text-gray-400 mt-0.5">{animal.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Zona actual */}
          {zonaActual && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Zona actual
              </p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {zonaActual.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {zonaActual.currentCapacity}/{zonaActual.maxCapacity}{" "}
                    animales
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Zonas destino */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Selecciona zona destino
            </p>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
              </div>
            ) : zonasDisponibles.length === 0 ? (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
                No hay zonas disponibles con capacidad
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {zonasDisponibles.map((zona) => {
                  const pct =
                    zona.maxCapacity > 0
                      ? Math.round(
                          (zona.currentCapacity / zona.maxCapacity) * 100,
                        )
                      : 0;
                  const zoneIndex = zonas.findIndex((z) => z.id === zona.id);
                  const zoneColor = getZoneColor(zona.name, zoneIndex);
                  const isSelected = zonaDestinoId === zona.id;

                  return (
                    <button
                      key={zona.id}
                      onClick={() => setZonaDestinoId(zona.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? zoneColor.selected
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${zoneColor.icon} flex items-center justify-center flex-shrink-0`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {zona.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${zoneColor.bar}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {zona.currentCapacity}/{zona.maxCapacity}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div
                          className={`w-5 h-5 rounded-full ${zoneColor.dot} flex items-center justify-center flex-shrink-0`}
                        >
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Motivo{" "}
              <span className="text-gray-400 font-normal text-xs">
                opcional
              </span>
            </label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Completó período de observación"
              className={inputClass}
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
