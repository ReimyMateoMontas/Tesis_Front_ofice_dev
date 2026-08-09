import { axiosClient } from "./axiosClient";
import type { Gasto, CategoriaGasto, ResumenMensual } from "../types/index";

export const gastoApi = {
  getGastos: (): Promise<Gasto[]> =>
    axiosClient.get("/gasto").then((r) => r.data),

  getCategorias: (): Promise<CategoriaGasto[]> =>
    axiosClient.get("/gasto/categorias").then((r) => r.data),

  getResumenMensual: (): Promise<ResumenMensual[]> =>
    axiosClient.get("/gasto/resumen/mensual").then((r) => r.data),
  getSerieMensual: (
    year?: number,
  ): Promise<{ anio: number; mes: number; total: number }[]> =>
    axiosClient
      .get("/gasto/resumen/serie-mensual", {
        params: year ? { year } : {},
      })
      .then((r) => r.data),

  crearGasto: (dto: {
    categoriaGastoId: number;
    concepto: string;
    monto: number;
    fechaGasto: string;
    formaPago: string;
    numeroFactura?: string;
    numeroTransaccion?: string;
    nombreProveedor?: string;
    telefonoProveedor?: string;
    alimentoId?: number;
    medicamentoId?: number;
    observaciones?: string;
    usuarioRegistroId: number;
  }) => axiosClient.post("/gasto", dto).then((r) => r.data),

  eliminarGasto: (id: number) =>
    axiosClient.delete(`/gasto/${id}`).then((r) => r.data),
};
