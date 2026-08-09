import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pill, FileText, Syringe } from "lucide-react";
import toast from "react-hot-toast";
import { medicoApi } from "../../api/medicoApi";
import { useAppSelector } from "../../hooks/hooks";

interface Props {
  animalId: number;
}

// ── Tipos del timeline (definidos aquí para no depender de exports de medicoApi) ─
interface TratamientoTimeline {
  id: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  viaAdministracion?: string;
  estado: "Activo" | "Completado" | "Suspendido";
  fechaInicio: string;
  fechaFin?: string;
}

interface TimelineConsulta {
  tipo: "consulta";
  id: number;
  fecha: string;
  titulo: string;
  sintomas?: string;
  peso?: number;
  temperatura?: number;
  observaciones?: string;
  veterinario: string;
  tratamientos: TratamientoTimeline[];
}

interface TimelineVacuna {
  tipo: "vacuna";
  id: number;
  fecha: string;
  titulo: string;
  proximaDosis?: string;
  lote?: string;
  observaciones?: string;
  veterinario: string;
  vencida: boolean;
}

interface TimelineFallecimiento {
  tipo: "fallecimiento";
  id: number;
  fecha: string;
  titulo: string;
  lugar?: string;
  observaciones?: string;
  veterinario?: string;
  registradoPor: string;
}

type TimelineItem = TimelineConsulta | TimelineVacuna | TimelineFallecimiento;

// ──────────────────────────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<string, string> = {
  Activo: "bg-amber-100 text-amber-700",
  Completado: "bg-green-100 text-green-700",
  Suspendido: "bg-gray-100  text-gray-500",
};

// ─── ítem: consulta ───────────────────────────────────────────────────────────
function ConsultaItem({
  item,
  canEdit,
  onCompletar,
  onSuspender,
}: {
  item: TimelineConsulta;
  canEdit: boolean;
  onCompletar: (id: number) => void;
  onSuspender: (id: number) => void;
}) {
  const [abierto, setAbierto] = useState(item.tratamientos.length > 0);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <FileText className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 min-w-0 pb-1">
        {/* encabezado */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.titulo}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(item.fecha).toLocaleDateString("es-DO", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          {item.tratamientos.length > 0 && (
            <button
              onClick={() => setAbierto((o) => !o)}
              className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full transition-colors"
            >
              {item.tratamientos.length} tratamiento
              {item.tratamientos.length !== 1 ? "s" : ""} {abierto ? "▲" : "▼"}
            </button>
          )}
        </div>

        {item.sintomas && (
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-medium text-gray-600">Síntomas:</span>{" "}
            {item.sintomas}
          </p>
        )}

        {(item.peso || item.temperatura) && (
          <div className="flex gap-4 mt-1">
            {item.peso && (
              <span className="text-xs text-gray-500">
                ⚖ <strong>{item.peso}</strong> kg
              </span>
            )}
            {item.temperatura && (
              <span className="text-xs text-gray-500">
                🌡 <strong>{item.temperatura}</strong> °C
              </span>
            )}
          </div>
        )}

        {item.veterinario && (
          <p className="text-xs text-gray-400 mt-0.5">
            Veterinario: {item.veterinario}
          </p>
        )}

        {item.observaciones && (
          <p className="text-xs text-gray-400 italic mt-1">
            {item.observaciones}
          </p>
        )}

        {/* tratamientos colapsables */}
        {abierto && item.tratamientos.length > 0 && (
          <div className="mt-2 space-y-2">
            {item.tratamientos.map((t) => (
              <div
                key={t.id}
                className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Pill className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <p className="text-xs font-semibold text-gray-900 flex-1 truncate">
                    {t.medicamento}
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${ESTADO_BADGE[t.estado] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {t.estado}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                  <span>
                    Dosis: <strong>{t.dosis}</strong>
                  </span>
                  <span>
                    Frecuencia: <strong>{t.frecuencia}</strong>
                  </span>
                  {t.viaAdministracion && (
                    <span>
                      Vía: <strong>{t.viaAdministracion}</strong>
                    </span>
                  )}
                  <span>
                    Inicio: <strong>{t.fechaInicio}</strong>
                  </span>
                  {t.fechaFin && (
                    <span>
                      Fin: <strong>{t.fechaFin}</strong>
                    </span>
                  )}
                </div>

                {canEdit && t.estado === "Activo" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => onCompletar(t.id)}
                      className="text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors font-medium"
                    >
                      ✓ Completar
                    </button>
                    <button
                      onClick={() => onSuspender(t.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors font-medium"
                    >
                      ✕ Suspender
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ítem: vacuna ─────────────────────────────────────────────────────────────
function VacunaItem({ item }: { item: TimelineVacuna }) {
  const diasRestantes = item.proximaDosis
    ? Math.ceil((new Date(item.proximaDosis).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          <Syringe className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.titulo}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(item.fecha).toLocaleDateString("es-DO", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${item.vencida ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
          >
            {item.vencida ? "Vencida" : "Vacuna"}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mt-1">
          {item.lote && (
            <span>
              Lote: <strong>{item.lote}</strong>
            </span>
          )}
          {item.proximaDosis && (
            <span>
              Próxima dosis: <strong>{item.proximaDosis}</strong>
            </span>
          )}
          {item.veterinario && (
            <span>
              Vet: <strong>{item.veterinario}</strong>
            </span>
          )}
        </div>

        {diasRestantes !== null && !item.vencida && diasRestantes <= 30 && (
          <p
            className={`text-xs mt-1 font-medium ${diasRestantes <= 7 ? "text-amber-600" : "text-gray-400"}`}
          >
            {diasRestantes <= 0
              ? "⚠ Próxima dosis: hoy"
              : `Próxima dosis en ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}`}
          </p>
        )}
        {item.vencida && (
          <p className="text-xs mt-1 text-red-500 font-medium">
            ⚠ Vacuna vencida — requiere renovación
          </p>
        )}
      </div>
    </div>
  );
}

// ─── ítem: fallecimiento ──────────────────────────────────────────────────────
function FallecimientoItem({ item }: { item: TimelineFallecimiento }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-base font-bold">
          †
        </div>
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-red-600">Fallecimiento</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(item.fecha).toLocaleDateString("es-DO", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 flex-shrink-0">
            Fallecido
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Causa: <strong>{item.titulo}</strong>
        </p>
        {item.veterinario && (
          <p className="text-xs text-gray-400 mt-0.5">
            Certificado por: {item.veterinario}
          </p>
        )}
        {item.registradoPor && (
          <p className="text-xs text-gray-400">
            Registrado por: {item.registradoPor}
          </p>
        )}
        {item.observaciones && (
          <p className="text-xs text-gray-400 italic mt-1">
            {item.observaciones}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function HistorialAnimal({ animalId }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const canEdit = user?.rol === "Administrador" || user?.rol === "Veterinario";
  const queryClient = useQueryClient();

  const {
    data: timeline = [],
    isLoading,
    isError,
  } = useQuery<TimelineItem[]>({
    queryKey: ["historial-timeline", animalId],
    queryFn: () => medicoApi.getTimeline(animalId) as Promise<TimelineItem[]>,
    retry: false,
  });

  const mutEstado = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      medicoApi.actualizarEstadoTratamiento(id, estado),
    onSuccess: (_, { estado }) => {
      toast.success(
        estado === "Completado"
          ? "Tratamiento completado"
          : "Tratamiento suspendido",
      );
      queryClient.invalidateQueries({
        queryKey: ["historial-timeline", animalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tratamientos"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["animales"],
        refetchType: "all",
      });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al actualizar estado"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || timeline.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Sin registros médicos
      </p>
    );
  }

  return (
    <div className="space-y-5 relative">
      {/* línea vertical */}
      <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-100 rounded" />

      {timeline.map((item, idx) => (
        <div key={`${item.tipo}-${item.id}-${idx}`}>
          {item.tipo === "consulta" && (
            <ConsultaItem
              item={item}
              canEdit={canEdit}
              onCompletar={(id) =>
                mutEstado.mutate({ id, estado: "Completado" })
              }
              onSuspender={(id) =>
                mutEstado.mutate({ id, estado: "Suspendido" })
              }
            />
          )}
          {item.tipo === "vacuna" && <VacunaItem item={item} />}
          {item.tipo === "fallecimiento" && <FallecimientoItem item={item} />}
        </div>
      ))}
    </div>
  );
}
