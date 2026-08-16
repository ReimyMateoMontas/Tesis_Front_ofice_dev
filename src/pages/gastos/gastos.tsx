import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconPlus,
  IconCurrencyDollar,
  IconTrendingUp,
  IconCalendar,
  IconLoader2,
  IconX,
  IconTrash,
  IconAlertTriangle,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import ReactECharts from "echarts-for-react";
import { gastoApi } from "../../api/gastosApi";
import { inventarioApi } from "../../api/inventarioApi";
import { EntradaModal } from "../inventario/EntradaModal";
import { useAppSelector } from "../../hooks/hooks";
import { ActionButton } from "../../components/ActionButton";
import type { Gasto, CategoriaGasto } from "../../types/index";

const FORMAS_PAGO = ["Efectivo", "Transferencia", "Tarjeta", "Cheque"];

const CATEGORIA_BADGE: Record<string, string> = {
  Alimentos: "bg-green-100 text-green-700",
  Medicina: "bg-blue-100 text-blue-700",
  Medicamentos: "bg-blue-100 text-blue-700",
  Mantenimiento: "bg-orange-100 text-orange-700",
  Limpieza: "bg-cyan-100 text-cyan-700",
  Servicios: "bg-purple-100 text-purple-700",
  Transporte: "bg-yellow-100 text-yellow-700",
  Emergencias: "bg-red-100 text-red-700",
  Otros: "bg-gray-100 text-gray-600",
};

const CHART_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#06b6d4",
  "#a855f7",
  "#eab308",
  "#ef4444",
  "#6b7280",
];

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";

const AÑOS_DISPONIBLES = (() => {
  const actual = new Date().getFullYear();
  return [actual, actual - 1, actual - 2];
})();

const MESES_NOMBRES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// ── Modal confirmar eliminar ───────────────────────────────────────────────────
function ConfirmarEliminarModal({
  gasto,
  onClose,
  onConfirm,
  isPending,
}: {
  gasto: Gasto;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-red-100 bg-red-50 rounded-t-2xl">
          <IconAlertTriangle
            size={20}
            stroke={1.8}
            className="text-red-500 flex-shrink-0"
          />
          <h3 className="font-semibold text-red-700">Eliminar Gasto</h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-700 mb-1">
            ¿Estás seguro de eliminar este gasto?
          </p>
          <div className="bg-gray-50 rounded-xl px-4 py-3 mt-3">
            <p className="text-sm font-semibold text-gray-900">
              {gasto.concepto}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {gasto.categoria} · ${gasto.monto.toLocaleString("es-DO")} ·{" "}
              {new Date(gasto.fechaGasto).toLocaleDateString("es-DO")}
            </p>
          </div>
          <p className="text-xs text-red-500 mt-3">
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <IconLoader2 size={16} className="animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal registrar gasto ─────────────────────────────────────────────────────
function RegistrarGastoModal({
  onClose,
  onGastoRegistrado,
}: {
  onClose: () => void;
  onGastoRegistrado: (g: {
    categoria: string;
    concepto: string;
    monto: number;
  }) => void;
}) {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    categoriaGastoId: "",
    concepto: "",
    monto: "",
    fechaGasto: new Date().toISOString().split("T")[0],
    formaPago: "Efectivo",
    numeroFactura: "",
    nombreProveedor: "",
    telefonoProveedor: "",
    observaciones: "",
  });

  const { data: categorias = [] } = useQuery<CategoriaGasto[]>({
    queryKey: ["categorias-gasto"],
    queryFn: gastoApi.getCategorias,
  });

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      gastoApi.crearGasto({
        categoriaGastoId: Number(form.categoriaGastoId),
        concepto: form.concepto,
        monto: Number(form.monto),
        fechaGasto: form.fechaGasto,
        formaPago: form.formaPago,
        numeroFactura: form.numeroFactura || undefined,
        nombreProveedor: form.nombreProveedor || undefined,
        telefonoProveedor: form.telefonoProveedor || undefined,
        observaciones: form.observaciones || undefined,
        usuarioRegistroId: user!.id,
      }),
    onSuccess: () => {
      toast.success("Gasto registrado correctamente");
      queryClient.invalidateQueries({
        queryKey: ["gastos"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["resumen-mensual"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["serie-mensual"],
        refetchType: "all",
      });
      const cat = categorias.find(
        (c) => c.id === Number(form.categoriaGastoId),
      );
      if (
        cat &&
        (cat.nombre === "Alimentos" ||
          cat.nombre === "Medicina" ||
          cat.nombre === "Medicamentos")
      ) {
        onGastoRegistrado({
          categoria: cat.nombre,
          concepto: form.concepto,
          monto: Number(form.monto),
        });
      }
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al registrar gasto"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-gray-900">
            Registrar Gasto
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <IconX size={20} stroke={1.8} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Categoría *
            </label>
            <select
              value={form.categoriaGastoId}
              onChange={(e) => set("categoriaGastoId", e.target.value)}
              className={inputClass}
            >
              <option value="">Selecciona categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción *
            </label>
            <input
              value={form.concepto}
              onChange={(e) => set("concepto", e.target.value)}
              placeholder="Ej: Compra de alimento para perros"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Monto (RD$) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.monto}
                onChange={(e) => set("monto", e.target.value)}
                placeholder="Ej: 5000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Forma de pago
              </label>
              <select
                value={form.formaPago}
                onChange={(e) => set("formaPago", e.target.value)}
                className={inputClass}
              >
                {FORMAS_PAGO.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha *
              </label>
              <input
                type="date"
                value={form.fechaGasto}
                onChange={(e) => set("fechaGasto", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                N° Factura
              </label>
              <input
                value={form.numeroFactura}
                onChange={(e) => set("numeroFactura", e.target.value)}
                placeholder="Opcional"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Proveedor
              </label>
              <input
                value={form.nombreProveedor}
                onChange={(e) => set("nombreProveedor", e.target.value)}
                placeholder="Nombre del proveedor"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Teléfono
              </label>
              <input
                value={form.telefonoProveedor}
                onChange={(e) => set("telefonoProveedor", e.target.value)}
                placeholder="+1 809-000-0000"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observaciones
            </label>
            <textarea
              value={form.observaciones}
              onChange={(e) => set("observaciones", e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={
              !form.categoriaGastoId ||
              !form.concepto ||
              !form.monto ||
              mutation.isPending
            }
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <IconLoader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              "Registrar Gasto"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ECharts: Pastel por categoría ─────────────────────────────────────────────
function PieChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  if (!data.length)
    return <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>;

  const total = data.reduce((sum, item) => sum + item.value, 0);

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
        center: ["50%", "50%"],
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 12, fontWeight: "bold" } },
        data: data.map((d) => ({
          name: d.label,
          value: d.value,
          itemStyle: { color: d.color },
        })),
      },
    ],
  };

  return (
    <div>
      <ReactECharts option={option} style={{ height: 150 }} />
      <div className="mt-2 space-y-1.5">
        {data.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-gray-600">{item.label}</span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2 font-semibold text-gray-900">
              <span>RD$ {item.value.toLocaleString("es-DO")}</span>
              {total > 0 && (
                <span className="text-gray-400">
                  {Math.round((item.value / total) * 100)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ECharts: Barras mensuales ─────────────────────────────────────────────────
function BarChart({
  data,
}: {
  data: { mes: number; anio: number; total: number }[];
}) {
  if (!data.length)
    return <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>;

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const d = data[params[0].dataIndex];
        return `${MESES_NOMBRES[d.mes - 1]} ${d.anio}<br/>RD$ ${params[0].value.toLocaleString("es-DO")}`;
      },
    },
    grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: data.map(
        (d) =>
          `${MESES_NOMBRES[d.mes - 1]?.slice(0, 3)} ${String(d.anio).slice(2)}`,
      ),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, color: "#9ca3af" },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#f3f4f6" } },
      axisLabel: {
        fontSize: 10,
        color: "#9ca3af",
        formatter: (v: number) =>
          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
      },
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => d.total),
        barMaxWidth: 40,
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#3b82f6" },
              { offset: 1, color: "#93c5fd" },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        emphasis: { itemStyle: { color: "#2563eb" } },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 200 }} />;
}

// ── Componente principal ──────────────────────────────────────────────────────
export function Gastos() {
  const [showForm, setShowForm] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");
  const [gastoParaEliminar, setGastoParaEliminar] = useState<Gasto | null>(
    null,
  );
  const [gastoParaInventario, setGastoParaInventario] = useState<{
    categoria: string;
    concepto: string;
    monto: number;
  } | null>(null);
  const [showInventarioModal, setShowInventarioModal] = useState(false);

  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.rol === "Administrador";
  const queryClient = useQueryClient();

  const { data: gastos = [], isLoading } = useQuery<Gasto[]>({
    queryKey: ["gastos"],
    queryFn: gastoApi.getGastos,
  });
  const { data: categorias = [] } = useQuery<CategoriaGasto[]>({
    queryKey: ["categorias-gasto"],
    queryFn: gastoApi.getCategorias,
  });

  // Serie mensual desde el backend (para el gráfico de barras).
  // El backend agrupa los gastos por mes/año. Si hay año filtrado, se lo pasamos.
  const { data: serieMensual = [] } = useQuery({
    queryKey: ["serie-mensual", filtroAnio],
    queryFn: () =>
      gastoApi.getSerieMensual(filtroAnio ? Number(filtroAnio) : undefined),
  });

  const { data: inventarioData } = useQuery({
    queryKey: ["inventario"],
    queryFn: inventarioApi.getAlimentos,
    enabled: showInventarioModal,
  });

  const mutEliminar = useMutation({
    mutationFn: (id: number) => gastoApi.eliminarGasto(id),
    onSuccess: () => {
      toast.success("Gasto eliminado");
      queryClient.invalidateQueries({
        queryKey: ["gastos"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["resumen-mensual"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["serie-mensual"],
        refetchType: "all",
      });
      setGastoParaEliminar(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al eliminar"),
  });

  const filtered = [...gastos]
    .sort(
      (a, b) =>
        new Date(b.fechaGasto).getTime() - new Date(a.fechaGasto).getTime(),
    )
    .filter((g) => {
      const fecha = new Date(g.fechaGasto);
      return (
        (filtroCategoria ? g.categoria === filtroCategoria : true) &&
        (filtroMes ? fecha.getMonth() + 1 === Number(filtroMes) : true) &&
        (filtroAnio ? fecha.getFullYear() === Number(filtroAnio) : true)
      );
    });

  const totalGastado = filtered.reduce((s, g) => s + g.monto, 0);
  const promedio = filtered.length > 0 ? totalGastado / filtered.length : 0;

  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((g) => {
      map[g.categoria] = (map[g.categoria] ?? 0) + g.monto;
    });
    return Object.entries(map)
      .map(([label, value], i) => ({
        label,
        value,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const mayorCategoria = porCategoria[0];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="min-w-0 flex-1 basis-full min-[560px]:basis-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Gestión de Gastos
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Control financiero del albergue
          </p>
        </div>
        <ActionButton
          onClick={() => setShowForm(true)}
          className="w-full min-[560px]:w-auto"
        >
          <IconPlus size={16} stroke={2} />
          <span className="hidden sm:inline">Registrar Gasto</span>
          <span className="sm:hidden">Registrar</span>
        </ActionButton>
      </div>

      {/* Stats — 1 col móvil, 3 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Gastado</p>
            <p className="text-2xl font-bold text-gray-900">
              ${totalGastado.toLocaleString("es-DO")}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              En {filtered.length} transacciones
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconCurrencyDollar size={20} stroke={1.6} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Promedio por Gasto</p>
            <p className="text-2xl font-bold text-gray-900">
              ${promedio.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <IconTrendingUp size={12} stroke={1.8} />
              {new Date().toLocaleString("es-DO", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconTrendingUp size={20} stroke={1.6} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Mayor Categoría</p>
            <p className="text-xl font-bold text-gray-900">
              {mayorCategoria?.label ?? "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ${mayorCategoria?.value.toLocaleString("es-DO") ?? "0"}
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconCalendar size={20} stroke={1.6} />
          </div>
        </div>
      </div>

      {/* Gráficas — apiladas en móvil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">
            Distribución por Categoría
          </h3>
          <PieChart data={porCategoria} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Gastos Mensuales</h3>
          <BarChart data={serieMensual} />
        </div>
      </div>

      {/* Filtros + Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex gap-2 p-4 border-b border-gray-50 overflow-x-auto">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-600 flex-shrink-0"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-600 flex-shrink-0"
          >
            <option value="">Todos los años</option>
            {AÑOS_DISPONIBLES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-600 flex-shrink-0"
          >
            <option value="">Todos los meses</option>
            {MESES_NOMBRES.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">
              No hay gastos para los filtros seleccionados
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-50">
                  {[
                    "Fecha",
                    "Categoría",
                    "Descripción",
                    "Responsable",
                    "Monto",
                    isAdmin ? "" : null,
                  ]
                    .filter(Boolean)
                    .map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3"
                      >
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(g.fechaGasto).toLocaleDateString("es-DO")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${CATEGORIA_BADGE[g.categoria] ?? CATEGORIA_BADGE["Otros"]}`}
                      >
                        {g.categoria}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900">
                      {g.concepto}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {g.registradoPor}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ${g.monto.toLocaleString("es-DO")}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setGastoParaEliminar(g)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <IconTrash size={16} stroke={1.8} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <RegistrarGastoModal
          onClose={() => setShowForm(false)}
          onGastoRegistrado={(g) => {
            setGastoParaInventario(g);
            setShowInventarioModal(true);
          }}
        />
      )}
      {gastoParaEliminar && (
        <ConfirmarEliminarModal
          gasto={gastoParaEliminar}
          onClose={() => setGastoParaEliminar(null)}
          onConfirm={() => mutEliminar.mutate(gastoParaEliminar.id)}
          isPending={mutEliminar.isPending}
        />
      )}
      {gastoParaInventario && !showInventarioModal && (
        <div className="fixed bottom-6 right-6 z-40 bg-white rounded-2xl shadow-xl border border-green-100 p-5 max-w-sm">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            ¿Deseas agregar esta compra al inventario?
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Categoría <strong>{gastoParaInventario.categoria}</strong> detectada
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setGastoParaInventario(null)}
              className="flex-1 py-2 text-xs font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Omitir
            </button>
            <button
              onClick={() => setShowInventarioModal(true)}
              className="flex-1 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl"
            >
               Actualizar Stock
            </button>
          </div>
        </div>
      )}
      {showInventarioModal && (
        <EntradaModal
          alimentos={inventarioData?.alimentos ?? []}
          datosGasto={{
            nombre: gastoParaInventario?.concepto,
            cantidad: undefined,
            unidad: "kg",
          }}
          onClose={() => {
            setShowInventarioModal(false);
            setGastoParaInventario(null);
          }}
        />
      )}
    </div>
  );
}
