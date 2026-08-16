import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Syringe,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { medicoApi } from "../../api/medicoApi";
import { axiosClient } from "../../api/axiosClient";
import { NuevoTratamientoModal } from "./NuevoTratamientoModal";
import { RegistrarVacunaModal } from "./RegistralVacunaModal";
import { RegistrarFallecimientoModal } from "./RegistrarFallecimientoModal";
import { useAppSelector } from "../../hooks/hooks";
import { ActionButton } from "../../components/ActionButton";
import { animalImg, especieImg } from "../../utils/animalImg";
import type { Tratamiento } from "../../types/index";

const ESTADO_CONFIG: Record<string, { label: string; badge: string }> = {
  Activo: { label: "Activo", badge: "bg-amber-100 text-amber-700" },
  Completado: { label: "Completado", badge: "bg-green-100 text-green-700" },
  Suspendido: { label: "Suspendido", badge: "bg-gray-100  text-gray-600" },
  Vacuna: { label: "Vacuna", badge: "bg-blue-100  text-blue-700" },
  Vencida: { label: "Vencida", badge: "bg-red-100   text-red-600" },
  Fallecido: { label: "Fallecido", badge: "bg-red-100   text-red-700" },
};

type Filtro =
  | "Todos"
  | "Activos"
  | "Completados"
  | "Vacunas"
  | "Fallecimientos";

// ── Sección con encabezado ────────────────────────────────────────────────────
function Seccion({
  titulo,
  icono,
  color,
  children,
}: {
  titulo: string;
  icono: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className={`flex items-center gap-2 mb-3 px-1`}>
        <span className={`${color}`}>{icono}</span>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          {titulo}
        </h3>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function Medico() {
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [showTratamiento, setShowTratamiento] = useState(false);
  const [showVacuna, setShowVacuna] = useState(false);
  const [showFallecimiento, setShowFallecimiento] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  // Animal preseleccionado cuando se llega desde la ficha de un animal
  const [preselectedAnimalId, setPreselectedAnimalId] = useState<number | null>(
    null,
  );

  const user = useAppSelector((s) => s.auth.user);
  const canEdit = user?.rol === "Administrador" || user?.rol === "Veterinario";
  const queryClient = useQueryClient();

  const location = useLocation();
  const navigate = useNavigate();

  // Si se navegó a /medico con { openTratamiento, preselectedAnimalId }
  // (por ejemplo desde "Registrar tratamiento" en la ficha del animal),
  // abrimos el modal con el animal ya seleccionado y limpiamos el state
  // para que no se vuelva a abrir al refrescar o al volver atrás.
  useEffect(() => {
    const st = location.state as {
      openTratamiento?: boolean;
      preselectedAnimalId?: number;
    } | null;

    if (st?.openTratamiento && canEdit) {
      setPreselectedAnimalId(st.preselectedAnimalId ?? null);
      setShowTratamiento(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, canEdit]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: tratamientos = [], isLoading: loadingT } = useQuery<
    Tratamiento[]
  >({
    queryKey: ["tratamientos"],
    queryFn: medicoApi.getallTratamientos,
  });

  const { data: vacunas = [], isLoading: loadingV } = useQuery<any[]>({
    queryKey: ["vacunas-todas"],
    queryFn: () => medicoApi.getTodasLasVacunas(),
  });

  const { data: fallecimientos = [], isLoading: loadingF } = useQuery<any[]>({
    queryKey: ["fallecimientos"],
    queryFn: () => axiosClient.get("/fallecimiento").then((r) => r.data),
  });

  // ── Mutación ───────────────────────────────────────────────────────────────
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
        queryKey: ["tratamientos"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["animales"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["historial-timeline"],
        refetchType: "all",
      });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al actualizar"),
  });

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  const q = busqueda.toLowerCase().trim();

  const tFiltrados = tratamientos.filter(
    (t) =>
      !q ||
      (t.animal ?? "").toLowerCase().includes(q) ||
      (t.diagnostico ?? "").toLowerCase().includes(q) ||
      (t.medicamento ?? "").toLowerCase().includes(q),
  );

  const vFiltradas = vacunas.filter(
    (v) =>
      !q ||
      (v.animal ?? "").toLowerCase().includes(q) ||
      (v.tipoVacuna ?? "").toLowerCase().includes(q),
  );

  const fFiltrados = fallecimientos.filter(
    (f) => !q || (f.animal ?? "").toLowerCase().includes(q),
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activos = tratamientos.filter((t) => t.estado === "Activo");
  const completados = tratamientos.filter((t) => t.estado === "Completado");
  const alertas = [
    ...tratamientos.filter((t) => {
      if (!t.fechaFin || t.estado !== "Activo") return false;
      const dias = Math.ceil(
        (new Date(t.fechaFin).getTime() - Date.now()) / 86400000,
      );
      return dias <= 3 && dias >= 0;
    }),
    ...vacunas.filter((v) => v.vencida),
  ];

  const isLoading = loadingT || loadingV || loadingF;

  // ── Contenido según tab ────────────────────────────────────────────────────
  function renderContenido() {
    if (isLoading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      );
    }

    // Vacunas y fallecimientos solos
    if (filtro === "Vacunas") {
      if (!vFiltradas.length) return <Vacio />;
      return (
        <div className="space-y-3">
          {vFiltradas.map((v) => (
            <VacunaCard key={v.id} v={v} />
          ))}
        </div>
      );
    }

    if (filtro === "Fallecimientos") {
      if (!fFiltrados.length) return <Vacio />;
      return (
        <div className="space-y-3">
          {fFiltrados.map((f) => (
            <FallecimientoCard key={f.id} f={f} />
          ))}
        </div>
      );
    }

    // Activos y Completados → solo tratamientos
    if (filtro === "Activos") {
      const lista = tFiltrados.filter((t) => t.estado === "Activo");
      if (!lista.length)
        return <Vacio mensaje="No hay tratamientos activos." />;
      return (
        <div className="space-y-3">
          {lista.map((t) => (
            <TratamientoCard
              key={t.id}
              t={t}
              canEdit={canEdit}
              mutEstado={mutEstado}
            />
          ))}
        </div>
      );
    }

    if (filtro === "Completados") {
      const lista = tFiltrados.filter((t) => t.estado === "Completado");
      if (!lista.length)
        return <Vacio mensaje="No hay tratamientos completados." />;
      return (
        <div className="space-y-3">
          {lista.map((t) => (
            <TratamientoCard
              key={t.id}
              t={t}
              canEdit={canEdit}
              mutEstado={mutEstado}
            />
          ))}
        </div>
      );
    }

    // ── Todos: tres secciones separadas ──────────────────────────────────────
    const hayTratamientos = tFiltrados.length > 0;
    const hayVacunas = vFiltradas.length > 0;
    const hayFallecimientos = fFiltrados.length > 0;

    if (!hayTratamientos && !hayVacunas && !hayFallecimientos) return <Vacio />;

    return (
      <div className="space-y-8">
        {/* TRATAMIENTOS */}
        {hayTratamientos && (
          <Seccion
            titulo="Tratamientos"
            icono={<Clock className="w-4 h-4" />}
            color="text-amber-500"
          >
            {tFiltrados.map((t) => (
              <TratamientoCard
                key={t.id}
                t={t}
                canEdit={canEdit}
                mutEstado={mutEstado}
              />
            ))}
          </Seccion>
        )}

        {/* VACUNAS */}
        {hayVacunas && (
          <Seccion
            titulo="Vacunas"
            icono={<Syringe className="w-4 h-4" />}
            color="text-blue-500"
          >
            {vFiltradas.map((v) => (
              <VacunaCard key={v.id} v={v} />
            ))}
          </Seccion>
        )}

        {/* FALLECIMIENTOS */}
        {hayFallecimientos && (
          <Seccion
            titulo="Fallecimientos"
            icono={<span className="text-sm">†</span>}
            color="text-red-500"
          >
            {fFiltrados.map((f) => (
              <FallecimientoCard key={f.id} f={f} />
            ))}
          </Seccion>
        )}
      </div>
    );
  }

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="min-w-0 flex-1 basis-full min-[560px]:basis-auto">
          <h2 className="text-xl font-semibold text-gray-900">
            Gestión Médica
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Tratamientos y seguimiento de salud
          </p>
        </div>

        {canEdit && (
          <div className="relative w-full min-[560px]:w-auto">
            <ActionButton
              onClick={() => setMenuAbierto((p) => !p)}
              className="w-full min-[560px]:w-auto"
            >
              <Plus className="w-4 h-4" />
              Nuevo
              <ChevronDown
                className={`w-4 h-4 transition-transform ${menuAbierto ? "rotate-180" : ""}`}
              />
            </ActionButton>

            {menuAbierto && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuAbierto(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowTratamiento(true);
                      setMenuAbierto(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                  >
                    Nuevo Tratamiento
                  </button>
                  <button
                    onClick={() => {
                      setShowVacuna(true);
                      setMenuAbierto(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors border-t border-gray-50"
                  >
                    Registrar Vacuna
                  </button>
                  <button
                    onClick={() => {
                      setShowFallecimiento(true);
                      setMenuAbierto(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50"
                  >
                    Registrar Fallecimiento
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Tratamientos Activos"
          value={activos.length}
          icon={<Clock className="w-5 h-5" />}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Completados"
          value={completados.length}
          icon={<CheckCircle className="w-5 h-5" />}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          label="Alertas Médicas"
          value={alertas.length}
          icon={<AlertCircle className="w-5 h-5" />}
          color="bg-red-100   text-red-500"
        />
      </div>

      {/* Tabs + Buscador */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1 flex-wrap">
          {(
            [
              "Todos",
              "Activos",
              "Completados",
              "Vacunas",
              "Fallecimientos",
            ] as Filtro[]
          ).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                filtro === f
                  ? "bg-green-100 text-green-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por animal, diagnóstico..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      {renderContenido()}

      {/* Modales */}
      {showTratamiento && (
        <NuevoTratamientoModal
          preselectedAnimalId={preselectedAnimalId}
          onClose={() => {
            setShowTratamiento(false);
            setPreselectedAnimalId(null);
            queryClient.invalidateQueries({
              queryKey: ["tratamientos"],
              refetchType: "all",
            });
            queryClient.invalidateQueries({
              queryKey: ["historial-timeline"],
              refetchType: "all",
            });
          }}
        />
      )}
      {showVacuna && (
        <RegistrarVacunaModal
          onClose={() => {
            setShowVacuna(false);
            queryClient.invalidateQueries({
              queryKey: ["vacunas-todas"],
              refetchType: "all",
            });
            queryClient.invalidateQueries({
              queryKey: ["historial-timeline"],
              refetchType: "all",
            });
          }}
        />
      )}
      {showFallecimiento && (
        <RegistrarFallecimientoModal
          onClose={() => {
            setShowFallecimiento(false);
            queryClient.invalidateQueries({
              queryKey: ["fallecimientos"],
              refetchType: "all",
            });
            queryClient.invalidateQueries({
              queryKey: ["animales"],
              refetchType: "all",
            });
            queryClient.invalidateQueries({
              queryKey: ["historial-timeline"],
              refetchType: "all",
            });
          }}
        />
      )}
    </div>
  );
}

// ── Tarjeta: TRATAMIENTO ──────────────────────────────────────────────────────
function TratamientoCard({
  t,
  canEdit,
  mutEstado,
}: {
  t: Tratamiento;
  canEdit: boolean;
  mutEstado: any;
}) {
  const cfg = ESTADO_CONFIG[t.estado] ?? ESTADO_CONFIG["Activo"];
  const diasRestantes = t.fechaFin
    ? Math.ceil((new Date(t.fechaFin).getTime() - Date.now()) / 86400000)
    : null;
  const esAlerta =
    diasRestantes !== null &&
    diasRestantes <= 3 &&
    diasRestantes >= 0 &&
    t.estado === "Activo";

  return (
    <div
      className={`bg-white rounded-2xl border p-5 ${esAlerta ? "border-amber-200 bg-amber-50/30" : "border-gray-100"}`}
    >
      <div className="flex items-start gap-4">
        <img
          src={animalImg(t.fotografiaUrl, t.especie)}
          alt={t.animal}
          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = especieImg(t.especie);
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <h3 className="font-semibold text-gray-900">{t.animal}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {esAlerta && (
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  Finaliza en {diasRestantes}d
                </span>
              )}
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}
              >
                {cfg.label}
              </span>
            </div>
          </div>
          <p className="text-sm text-green-600 font-medium mb-3">
            {t.diagnostico}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Detail label="Medicamento" value={t.medicamento} />
            <Detail label="Dosis" value={t.dosis} />
            <Detail label="Frecuencia" value={t.frecuencia} />
            <Detail
              label="Finaliza"
              value={
                t.fechaFin
                  ? new Date(t.fechaFin).toLocaleDateString("es-DO")
                  : "—"
              }
            />
          </div>
          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <p className="text-xs text-gray-400">
              Inicio: {new Date(t.fechaInicio).toLocaleDateString("es-DO")}
              {t.fechaFin &&
                ` · Fin: ${new Date(t.fechaFin).toLocaleDateString("es-DO")}`}
            </p>
            {canEdit && t.estado === "Activo" && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    mutEstado.mutate({ id: t.id, estado: "Completado" })
                  }
                  disabled={mutEstado.isPending}
                  className="text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  ✓ Completar
                </button>
                <button
                  onClick={() =>
                    mutEstado.mutate({ id: t.id, estado: "Suspendido" })
                  }
                  disabled={mutEstado.isPending}
                  className="text-xs text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  ✕ Suspender
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta: VACUNA ───────────────────────────────────────────────────────────
function VacunaCard({ v }: { v: any }) {
  const cfg = v.vencida ? ESTADO_CONFIG["Vencida"] : ESTADO_CONFIG["Vacuna"];
  const diasProxima = v.proximaDosis
    ? Math.ceil((new Date(v.proximaDosis).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div
      className={`bg-white rounded-2xl border p-5 ${v.vencida ? "border-red-100 bg-red-50/20" : "border-gray-100"}`}
    >
      <div className="flex items-start gap-4">
        <img
          src={animalImg(v.fotografiaUrl, v.especie)}
          alt={v.animal}
          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = especieImg(v.especie);
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900">{v.animal}</h3>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-blue-600 font-medium mb-3">
            {v.tipoVacuna}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Detail
              label="Aplicación"
              value={new Date(v.fechaAplicacion).toLocaleDateString("es-DO")}
            />
            <Detail
              label="Próxima dosis"
              value={
                v.proximaDosis
                  ? new Date(v.proximaDosis).toLocaleDateString("es-DO")
                  : "—"
              }
            />
            <Detail label="Lote" value={v.lote || "—"} />
            <Detail label="Veterinario" value={v.veterinario} />
          </div>
          {diasProxima !== null && !v.vencida && diasProxima <= 30 && (
            <p
              className={`text-xs mt-2 ${diasProxima <= 7 ? "text-amber-600" : "text-gray-400"}`}
            >
              {diasProxima <= 0
                ? "Próxima dosis: hoy"
                : `Próxima dosis en ${diasProxima} día${diasProxima !== 1 ? "s" : ""}`}
            </p>
          )}
          {v.vencida && (
            <p className="text-xs mt-2 text-red-500 font-medium">
              Vacuna vencida - requiere renovacion
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta: FALLECIMIENTO ────────────────────────────────────────────────────
function FallecimientoCard({ f }: { f: any }) {
  return (
    <div className="bg-white rounded-2xl border border-red-100 p-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-2xl text-red-400">
          ✝
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900">{f.animal}</h3>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">
              Fallecido
            </span>
          </div>
          <p className="text-sm text-red-500 font-medium mb-3">{f.causa}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Detail
              label="Fecha"
              value={new Date(f.fecha).toLocaleDateString("es-DO")}
            />
            <Detail label="Certificado por" value={f.veterinario ?? "—"} />
            <Detail label="Registrado por" value={f.registradoPor ?? "—"} />
          </div>
          {f.observaciones && (
            <p className="text-xs text-gray-400 mt-2 italic">
              {f.observaciones}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Vacio({
  mensaje = "No hay registros para esta categoría.",
}: {
  mensaje?: string;
}) {
  return (
    <div className="text-center py-20">
      <p className="text-gray-400 text-sm">{mensaje}</p>
    </div>
  );
}
