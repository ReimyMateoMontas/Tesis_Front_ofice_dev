import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconArrowRight } from "@tabler/icons-react";
import { zonaApi } from "../../api/zonaApi";
import { MoverAnimalModal } from "./MoverAnimalModal";
import { ESTADO_BADGE } from "../../components/ZonaConstants";
import { animalImg, especieImg } from "../../utils/animalImg";
import { useAppSelector } from "../../hooks/hooks";
import type { AnimalEnZona, Zona } from "../../types/index";

interface Props {
  zona: Zona;
  zonas: Zona[];
  onMovimientoRealizado: () => void;
}

export function ZonaPanel({ zona, zonas, onMovimientoRealizado }: Props) {
  const [animalAMover, setAnimalAMover] = useState<AnimalEnZona | null>(null);

  const user = useAppSelector((s) => s.auth.user);
  const canMove =
    user?.rol === "Administrador" ||
    user?.rol === "Veterinario" ||
    user?.rol === "Trabajador";

  const { data: animales = [], isLoading } = useQuery<AnimalEnZona[]>({
    queryKey: ["zona-animales", zona.id],
    queryFn: () => zonaApi.getAnimalesByZona(zona.id),
  });

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">{zona.name}</h3>
            <p className="text-sm text-gray-400">
              {animales.length} animal{animales.length !== 1 ? "es" : ""} en
              esta zona
            </p>
          </div>
          {canMove && (
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
              Haz clic en un animal para moverlo
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : animales.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Sin animales en esta zona
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {animales.map((animal) => (
              <div
                key={animal.id}
                onClick={() => canMove && setAnimalAMover(animal)}
                className={`flex items-center gap-3 bg-gray-50 rounded-xl p-3 transition-all ${
                  canMove
                    ? "cursor-pointer hover:bg-green-50 hover:shadow-sm"
                    : ""
                }`}
              >
                <img
                  src={animalImg(animal.fotografiaUrl, animal.especie)}
                  alt={animal.nombre}
                  className="w-12 h-12 rounded-lg object-cover "
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = especieImg(
                      animal.especie,
                    );
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {animal.nombre}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {animal.especie ?? ""}
                    {animal.raza ? ` · ${animal.raza}` : ""}
                  </p>
                  {animal.estadoSalud && (
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1
                      ${ESTADO_BADGE[animal.estadoSalud] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {animal.estadoSalud === "EnTratamiento"
                        ? "En tratamiento"
                        : animal.estadoSalud}
                    </span>
                  )}
                </div>
                {canMove && (
                  <IconArrowRight
                    size={16}
                    stroke={1.8}
                    className="text-gray-300 "
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {animalAMover && (
        <MoverAnimalModal
          animal={animalAMover}
          zonaActualId={zona.id}
          zonas={zonas}
          onClose={() => setAnimalAMover(null)}
          onSuccess={onMovimientoRealizado}
        />
      )}
    </>
  );
}
