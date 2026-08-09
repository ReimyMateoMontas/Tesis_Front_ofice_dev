import { axiosClient } from "./axiosClient";
import type { Alimento, MovimientoInventario } from "../types/index";

export const inventarioApi = {
  getAlimentos: () => axiosClient.get("/inventario").then((r) => r.data),

  getAlimento: (id: number): Promise<Alimento> =>
    axiosClient.get(`/inventario/${id}`).then((r) => r.data),

  crearAlimento: (dto: {
    nombre: string;
    tipoAnimal: string;
    marca?: string;
    unidadMedida: string;
    cantidadDisponible: number;
    stockMinimo: number;
    fechaVencimiento?: string;
  }) => axiosClient.post("/inventario", dto).then((r) => r.data),

  registrarEntrada: (
    alimentoId: number,
    dto: {
      cantidad: number;
      motivo?: string;
      proveedor?: string;
      costoUnitario?: number;
      observaciones?: string;
      usuarioResponsableId: number;
    },
  ) =>
    axiosClient
      .post(`/inventario/${alimentoId}/entrada`, dto)
      .then((r) => r.data),

  registrarSalida: (
    alimentoId: number,
    dto: {
      cantidad: number;
      motivo: string;
      observaciones?: string;
      usuarioResponsableId: number;
    },
  ) =>
    axiosClient
      .post(`/inventario/${alimentoId}/salida`, dto)
      .then((r) => r.data),

  getMovimientos: (alimentoId: number): Promise<MovimientoInventario[]> =>
    axiosClient
      .get(`/inventario/${alimentoId}/movimientos`)
      .then((r) => r.data),
};
