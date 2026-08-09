import { axiosClient } from "./axiosClient";
import type { Zona, AnimalEnZona, Movimiento } from "./../types";

export const zonaApi = {
  getZonas: (): Promise<Zona[]> => axiosClient.get("/zone").then((r) => r.data),

  getAnimalesByZona: (zonaId: number): Promise<AnimalEnZona[]> =>
    axiosClient.get(`/zone/${zonaId}/animales`).then((r) => r.data),

  getMovimientos: (): Promise<Movimiento[]> =>
    axiosClient.get("/zone/movimientos").then((r) => r.data),

  moverAnimal: (payload: {
    animalId: number;
    zonaDestinoId: number;
    motivo: string;
  }): Promise<void> =>
    axiosClient.post("/zone/mover-animal", payload).then((r) => r.data),
};
