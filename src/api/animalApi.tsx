import { axiosClient } from "./axiosClient";
import type { Animal } from "../types";

export const animalApi = {
  getAll: async (): Promise<Animal[]> => {
    const { data } = await axiosClient.get("/animal");
    return data;
  },

  getById: async (id: number): Promise<Animal> => {
    const { data } = await axiosClient.get(`/animal/${id}`);
    return data;
  },

  create: async (
    payload: Omit<
      Animal,
      "id" | "estadoSalud" | "estadoGeneral" | "zona" | "zonaActual" | "especie"
    > & {
      especieId: number;
      zonaActualId: number;
      usuarioRegistroId: number;
    },
  ) => {
    const { data } = await axiosClient.post("/animal", payload);
    return data;
  },

  update: async (id: number, payload: Partial<Animal>) => {
    const { data } = await axiosClient.put(`/animal/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    const { data } = await axiosClient.delete(`/animal/${id}`);
    return data;
  },

  getEspecie: async () => {
    const { data } = await axiosClient.get("/animal/especie");
    return data;
  },

  getMovimientos: async (animalId: number): Promise<MovimientoZona[]> => {
    const { data } = await axiosClient.get(`/zone/movimientos/${animalId}`);
    return data;
  },
};

interface MovimientoZona {
  id: number;
  zonaOrigen: string;
  zonaDestino: string;
  motivo: string;
  fecha: string;
  usuario: string;
}
