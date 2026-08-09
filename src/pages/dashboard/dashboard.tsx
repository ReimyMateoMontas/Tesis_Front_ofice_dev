import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "../../api/axiosClient";
import { useAppSelector } from "../../hooks/hooks";
import {
  IconPaw,
  IconHeartbeat,
  IconStethoscope,
  IconAlertTriangle,
  IconPawFilled,
  IconPill,
  IconPackage,
  IconHome,
} from "@tabler/icons-react";
import ReactECharts from "echarts-for-react";

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const SALUD_COLOR: Record<string, string> = {
  Saludable: "#22c55e",
  "En tratamiento": "#f59e0b",
  Recuperado: "#3b82f6",
  Crítico: "#ef4444",
};

const GASTO_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#06b6d4",
  "#a855f7",
  "#eab308",
  "#ef4444",
  "#6b7280",
];

// Ícono + color por tipo de actividad
const ACTIVIDAD_CONFIG: Record<
  string,
  { Icon: React.ElementType; bg: string; color: string }
> = {
  animal: { Icon: IconPawFilled, bg: "bg-green-100", color: "text-green-600" },
  tratamiento: { Icon: IconPill, bg: "bg-blue-100", color: "text-blue-600" },
  stock: { Icon: IconPackage, bg: "bg-amber-100", color: "text-amber-600" },
  adopcion: { Icon: IconHome, bg: "bg-purple-100", color: "text-purple-600" },
};

function tiempoRelativo(fecha: string | null): string {
  if (!fecha) return "—";
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hs = Math.floor(mins / 60);
  if (hs < 24) return `Hace ${hs}h`;
  const dias = Math.floor(hs / 24);
  if (dias < 30) return `Hace ${dias}d`;
  return new Date(fecha).toLocaleDateString("es-DO");
}

// ── ECharts: Pastel estado de salud ───────────────────────────────────────────
function MiniPie({ data }: { data: { estado: string; cantidad: number }[] }) {
  const total = data.reduce((s, d) => s + d.cantidad, 0);
  if (total === 0)
    return <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>;

  const option = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { show: false },
    series: [
      {
        type: "pie",
        radius: ["42%", "68%"],
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 11, fontWeight: "bold" } },
        data: data.map((d) => ({
          name: d.estado,
          value: d.cantidad,
          itemStyle: { color: SALUD_COLOR[d.estado] ?? "#6b7280" },
        })),
      },
    ],
  };

  return (
    <div>
      <ReactECharts option={option} style={{ height: 100 }} />
      <div className="space-y-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-2"
                style={{ backgroundColor: SALUD_COLOR[d.estado] ?? "#6b7280" }}
              />
              <span className="text-gray-600 truncate">{d.estado}</span>
            </div>
            <span className="font-semibold text-gray-900 ml-1">
              {Math.round((d.cantidad / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ECharts: Pastel gastos ────────────────────────────────────────────────────
function GastoPie({ data }: { data: { categoria: string; total: number }[] }) {
  if (!data.length)
    return <p className="text-sm text-gray-400 text-center py-4">Sin gastos</p>;

  const option = {
    tooltip: {
      trigger: "item",
      formatter: (p: any) =>
        `${p.name}<br/>RD$ ${p.value.toLocaleString("es-DO")} (${p.percent}%)`,
    },
    legend: { show: false },
    series: [
      {
        type: "pie",
        radius: ["42%", "68%"],
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 10, fontWeight: "bold" } },
        data: data.map((d, i) => ({
          name: d.categoria,
          value: d.total,
          itemStyle: { color: GASTO_COLORS[i % GASTO_COLORS.length] },
        })),
      },
    ],
  };

  return (
    <div>
      <ReactECharts option={option} style={{ height: 100 }} />
      <div className="space-y-1 mt-1">
        {data.slice(0, 3).map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-2"
                style={{
                  backgroundColor: GASTO_COLORS[i % GASTO_COLORS.length],
                }}
              />
              <span className="text-gray-600 truncate">{d.categoria}</span>
            </div>
            <span className="font-semibold text-gray-900 ml-1">
              ${(d.total / 1000).toFixed(0)}k
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ECharts: Línea gastos mensuales ──────────────────────────────────────────
function LineChart({
  data,
}: {
  data: { mes: number; anio: number; total: number }[];
}) {
  if (!data.length)
    return <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>;

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (p: any) =>
        `${MESES[p[0].dataIndex]}<br/>RD$ ${p[0].value.toLocaleString("es-DO")}`,
    },
    grid: { left: 4, right: 4, top: 6, bottom: 16, containLabel: true },
    xAxis: {
      type: "category",
      data: data.map((d) => MESES[d.mes - 1]),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 9, color: "#9ca3af" },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#f3f4f6" } },
      axisLabel: {
        fontSize: 9,
        color: "#9ca3af",
        formatter: (v: number) =>
          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
      },
    },
    series: [
      {
        type: "line",
        data: data.map((d) => d.total),
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { color: "#3b82f6", width: 2 },
        itemStyle: { color: "#3b82f6" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59,130,246,0.15)" },
              { offset: 1, color: "rgba(59,130,246,0)" },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 120 }} />;
}

// ── ECharts: Barras zonas ─────────────────────────────────────────────────────
function ZonaBars({
  data,
}: {
  data: { nombre: string; capacidad: number; ocupacion: number }[];
}) {
  if (!data.length)
    return <p className="text-sm text-gray-400 text-center py-4">Sin zonas</p>;

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (p: any) =>
        `${p[0].name}<br/>${p[0].value}/${p[1].value + p[0].value} animales`,
    },
    grid: { left: 4, right: 4, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: "value", show: false },
    yAxis: {
      type: "category",
      data: data.map((d) =>
        d.nombre.length > 10 ? d.nombre.slice(0, 10) + "…" : d.nombre,
      ),
      axisLabel: { fontSize: 9, color: "#6b7280" },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: "Ocupación",
        type: "bar",
        stack: "total",
        barMaxWidth: 12,
        data: data.map((z) => ({
          value: z.ocupacion,
          itemStyle: {
            color:
              z.capacidad > 0 && z.ocupacion / z.capacidad >= 0.9
                ? "#ef4444"
                : z.capacidad > 0 && z.ocupacion / z.capacidad >= 0.7
                  ? "#f59e0b"
                  : "#22c55e",
            borderRadius: [4, 0, 0, 4],
          },
        })),
      },
      {
        name: "Disponible",
        type: "bar",
        stack: "total",
        barMaxWidth: 12,
        data: data.map((z) => z.capacidad - z.ocupacion),
        itemStyle: { color: "#f3f4f6", borderRadius: [0, 4, 4, 0] },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 120 }} />;
}

// ── Componente principal ──────────────────────────────────────────────────────
export function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => axiosClient.get("/dashboard").then((r) => r.data),
    refetchInterval: 60000,
  });

  const hora = new Date().getHours();
  const { saludo, emoji } =
    hora >= 6 && hora < 12
      ? { saludo: "Buenos días", emoji: "☀️" }
      : hora >= 12 && hora < 18
        ? { saludo: "Buenas tardes", emoji: "🌤️" }
        : hora >= 18 && hora < 24
          ? { saludo: "Buenas noches", emoji: "🌙" }
          : { saludo: "Hey, ya es un nuevo dia! ", emoji: "⭐" };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  const s = data?.stats ?? {};
  const pct =
    s.totalAnimales > 0
      ? Math.round((s.saludables / s.totalAnimales) * 100)
      : 0;

  // ── Visibilidad por rol ─────────────────────────────────────────────────────
  // Administrador: ve todo.
  // Veterinario:   NO ve gastos ni alertas/tarjeta de stock. Sí ve salud.
  // Trabajador:    NO ve gastos. Sí ve stock y alertas de salud (para conocer
  //                el estado de los animales). No puede registrar tratamientos
  //                (eso ya se controla en el módulo médico).
  const rol = user?.rol;
  const puedeVerGastos = rol === "Administrador";
  const puedeVerStock = rol !== "Veterinario";

  const statsGridClass = puedeVerStock
    ? "grid grid-cols-2 lg:grid-cols-4 gap-3"
    : "grid grid-cols-2 lg:grid-cols-3 gap-3";

  const chartsGridClass = puedeVerGastos
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    : "grid grid-cols-1 sm:grid-cols-2 gap-4";

  const mostrarAlertas =
    s.criticos > 0 ||
    (puedeVerStock && s.alertasStock > 0) ||
    s.adopcionesPendientes > 0;

  return (
    <div className="space-y-4">
      {/* Saludo */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          {emoji} {saludo}, {user?.nombre}
        </h2>
        <p className="text-sm text-gray-400 mt-0.5 capitalize">
          {new Date().toLocaleDateString("es-DO", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Stats — 2 cols en móvil, 3 o 4 en desktop según rol */}
      <div className={statsGridClass}>
        <StatCard
          label="Total Animales"
          value={s.totalAnimales ?? 0}
          sub={`+${s.ingresadosSemana ?? 0} esta semana`}
          subColor="text-green-500"
          icon={<IconPaw size={20} stroke={1.6} />}
          iconBg="bg-green-100 text-green-600"
        />
        <StatCard
          label="Saludables"
          value={s.saludables ?? 0}
          sub={`${pct}% del total`}
          subColor="text-gray-400"
          icon={<IconHeartbeat size={20} stroke={1.6} />}
          iconBg="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="En Tratamiento"
          value={s.enTratamiento ?? 0}
          sub={`${s.criticos ?? 0} crítico${s.criticos !== 1 ? "s" : ""}`}
          subColor={s.criticos > 0 ? "text-red-500" : "text-gray-400"}
          icon={<IconStethoscope size={20} stroke={1.6} />}
          iconBg="bg-amber-100 text-amber-600"
        />
        {/* Alertas Stock: oculto para el Veterinario */}
        {puedeVerStock && (
          <StatCard
            label="Alertas Stock"
            value={s.alertasStock ?? 0}
            sub={s.alertasStock > 0 ? "Requiere atención" : "Todo en orden"}
            subColor={s.alertasStock > 0 ? "text-red-500" : "text-green-500"}
            icon={<IconAlertTriangle size={20} stroke={1.6} />}
            iconBg="bg-red-100 text-red-500"
          />
        )}
      </div>

      {/* Alertas — apiladas en móvil */}
      {mostrarAlertas && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          {/* Alerta de salud: visible para todos los roles (incluye Trabajador) */}
          {s.criticos > 0 && (
            <Alert
              color="red"
              text={`🚨 ${s.criticos} animal${s.criticos !== 1 ? "es" : ""} en estado crítico`}
            />
          )}
          {/* Alerta de stock: oculta para el Veterinario */}
          {puedeVerStock && s.alertasStock > 0 && (
            <Alert
              color="amber"
              text={` ${s.alertasStock} producto${s.alertasStock !== 1 ? "s" : ""} con stock bajo`}
            />
          )}
          {s.adopcionesPendientes > 0 && (
            <Alert
              color="blue"
              text={`${s.adopcionesPendientes} adopción${s.adopcionesPendientes !== 1 ? "es" : ""} pendiente${s.adopcionesPendientes !== 1 ? "s" : ""}`}
            />
          )}
        </div>
      )}

      {/* Gráficas — las de gastos solo para Administrador */}
      <div className={chartsGridClass}>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Estado de Salud
          </p>
          <MiniPie data={data?.estadoSalud ?? []} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Ocupación Zonas
          </p>
          <ZonaBars data={data?.zonas ?? []} />
        </div>
        {/* Gastos Mensuales y Por Categoría: solo Administrador */}
        {puedeVerGastos && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Gastos Mensuales
              </p>
              <LineChart data={data?.gastosMensuales ?? []} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Por Categoría
              </p>
              <GastoPie data={data?.gastosPorCategoria ?? []} />
            </div>
          </>
        )}
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
        {!data?.actividadReciente?.length ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Sin actividad reciente
          </p>
        ) : (
          <div className="space-y-1">
            {data.actividadReciente.map((a: any, i: number) => {
              const cfg =
                ACTIVIDAD_CONFIG[a.tipo] ?? ACTIVIDAD_CONFIG["animal"];
              const { Icon } = cfg;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${cfg.bg} ${cfg.color}
                    flex items-center justify-center flex-shrink-2`}
                  >
                    <Icon size={18} stroke={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {a.titulo}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {a.detalle}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-2 whitespace-nowrap">
                    {tiempoRelativo(a.fecha)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  subColor,
  icon,
  iconBg,
}: {
  label: string;
  value: number;
  sub: string;
  subColor: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-1 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className={`text-xs mt-1 truncate ${subColor}`}>{sub}</p>
      </div>
      <div
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${iconBg}
        flex items-center justify-center flex-shrink-2`}
      >
        {icon}
      </div>
    </div>
  );
}

function Alert({ color, text }: { color: string; text: string }) {
  const colors: Record<string, string> = {
    red: "bg-red-50 border-red-100 text-red-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
  };
  return (
    <div
      className={`px-4 py-2.5 rounded-xl border text-sm font-medium ${colors[color]}`}
    >
      {text}
    </div>
  );
}
