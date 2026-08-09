import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "../../api/axiosClient";
import { useAppSelector } from "../../hooks/hooks";
import {
  PawPrint,
  Activity,
  AlertCircle,
  Package,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";



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

const ACTIVIDAD_CONFIG: Record<string, { icon: string; color: string }> = {
  animal: { icon: "🐾", color: "bg-green-100 text-green-600" },
  tratamiento: { icon: "💊", color: "bg-blue-100 text-blue-600" },
  stock: { icon: "📦", color: "bg-amber-100 text-amber-600" },
  adopcion: { icon: "🏠", color: "bg-purple-100 text-purple-600" },
};

function tiempoRelativo(fecha: string | null): string {
  if (!fecha) return "—";
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hs = Math.floor(mins / 60);
  if (hs < 24) return `Hace ${hs} hora${hs !== 1 ? "s" : ""}`;
  const dias = Math.floor(hs / 24);
  if (dias < 30) return `Hace ${dias} día${dias !== 1 ? "s" : ""}`;
  return new Date(fecha).toLocaleDateString("es-DO");
}

// ── Mini gráfica de pastel SVG ────────────────────────────────────────────────
function MiniPie({ data }: { data: { estado: string; cantidad: number }[] }) {
  const total = data.reduce((s, d) => s + d.cantidad, 0);
  if (total === 0)
    return <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>;

  let offset = 0;
  const polar = (deg: number, r: number) => ({
    x: 80 + r * Math.cos(((deg - 90) * Math.PI) / 180),
    y: 80 + r * Math.sin(((deg - 90) * Math.PI) / 180),
  });

  const slices = data
    .filter((d) => d.cantidad > 0)
    .map((d) => {
      const angle = (d.cantidad / total) * 360;
      const start = offset;
      offset += angle;
      return { ...d, angle, start };
    });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" className="w-28 h-28 flex-shrink-0">
        {slices.map((s, i) => {
          const p1 = polar(s.start, 65);
          const p2 = polar(s.start + s.angle, 65);
          const large = s.angle > 180 ? 1 : 0;
          return (
            <path
              key={i}
              d={`M 80 80 L ${p1.x} ${p1.y} A 65 65 0 ${large} 1 ${p2.x} ${p2.y} Z`}
              fill={SALUD_COLOR[s.estado] ?? "#6b7280"}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: SALUD_COLOR[d.estado] ?? "#6b7280" }}
              />
              <span className="text-gray-600 truncate">{d.estado}</span>
            </div>
            <span className="font-semibold text-gray-900 ml-2">
              {total > 0 ? Math.round((d.cantidad / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini gráfica de pastel para gastos ───────────────────────────────────────
function GastoPie({ data }: { data: { categoria: string; total: number }[] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0)
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        Sin gastos este mes
      </p>
    );

  let offset = 0;
  const polar = (deg: number, r: number) => ({
    x: 80 + r * Math.cos(((deg - 90) * Math.PI) / 180),
    y: 80 + r * Math.sin(((deg - 90) * Math.PI) / 180),
  });

  const slices = data.map((d, i) => {
    const angle = (d.total / total) * 360;
    const start = offset;
    offset += angle;
    return { ...d, angle, start, color: GASTO_COLORS[i % GASTO_COLORS.length] };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" className="w-28 h-28 flex-shrink-0">
        {slices.map((s, i) => {
          const p1 = polar(s.start, 65);
          const p2 = polar(s.start + s.angle, 65);
          const large = s.angle > 180 ? 1 : 0;
          return (
            <path
              key={i}
              d={`M 80 80 L ${p1.x} ${p1.y} A 65 65 0 ${large} 1 ${p2.x} ${p2.y} Z`}
              fill={s.color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.slice(0, 4).map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-gray-600 truncate">{s.categoria}</span>
            </div>
            <span className="font-semibold text-gray-900 ml-2">
              ${s.total.toLocaleString("es-DO")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini gráfica de línea mensual ─────────────────────────────────────────────
function LineChart({
  data,
}: {
  data: { mes: number; anio: number; total: number }[];
}) {
  if (!data.length)
    return <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>;

  const max = Math.max(...data.map((d) => d.total), 1);
  const W = 260,
    H = 80,
    pad = 20;
  const points = data.map((d, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2),
    y: H - pad - (d.total / max) * (H - pad * 2),
    ...d,
  }));

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20">
        <path
          d={path}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        {points.map((p, i) => (
          <span key={i}>{MESES[p.mes - 1]}</span>
        ))}
      </div>
    </div>
  );
}

// ── Barras de zonas ───────────────────────────────────────────────────────────
function ZonaBars({
  data,
}: {
  data: { nombre: string; capacidad: number; ocupacion: number }[];
}) {
  if (!data.length)
    return <p className="text-sm text-gray-400 text-center py-4">Sin zonas</p>;

  return (
    <div className="space-y-3">
      {data.map((z, i) => {
        const pct =
          z.capacidad > 0
            ? Math.min(100, (z.ocupacion / z.capacidad) * 100)
            : 0;
        const color =
          pct >= 90
            ? "bg-red-500"
            : pct >= 70
              ? "bg-amber-400"
              : "bg-green-500";
        return (
          <div key={i}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-700 font-medium truncate max-w-[120px]">
                {z.nombre}
              </span>
              <span className="text-gray-500">
                {z.ocupacion}/{z.capacidad}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${color} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function Inicio() {
  const user = useAppSelector((s) => s.auth.user);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => axiosClient.get("/dashboard").then((r) => r.data),
    refetchInterval: 60000, // refresca cada minuto
  });

  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

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

  return (
    <div className="space-y-5">
      {/* Saludo */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {saludo}, {user?.nombre} 👋
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date().toLocaleDateString("es-DO", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Animales"
          value={s.totalAnimales ?? 0}
          sub={`+${s.ingresadosSemana ?? 0} esta semana`}
          subColor="text-green-500"
          icon={<PawPrint className="w-5 h-5" />}
          iconBg="bg-green-100 text-green-600"
        />
        <StatCard
          label="Animales Saludables"
          value={s.saludables ?? 0}
          sub={`${pct}% del total`}
          subColor="text-gray-400"
          icon={<Heart className="w-5 h-5" />}
          iconBg="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="En Tratamiento"
          value={s.enTratamiento ?? 0}
          sub={`${s.criticos ?? 0} crítico${s.criticos !== 1 ? "s" : ""}`}
          subColor={s.criticos > 0 ? "text-red-500" : "text-gray-400"}
          icon={<Activity className="w-5 h-5" />}
          iconBg="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Alertas de Stock"
          value={s.alertasStock ?? 0}
          sub={s.alertasStock > 0 ? "↘ Requiere atención" : "Todo en orden"}
          subColor={s.alertasStock > 0 ? "text-red-500" : "text-green-500"}
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-red-100 text-red-500"
        />
      </div>

      {/* ── Alertas críticas (si hay) ── */}
      {(s.criticos > 0 || s.alertasStock > 0 || s.adopcionesPendientes > 0) && (
        <div className="flex flex-wrap gap-2">
          {s.criticos > 0 && (
            <Alert
              color="red"
              icon="🚨"
              text={`${s.criticos} animal${s.criticos !== 1 ? "es" : ""} en estado crítico`}
            />
          )}
          {s.alertasStock > 0 && (
            <Alert
              color="amber"
              icon="📦"
              text={`${s.alertasStock} producto${s.alertasStock !== 1 ? "s" : ""} con stock bajo`}
            />
          )}
          {s.adopcionesPendientes > 0 && (
            <Alert
              color="blue"
              icon="📋"
              text={`${s.adopcionesPendientes} adopción${s.adopcionesPendientes !== 1 ? "es" : ""} pendiente${s.adopcionesPendientes !== 1 ? "s" : ""} de revisión`}
            />
          )}
        </div>
      )}

      {/* ── Fila de gráficas compactas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estado de salud */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Estado de Salud
          </p>
          <MiniPie data={data?.estadoSalud ?? []} />
        </div>

        {/* Zonas */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ocupación por Zonas
          </p>
          <ZonaBars data={data?.zonas ?? []} />
        </div>

        {/* Gastos mensuales */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Gastos Mensuales
          </p>
          <LineChart data={data?.gastosMensuales ?? []} />
        </div>

        {/* Gastos por categoría */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Gastos por Categoría
          </p>
          <GastoPie data={data?.gastosPorCategoria ?? []} />
        </div>
      </div>

      {/* ── Actividad Reciente (protagonista) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
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
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${cfg.color} flex items-center justify-center text-lg flex-shrink-0`}
                  >
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {a.titulo}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {a.detalle}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
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

// ── Sub-componentes ───────────────────────────────────────────────────────────
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
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
      </div>
      <div
        className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
    </div>
  );
}

function Alert({
  color,
  icon,
  text,
}: {
  color: string;
  icon: string;
  text: string;
}) {
  const colors: Record<string, string> = {
    red: "bg-red-50 border-red-100 text-red-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
  };
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${colors[color]}`}
    >
      <span>{icon}</span>
      {text}
    </div>
  );
}
