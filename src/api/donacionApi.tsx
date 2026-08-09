import { axiosClient } from "./axiosClient";
import type { Donacion, Objetivo, ResumenDonaciones } from "./../types/index";

export const donacionApi = {
  getAll: (): Promise<Donacion[]> =>
    axiosClient.get("/donacion").then((r) => r.data),
  getTipos: () => axiosClient.get("/donacion/tipos").then((r) => r.data),
  getDonantes: () => axiosClient.get("/donacion/donantes").then((r) => r.data),
  getResumen: (): Promise<ResumenDonaciones> =>
    axiosClient.get("/donacion/resumen").then((r) => r.data),
  registrar: (dto: any) =>
    axiosClient.post("/donacion", dto).then((r) => r.data),
  eliminar: (id: number) =>
    axiosClient.delete(`/donacion/${id}`).then((r) => r.data),

  // Objetivos
  getObjetivos: (): Promise<Objetivo[]> =>
    axiosClient.get("/objetivo").then((r) => r.data),
  crearObjetivo: (dto: any) =>
    axiosClient.post("/objetivo", dto).then((r) => r.data),
  editarObjetivo: (id: number, dto: any) =>
    axiosClient.put(`/objetivo/${id}`, dto).then((r) => r.data),
  eliminarObjetivo: (id: number) =>
    axiosClient.delete(`/objetivo/${id}`).then((r) => r.data),
};
