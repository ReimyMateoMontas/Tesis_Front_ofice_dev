import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  Activity,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { animalApi } from "../../api/animalApi";
import { axiosClient } from "../../api/axiosClient";
import { useAppSelector } from "../../hooks/hooks";
import { formatearEdad } from "../../utils/Edad";
import { normalizeAnimal } from "./Animales";
import { HistorialAnimal } from "../medico/HistorialAnimal";
import { HistorialMovimientos } from "../zona/HistorialMovimientos";
import { CambiarZonaModal } from "./CambiarZonaModal";
import { EditarAnimalModal } from "./EditarAnimalModal";
import { especieImg } from "../../utils/animalImg";
import type { Animal } from "../../types";

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

// ── Modal: Actualizar estado de salud ─────────────────────────────────────────
function ActualizarEstadoModal({
  animal,
  onClose,
}: {
  animal: Animal;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [estadoSalud, setEstadoSalud] = useState(animal.estadoSalud ?? "");

  const mut = useMutation({
    mutationFn: () =>
      axiosClient
        .patch(`/animal/${animal.id}/estado`, { estadoSalud })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Estado actualizado");
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

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Actualizar Estado</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Estado de salud
            </label>
            <select
              value={estadoSalud}
              onChange={(e) =>
                setEstadoSalud(e.target.value as typeof estadoSalud)
              }
              className={inputClass}
            >
              <option value="Saludable">Saludable</option>
              <option value="EnTratamiento">En tratamiento</option>
              <option value="Critico">Crítico</option>
              <option value="Recuperado">Recuperado</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl flex items-center justify-center gap-2"
          >
            {mut.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Dar de baja ────────────────────────────────────────────────────────
function DarDeBajaModal({
  animal,
  onClose,
}: {
  animal: Animal;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [opcion, setOpcion] = useState<
    "Fallecido" | "Adoptado" | "eliminar" | ""
  >("");
  const [confirmado, setConfirmado] = useState(false);

  const mutEliminar = useMutation({
    mutationFn: () =>
      axiosClient.delete(`/animal/${animal.id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Animal eliminado del sistema");
      queryClient.invalidateQueries({
        queryKey: ["animales"],
        refetchType: "all",
      });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al eliminar"),
  });

  const isPending = mutEliminar.isPending;

  const handleConfirmar = () => {
    if (opcion === "eliminar") {
      mutEliminar.mutate();
    } else if (opcion === "Fallecido") {
      onClose();
      navigate("/medico", {
        state: { openFallecimiento: true, preselectedAnimalId: animal.id },
      });
    } else if (opcion === "Adoptado") {
      onClose();
      navigate("/adopcion", {
        state: { openAdopcion: true, preselectedAnimalId: animal.id },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 bg-red-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-red-700">Dar de Baja</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-600">
            ¿Qué acción deseas realizar con <strong>{animal.nombre}</strong>?
          </p>

          {/* Opciones */}
          {[
            {
              value: "Fallecido",
              label: "✝ Registrar como fallecido",
              desc: "Se abrirá el formulario de registro de fallecimiento",
              color: "border-red-200 bg-red-50 text-red-700",
            },
            {
              value: "Adoptado",
              label: "🏠 Marcar como adoptado",
              desc: "Se abrirá el formulario de registro de adopción",
              color: "border-green-200 bg-green-50 text-green-700",
            },
            {
              value: "eliminar",
              label: "🗑 Eliminar del sistema",
              desc: "Solo administradores — acción irreversible",
              color: "border-gray-200 bg-gray-50 text-gray-700",
            },
          ].map((op) => (
            <button
              key={op.value}
              onClick={() => {
                setOpcion(op.value as any);
                setConfirmado(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                opcion === op.value
                  ? op.color + " border-opacity-100"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <p className="text-sm font-semibold">{op.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{op.desc}</p>
            </button>
          ))}

          {opcion === "eliminar" && (
            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                className="mt-0.5 accent-red-500"
              />
              <span className="text-xs text-gray-600">
                Confirmo que esta acción eliminará permanentemente al animal y
                no se puede deshacer.
              </span>
            </label>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={
              !opcion || (opcion === "eliminar" && !confirmado) || isPending
            }
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Confirmar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
interface Props {
  animal: Animal;
  onClose: () => void;
  onRefetch: () => void;
}

export function AnimalModal({ animal, onClose }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const rol = user?.rol;
  const isAdmin = rol === "Administrador";
  // Pueden editar el animal: Administrador y Trabajador
  const puedeEditar = rol === "Administrador" || rol === "Trabajador";
  // Pueden mover de zona: todos los roles
  const puedeMoverZona =
    rol === "Administrador" || rol === "Veterinario" || rol === "Trabajador";
  // Acciones clínicas (estado de salud): Administrador y Veterinario
  const puedeActualizarEstado =
    rol === "Administrador" || rol === "Veterinario";
  // Mostrar el panel de acciones si tiene al menos una acción disponible
  const tieneAcciones = puedeMoverZona || puedeActualizarEstado || isAdmin;
  const navigate = useNavigate();

  const [showEstado, setShowEstado] = useState(false);
  const [showBaja, setShowBaja] = useState(false);
  const [showZona, setShowZona] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showConfirmTrat, setShowConfirmTrat] = useState(false);

  const { data: detail } = useQuery<Animal>({
    queryKey: ["animal", animal.id],
    queryFn: async () => {
      const raw = await animalApi.getById(animal.id);
      return normalizeAnimal(raw);
    },
  });

  const a = detail ?? animal;
  const fallbackSrc = especieImg(a.especie);

  const handleCambiarZona = () => setShowZona(true);

  const handleRegistrarTratamiento = () => {
    onClose();
    navigate("/medico", {
      state: { openTratamiento: true, preselectedAnimalId: a.id },
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex overflow-hidden">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        <div className="relative ml-auto w-full max-w-4xl bg-gray-50 flex flex-col overflow-y-auto shadow-2xl">
          {/* Topbar */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-gray-900">
              Detalles del Animal
            </h2>
            {puedeEditar ? (
              <button
                onClick={() => setShowEditar(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar
              </button>
            ) : (
              <div className="w-20" />
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6 p-6">
            {/* Columna izquierda */}
            <div className="flex-1 space-y-4 min-w-0">
              {/* Foto */}
              <div className="rounded-xl overflow-hidden bg-gray-200 h-72">
                <img
                  src={
                    a.fotografiaUrl && a.fotografiaUrl.trim() !== ""
                      ? a.fotografiaUrl
                      : fallbackSrc
                  }
                  alt={a.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src !== fallbackSrc) img.src = fallbackSrc;
                  }}
                />
              </div>

              {/* Info */}
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {a.nombre}
                    </h3>
                    <p className="text-sm text-gray-400">{a.raza ?? "—"}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${estadoBadge[a.estadoSalud] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {estadoLabel[a.estadoSalud] ?? a.estadoSalud}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField
                    icon={<Calendar className="w-4 h-4" />}
                    label="Edad"
                    value={
                      a.fechaNacimiento
                        ? formatearEdad(a.fechaNacimiento) +
                          (a.fechaNacimientoEstimada ? " (aprox.)" : "")
                        : "Edad desconocida"
                    }
                  />
                  <InfoField
                    icon={<Calendar className="w-4 h-4" />}
                    label="Fecha de ingreso"
                    value={
                      a.fechaIngreso
                        ? new Date(a.fechaIngreso).toLocaleDateString("es-DO")
                        : "—"
                    }
                  />
                  <InfoField
                    icon={<MapPin className="w-4 h-4" />}
                    label="Zona actual"
                    value={a.zonaActual ?? a.zona ?? "—"}
                  />
                  <InfoField
                    icon={<Activity className="w-4 h-4" />}
                    label="Especie"
                    value={a.especie ?? "—"}
                  />
                  {a.sexo && (
                    <InfoField
                      icon={<Activity className="w-4 h-4" />}
                      label="Sexo"
                      value={a.sexo}
                    />
                  )}
                  {a.color && (
                    <InfoField
                      icon={<Activity className="w-4 h-4" />}
                      label="Color"
                      value={a.color}
                    />
                  )}
                </div>

                {a.observaciones && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Observaciones</p>
                    <p className="text-sm text-gray-700">{a.observaciones}</p>
                  </div>
                )}
              </div>

              {/* Historial médico unificado */}
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Historial Médico
                </h4>
                <HistorialAnimal animalId={a.id} />
              </div>
            </div>

            {/* Columna derecha */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
              {/* Acciones rápidas */}
              {tieneAcciones && (
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                    Acciones Rápidas
                  </h4>
                  <div className="space-y-1">
                    {puedeMoverZona && (
                      <ActionBtn
                        label="Cambiar de zona"
                        color="text-gray-700"
                        onClick={handleCambiarZona}
                      />
                    )}
                    {puedeActualizarEstado && (
                      <ActionBtn
                        label="Registrar tratamiento"
                        color="text-gray-700"
                        onClick={() => setShowConfirmTrat(true)}
                      />
                    )}
                    {puedeActualizarEstado && (
                      <ActionBtn
                        label="Actualizar estado"
                        color="text-gray-700"
                        onClick={() => setShowEstado(true)}
                      />
                    )}
                    {isAdmin && (
                      <ActionBtn
                        label="Dar de baja"
                        color="text-red-500"
                        onClick={() => setShowBaja(true)}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Historial de Movimientos */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                  Historial de Movimientos
                </h4>
                <HistorialMovimientos animalId={a.id} animalNombre={a.nombre} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modales */}
      {showEditar && (
        <EditarAnimalModal animal={a} onClose={() => setShowEditar(false)} />
      )}
      {showZona && (
        <CambiarZonaModal animal={a} onClose={() => setShowZona(false)} />
      )}
      {showEstado && (
        <ActualizarEstadoModal
          animal={a}
          onClose={() => setShowEstado(false)}
        />
      )}
      {showBaja && (
        <DarDeBajaModal
          animal={a}
          onClose={() => {
            setShowBaja(false);
            onClose();
          }}
        />
      )}

      {/* Confirmación antes de ir a registrar tratamiento */}
      {showConfirmTrat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowConfirmTrat(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Registrar tratamiento
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Vas a ir a la sección de tratamientos con{" "}
              <span className="font-medium text-gray-900">{a.nombre}</span> ya
              seleccionado. ¿Deseas continuar?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmTrat(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowConfirmTrat(false);
                  handleRegistrarTratamiento();
                }}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-300 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}

function ActionBtn({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-sm ${color} hover:underline py-1.5 transition-colors`}
    >
      {label}
    </button>
  );
}
