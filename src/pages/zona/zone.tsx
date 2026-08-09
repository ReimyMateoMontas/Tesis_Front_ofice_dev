import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zonaApi } from "../../api/zonaApi";
import { ZonaCard } from "./zonaCard";
import { ZonaPanel } from "./zonaPanel";
import { HistorialMovimientos } from "./HistorialMovimientos";
import type { Zona } from "../../types/index";

export function Zonas() {
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: zonas = [], isLoading } = useQuery<Zona[]>({
    queryKey: ["zonas"],
    queryFn: zonaApi.getZonas,
  });

  const selectedZona = zonas.find((z) => z.id === selectedZonaId) ?? null;

  const handleMovimientoRealizado = () => {
    queryClient.invalidateQueries({ queryKey: ["zonas"] });
    queryClient.invalidateQueries({ queryKey: ["zona-animales"] });
    queryClient.invalidateQueries({ queryKey: ["movimientos-todas"] });
    queryClient.invalidateQueries({ queryKey: ["animales"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Gestión de Zonas
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Administra las diferentes áreas del albergue
        </p>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {zonas.map((zona, idx) => (
          <ZonaCard
            key={zona.id}
            zona={zona}
            colorIdx={idx}
            isSelected={selectedZonaId === zona.id}
            onClick={() =>
              setSelectedZonaId(selectedZonaId === zona.id ? null : zona.id)
            }
          />
        ))}
      </div>

      {/* Panel de la zona seleccionada */}
      {selectedZona && (
        <ZonaPanel
          zona={selectedZona}
          zonas={zonas}
          onMovimientoRealizado={handleMovimientoRealizado}
        />
      )}

      {/* Historial */}
      <HistorialMovimientos />
    </div>
  );
}
