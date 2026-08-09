import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Plus, Package, TrendingDown } from "lucide-react";
import { inventarioApi } from "../../api/inventarioApi";
import { EntradaModal } from "./EntradaModal";
import { SalidaModal } from "./SalidaModal";
import type { Alimento, MovimientoInventario } from "../../types/index";

const TIPO_COLOR: Record<string, string> = {
  Perro: "bg-blue-100 text-blue-700",
  Gato: "bg-purple-100 text-purple-700",
  Ave: "bg-yellow-100 text-yellow-700",
  Otro: "bg-gray-100 text-gray-600",
};

function getEstadoStock(a: Alimento) {
  const pct = a.stockMinimo > 0 ? a.cantidadDisponible / a.stockMinimo : 1;
  if (pct <= 0.5)
    return {
      label: "Stock Crítico",
      color: "text-red-600",
      bar: "bg-red-500",
      bg: "border-red-200 bg-red-50/30",
    };
  if (pct <= 1)
    return {
      label: "Stock bajo",
      color: "text-red-500",
      bar: "bg-red-400",
      bg: "border-gray-100",
    };
  if (pct <= 1.5)
    return {
      label: "Stock OK",
      color: "text-amber-600",
      bar: "bg-amber-400",
      bg: "border-gray-100",
    };
  return {
    label: "Stock OK",
    color: "text-green-600",
    bar: "bg-green-500",
    bg: "border-gray-100",
  };
}

function ProductoCard({
  alimento,
  isSelected,
  onClick,
}: {
  alimento: Alimento;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { label, color, bar, bg } = getEstadoStock(alimento);
  const pct = Math.min(
    100,
    alimento.stockMinimo > 0
      ? (alimento.cantidadDisponible / (alimento.stockMinimo * 2)) * 100
      : 100,
  );

  const diasVence = alimento.fechaVencimiento
    ? Math.ceil(
        (new Date(alimento.fechaVencimiento).getTime() - Date.now()) / 86400000,
      )
    : null;
  const proxVencer = diasVence !== null && diasVence <= 30 && diasVence >= 0;

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${bg} ${
        isSelected ? "ring-2 ring-green-500" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {alimento.nombre}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[alimento.tipoAnimal] ?? TIPO_COLOR["Otro"]}`}
            >
              {alimento.tipoAnimal}
            </span>
          </div>
        </div>
        <span className={`text-xs font-semibold ${color}`}>{label}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 mt-3">
        <span>Cantidad</span>
        <span className="font-bold text-gray-900">
          {alimento.cantidadDisponible} {alimento.unidadMedida}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          Mínimo: {alimento.stockMinimo} {alimento.unidadMedida}
        </span>
        {alimento.fechaVencimiento && (
          <span className={proxVencer ? "text-amber-500 font-medium" : ""}>
            Vence:{" "}
            {new Date(alimento.fechaVencimiento).toLocaleDateString("es-DO")}
          </span>
        )}
      </div>
      {proxVencer && (
        <p className="text-xs text-amber-600 mt-1 font-medium">
          ⚠ Vence en {diasVence} días
        </p>
      )}
    </div>
  );
}

function PanelDetalles({ alimento }: { alimento: Alimento }) {
  const { data: movimientos = [], isLoading } = useQuery<
    MovimientoInventario[]
  >({
    queryKey: ["inventario-movimientos", alimento.id],
    queryFn: () => inventarioApi.getMovimientos(alimento.id),
  });

  const { label, color } = getEstadoStock(alimento);

  return (
    <div className="space-y-4">
      {/* Info del producto */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">{alimento.nombre}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="Tipo" value={alimento.tipoAnimal} />
          <InfoRow label="Marca" value={alimento.marca ?? "—"} />
          <InfoRow label="Unidad" value={alimento.unidadMedida} />
          <InfoRow
            label="Stock mínimo"
            value={`${alimento.stockMinimo} ${alimento.unidadMedida}`}
          />
          <InfoRow label="Estado" value={label} valueClass={color} />
          <InfoRow
            label="Vencimiento"
            value={
              alimento.fechaVencimiento
                ? new Date(alimento.fechaVencimiento).toLocaleDateString(
                    "es-DO",
                  )
                : "—"
            }
          />
        </div>
        {/* Barra grande */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Stock disponible</span>
            <span className="font-bold">
              {alimento.cantidadDisponible} / {alimento.stockMinimo * 2}{" "}
              {alimento.unidadMedida}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${getEstadoStock(alimento).bar}`}
              style={{
                width: `${Math.min(100, (alimento.cantidadDisponible / (alimento.stockMinimo * 2)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Historial de movimientos */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h4 className="font-semibold text-gray-900 mb-4">
          Historial de movimientos
        </h4>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : movimientos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Sin movimientos registrados
          </p>
        ) : (
          <div className="space-y-3">
            {movimientos.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between text-sm border-b border-gray-50 pb-3 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      m.tipoMovimiento === "Entrada"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {m.tipoMovimiento === "Entrada" ? "+" : "−"}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {m.tipoMovimiento === "Entrada" ? "+" : "−"}
                      {m.cantidad} {alimento.unidadMedida}
                    </p>
                    <p className="text-xs text-gray-400">{m.motivo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(m.fechaMovimiento).toLocaleDateString("es-DO")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {m.usuarioResponsable}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-sm font-semibold text-gray-900 ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

export function Inventario() {
  const [showEntrada, setShowEntrada] = useState(false);
  const [showSalida, setShowSalida] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["inventario"],
    queryFn: inventarioApi.getAlimentos,
  });

  const alimentos: Alimento[] = data?.alimentos ?? [];
  const stockBajos = alimentos.filter((a) => a.stockBajo);
  const selected = alimentos.find((a) => a.id === selectedId) ?? null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Inventario de Alimentos
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Control de stock y movimientos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSalida(true)}
            className="flex items-center gap-2 text-gray-600 border border-gray-200 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <TrendingDown className="w-4 h-4" />
            Registrar Salida
          </button>
          <button
            onClick={() => setShowEntrada(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Entrada
          </button>
        </div>
      </div>

      {/* Alerta stock bajo */}
      {stockBajos.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-500 " />
          <div>
            <p className="text-sm font-semibold text-red-700">Stock Bajo</p>
            <p className="text-xs text-red-500">
              {stockBajos.length} producto{stockBajos.length !== 1 ? "s" : ""}{" "}
              por debajo del stock mínimo
            </p>
          </div>
        </div>
      )}

      {/* Layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Lista */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700 text-sm">Productos</h3>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : alimentos.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Sin productos en inventario</p>
            </div>
          ) : (
            alimentos.map((a) => (
              <ProductoCard
                key={a.id}
                alimento={a}
                isSelected={selectedId === a.id}
                onClick={() => setSelectedId(selectedId === a.id ? null : a.id)}
              />
            ))
          )}
        </div>

        {/* Panel derecho */}
        <div>
          {selected ? (
            <PanelDetalles alimento={selected} />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20">
              <Package className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-400 font-medium">
                Selecciona un producto
              </p>
              <p className="text-sm text-gray-300 mt-1">
                Haz clic en un producto para ver sus detalles y movimientos
              </p>
            </div>
          )}
        </div>
      </div>

      {showEntrada && (
        <EntradaModal
          alimentos={alimentos}
          onClose={() => setShowEntrada(false)}
        />
      )}
      {showSalida && (
        <SalidaModal
          alimentos={alimentos}
          onClose={() => setShowSalida(false)}
        />
      )}
    </div>
  );
}
