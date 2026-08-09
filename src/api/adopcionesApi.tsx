import { axiosClient } from "./axiosClient";
import type { Adopcion, AdopcionDetalle } from "../types/index";

export const adopcionApi = {
  getAll: (): Promise<Adopcion[]> =>
    axiosClient.get("/adopcion").then((r) => r.data),

  getById: (id: number): Promise<AdopcionDetalle> =>
    axiosClient.get(`/adopcion/${id}`).then((r) => r.data),

  registrar: (payload: {
    animalId: number;
    nombreAdoptante: string;
    telefonoAdoptante?: string;
    emailAdoptante?: string;
    direccionAdoptante?: string;
    documentoIdentidad?: string;
    fechaAdopcion: string;
    usuarioResponsableId: number;
  }): Promise<{ mensaje: string }> =>
    axiosClient.post("/adopcion", payload).then((r) => r.data),

  actualizarEstado: (
    id: number,
    estado: string,
    observaciones?: string,
  ): Promise<{ mensaje: string }> =>
    axiosClient
      .put(`/adopcion/${id}/estado`, { estado, observaciones })
      .then((r) => r.data),
};
