import { useQuery } from "@tanstack/react-query";
import { zonaApi } from "../../api/zonaApi";
import type { Movimiento } from "../../types/index";

interface Props {
  animalId?: number;
  // animalNombre ya no se usa para filtrar — solo por id para evitar
  // colisiones entre animales con el mismo nombre.
  animalNombre?: string; // se mantiene en la firma para no romper el caller
}

export function HistorialMovimientos({ animalId }: Props = {}) {
  const { data: todos = [], isLoading } = useQuery<Movimiento[]>({
    queryKey: ["movimientos-todas"],
    queryFn: zonaApi.getMovimientos,
  });

  // Sin animalId → muestra todos (uso en Zonas.tsx)
  // Con animalId → filtra SOLO por id, nunca por nombre
  const movimientos = animalId
    ? todos
        .filter((m) => m.animalId === animalId)
        .sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
        )
    : todos;

  return (
    <div
      className={
        animalId ? "" : "bg-white rounded-2xl border border-gray-100 p-5"
      }
    >
      {!animalId && (
        <h3 className="font-semibold text-gray-900 mb-4">
          Historial de Movimientos
        </h3>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      ) : movimientos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          Sin movimientos registrados
        </p>
      ) : (
        <div className="space-y-4">
          {movimientos.map((m) => (
            <div
              key={m.id}
              className="border-b border-gray-50 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {!animalId && (
                  <>
                    <span className="font-semibold text-gray-900 text-sm">
                      {m.animal}
                    </span>
                    <span className="text-gray-400 text-sm">·</span>
                  </>
                )}
                <span className="text-gray-500 text-sm">{m.zonaOrigen}</span>
                <span className="text-gray-400 text-sm">→</span>
                <span className="text-green-600 font-medium text-sm">
                  {m.zonaDestino}
                </span>
              </div>
              {m.motivo && (
                <p className="text-sm text-gray-500 mt-0.5">{m.motivo}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-400">
                  {new Date(m.fecha).toLocaleDateString("es-DO")}
                </span>
                <span className="text-xs text-gray-400">Por: {m.usuario}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
