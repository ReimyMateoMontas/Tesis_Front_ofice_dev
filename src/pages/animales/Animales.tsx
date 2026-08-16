import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconSearch, IconPlus, IconPaw } from "@tabler/icons-react";
import { animalApi } from "../../api/animalApi";
import type { Animal } from "../../types";
import { AnimalModal } from "./AnimalModal";
import { AnimalFormModal } from "./AnimalFormModal";
import { useAppSelector } from "../../hooks/hooks";
import { formatearEdad } from "../../utils/Edad";
import { ActionButton } from "../../components/ActionButton";

// Imágenes locales por defecto — colócalas en src/assets/
import perroImg from "../../assets/Perro.jpg";
import gatoImg from "../../assets/Gato.png";

const estadoBadge: Record<string, string> = {
  Saludable: "bg-green-100 text-green-700",
  EnTratamiento: "bg-yellow-100 text-yellow-700",
  Critico: "bg-red-100 text-red-700",
  Recuperado: "bg-blue-100 text-blue-700",
};

const estadoLabel: Record<string, string> = {
  Saludable: "Saludable",
  EnTratamiento: "En tratamiento",
  Critico: "Crítico",
  Recuperado: "Recuperado",
};

// Imágenes placeholder por especie
const placeholderImg: Record<string, string> = {
  Perro: perroImg,
  Gato: gatoImg,
  Ave: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&h=300&fit=crop",
  Otro: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&h=300&fit=crop",
};

export function normalizeAnimal(raw: any): Animal {
  return {
    id: raw.id,
    nombre: raw.nombre,
    especie: raw.especie ?? undefined,
    especieId: raw.especieId ?? undefined,
    raza: raw.raza ?? undefined,
    edad: raw.edad ?? undefined,
    fechaNacimiento: raw.fechaNacimiento ?? undefined,
    fechaNacimientoEstimada: raw.fechaNacimientoEstimada ?? undefined,
    fechaIngreso: raw.fechaIngreso ?? undefined,
    sexo: raw.sexo ?? undefined,
    zonaActual: raw.zonaActual ?? undefined,
    zonaActualId: raw.zonaActualId ?? undefined,
    color: raw.color ?? undefined,
    fotografiaUrl: raw.fotografiaUrl ?? undefined,
    observaciones: raw.observaciones ?? undefined,
    estadoSalud: raw.estadoSalud ?? "Saludable",
    unidadEdad: raw.unidadEdad ?? "años",
    estadoGeneral: raw.estadoGeneral ?? "Activo",
    zona: raw.zona ?? undefined,
    usuarioRegistroId: raw.usuarioRegistroId ?? undefined,
  };
}

export function Animales() {
  const [search, setSearch] = useState("");
  const [especie, setEspecie] = useState("");
  const [estado, setEstado] = useState("");
  const [selected, setSelected] = useState<Animal | null>(null);
  const [showForm, setShowForm] = useState(false);

  const user = useAppSelector((s) => s.auth.user);
  const rol = user?.rol;
  // Pueden registrar animales: Administrador y Trabajador
  const puedeRegistrar = rol === "Administrador" || rol === "Trabajador";

  const {
    data: animales = [],
    isLoading,
    refetch,
  } = useQuery<Animal[]>({
    queryKey: ["animales"],
    queryFn: async () => {
      const raw = await animalApi.getAll();
      return Array.isArray(raw) ? raw.map(normalizeAnimal) : [];
    },
  });

  const filtered = animales.filter((a) => {
    if (a.estadoGeneral === "Adoptado" || a.estadoGeneral === "Fallecido")
      return false;
    const matchSearch =
      a.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (a.raza ?? "").toLowerCase().includes(search.toLowerCase());
    const matchEspecie = especie ? a.especie === especie : true;
    const matchEstado = estado ? a.estadoSalud === estado : true;
    return matchSearch && matchEspecie && matchEstado;
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="min-w-0 flex-1 basis-full min-[560px]:basis-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            Gestión de Animales
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length} animales registrados
          </p>
        </div>
        {puedeRegistrar && (
          <ActionButton
            onClick={() => setShowForm(true)}
            className="w-full min-[560px]:w-auto"
          >
            <IconPlus size={16} stroke={2} />
            <span className="hidden sm:inline">Registrar Animal</span>
            <span className="sm:hidden">Registrar</span>
          </ActionButton>
        )}
      </div>

      {/* Buscador — fila completa */}
      <div className="relative mb-3 w-full max-w-full">
        <IconSearch
          size={16}
          stroke={1.8}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o raza..."
          className="w-full min-w-0 pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Filtros — segunda fila */}
      <div className="grid grid-cols-1 min-[430px]:grid-cols-2 gap-2 mb-5 w-full max-w-full">
        {/* Especie */}
        <select
          value={especie}
          onChange={(e) => setEspecie(e.target.value)}
          className="w-full min-w-0 px-3 py-2.5 text-sm border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-600"
        >
          <option value="">Todas las especies</option>
          <option value="Perro">Perro</option>
          <option value="Gato">Gato</option>
          <option value="Ave">Ave</option>
          <option value="Otro">Otro</option>
        </select>

        {/* Estado */}
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="w-full min-w-0 px-3 py-2.5 text-sm border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-600"
        >
          <option value="">Todos los estados</option>
          <option value="Saludable">Saludable</option>
          <option value="EnTratamiento">En tratamiento</option>
          <option value="Critico">Crítico</option>
          <option value="Recuperado">Recuperado</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <IconPaw
            size={48}
            stroke={1.2}
            className="text-gray-200 mx-auto mb-3"
          />
          <p className="text-gray-400 font-medium">
            No se encontraron animales
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
          {filtered.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              onClick={() => setSelected(animal)}
            />
          ))}
        </div>
      )}

      {selected && (
        <AnimalModal
          animal={selected}
          onClose={() => setSelected(null)}
          onRefetch={refetch}
        />
      )}

      {showForm && (
        <AnimalFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ── Tarjeta de animal ─────────────────────────────────────────────────────────
function AnimalCard({
  animal,
  onClick,
}: {
  animal: Animal;
  onClick: () => void;
}) {
  const tipo = animal.especie ?? "Otro";
  const fallbackSrc = placeholderImg[tipo] ?? placeholderImg["Otro"];

  return (
    <div
      onClick={onClick}
      className="min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
        hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Imagen */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-50">
        <img
          src={
            animal.fotografiaUrl && animal.fotografiaUrl.trim() !== ""
              ? animal.fotografiaUrl
              : fallbackSrc
          }
          alt={animal.nombre}
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.src !== fallbackSrc) img.src = fallbackSrc;
          }}
        />
      </div>

      {/* Contenido */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 leading-none truncate mr-2">
            {animal.nombre}
          </h3>
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase
            tracking-tight flex-shrink-0
            ${estadoBadge[animal.estadoSalud] ?? "bg-gray-100 text-gray-600"}`}
          >
            {estadoLabel[animal.estadoSalud] ?? animal.estadoSalud}
          </span>
        </div>

        <div className="space-y-1.5">
          <InfoRow label="Raza" value={animal.raza || "No especificada"} />
          <InfoRow
            label="Edad"
            value={
              animal.fechaNacimiento
                ? formatearEdad(animal.fechaNacimiento) +
                  (animal.fechaNacimientoEstimada ? "" : "")
                : "Edad desconocida"
            }
          />
          <InfoRow label="Zona" value={animal.zonaActual || "—"} />
        </div>

        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-[10px]">
          <span className="text-gray-400">Ingreso:</span>
          <span className="text-gray-500 font-medium">
            {animal.fechaIngreso
              ? new Date(animal.fechaIngreso).toLocaleDateString("es-DO")
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline text-xs">
      <span className="text-gray-400 w-12 shrink-0 font-medium">{label}:</span>
      <span className="text-gray-700 font-semibold truncate">{value}</span>
    </div>
  );
}
