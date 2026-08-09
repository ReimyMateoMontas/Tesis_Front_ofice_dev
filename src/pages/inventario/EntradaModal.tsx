import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { inventarioApi } from "../../api/inventarioApi";
import { useAppSelector } from "../../hooks/hooks";
import type { Alimento } from "../../types/index";

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";

const UNIDADES = [
  "kg",
  "g",
  "lb",
  "sacos",
  "latas",
  "fundas",
  "paquetes",
  "unidades",
  "ml",
  "l",
];
const TIPOS_ANIMAL = ["Perro", "Gato", "Ave", "Conejo", "Reptil", "Otro"];

interface Props {
  alimentos: Alimento[];
  productoPreseleccionado?: Alimento | null;
  datosGasto?: { nombre?: string; cantidad?: number; unidad?: string } | null;
  onClose: () => void;
}

export function EntradaModal({
  alimentos,
  productoPreseleccionado,
  datosGasto,
  onClose,
}: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const [modo, setModo] = useState<"nuevo" | "reposicion">(
    productoPreseleccionado ? "reposicion" : "nuevo",
  );

  const [form, setForm] = useState({
    // Nuevo producto
    nombre: datosGasto?.nombre ?? "",
    tipoAnimal: "Perro",
    marca: "",
    unidadMedida: datosGasto?.unidad ?? "kg",
    stockMinimo: "",
    fechaVencimiento: "",
    // Reposicion
    alimentoId: productoPreseleccionado
      ? String(productoPreseleccionado.id)
      : "",
    // Comunes
    cantidad: datosGasto?.cantidad ? String(datosGasto.cantidad) : "",
    proveedor: "",
    costoUnitario: "",
    observaciones: "",
  });

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const mutNuevo = useMutation({
    mutationFn: async () => {
      const alimento = await inventarioApi.crearAlimento({
        nombre: form.nombre,
        tipoAnimal: form.tipoAnimal,
        marca: form.marca || undefined,
        unidadMedida: form.unidadMedida,
        cantidadDisponible: Number(form.cantidad),
        stockMinimo: Number(form.stockMinimo),
        fechaVencimiento: form.fechaVencimiento || undefined,
      });
      return alimento;
    },
    onSuccess: () => {
      toast.success("Producto registrado al inventario");
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al registrar"),
  });

  const mutReposicion = useMutation({
    mutationFn: () =>
      inventarioApi.registrarEntrada(Number(form.alimentoId), {
        cantidad: Number(form.cantidad),
        proveedor: form.proveedor || undefined,
        costoUnitario: form.costoUnitario
          ? Number(form.costoUnitario)
          : undefined,
        observaciones: form.observaciones || undefined,
        usuarioResponsableId: user!.id,
      }),
    onSuccess: () => {
      toast.success("Stock actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al registrar entrada"),
  });

  const selectedAlimento = alimentos.find(
    (a) => a.id === Number(form.alimentoId),
  );
  const isPending = mutNuevo.isPending || mutReposicion.isPending;

  const handleSubmit = () => {
    if (modo === "nuevo") mutNuevo.mutate();
    else mutReposicion.mutate();
  };

  const canSubmit =
    modo === "nuevo"
      ? form.nombre && form.cantidad && form.stockMinimo
      : form.alimentoId && form.cantidad;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Registrar Entrada
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Selector modo */}
          <div className="flex gap-2 bg-gray-50 rounded-xl p-1.5">
            {(["nuevo", "reposicion"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModo(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  modo === m
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                {m === "nuevo" ? "🆕 Nuevo producto" : "📦 Reposición"}
              </button>
            ))}
          </div>

          {modo === "nuevo" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre *
                </label>
                <input
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  placeholder="Ej: Alimento para perros adultos"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tipo de animal *
                  </label>
                  <select
                    value={form.tipoAnimal}
                    onChange={(e) => set("tipoAnimal", e.target.value)}
                    className={inputClass}
                  >
                    {TIPOS_ANIMAL.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Marca
                  </label>
                  <input
                    value={form.marca}
                    onChange={(e) => set("marca", e.target.value)}
                    placeholder="Ej: ProPlan"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Unidad de medida *
                  </label>
                  <select
                    value={form.unidadMedida}
                    onChange={(e) => set("unidadMedida", e.target.value)}
                    className={inputClass}
                  >
                    {UNIDADES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stock mínimo *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockMinimo}
                    onChange={(e) => set("stockMinimo", e.target.value)}
                    placeholder="Ej: 50"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fecha de vencimiento
                </label>
                <input
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={(e) => set("fechaVencimiento", e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Producto *
                </label>
                <select
                  value={form.alimentoId}
                  onChange={(e) => set("alimentoId", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona un producto</option>
                  {alimentos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} ({a.tipoAnimal})
                    </option>
                  ))}
                </select>
              </div>
              {selectedAlimento && (
                <div className="bg-blue-50 rounded-xl p-3 text-sm">
                  <p className="text-gray-500">Stock actual</p>
                  <p className="font-bold text-blue-700 text-lg">
                    {selectedAlimento.cantidadDisponible}{" "}
                    {selectedAlimento.unidadMedida}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Campos comunes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cantidad {modo === "reposicion" ? "a agregar" : "inicial"} *
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.cantidad}
                onChange={(e) => set("cantidad", e.target.value)}
                placeholder="Ej: 40"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Costo unitario
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.costoUnitario}
                onChange={(e) => set("costoUnitario", e.target.value)}
                placeholder="Ej: 2500"
                className={inputClass}
              />
            </div>
          </div>

          {/* Stock resultante si es reposición */}
          {modo === "reposicion" && selectedAlimento && form.cantidad && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm">
              <span className="text-gray-500">Nuevo stock estimado: </span>
              <span className="font-bold text-green-700">
                {(
                  selectedAlimento.cantidadDisponible + Number(form.cantidad)
                ).toFixed(1)}{" "}
                {selectedAlimento.unidadMedida}
              </span>
              <span className="text-gray-400 ml-2">
                ({selectedAlimento.cantidadDisponible} + {form.cantidad})
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Proveedor
            </label>
            <input
              value={form.proveedor}
              onChange={(e) => set("proveedor", e.target.value)}
              placeholder="Nombre del proveedor"
              className={inputClass}
            />
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
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
              </>
            ) : (
              "Registrar Entrada"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
