import { axiosClient } from "./axiosClient";
import type {
  Tratamiento,
  Vacuna,
  TipoVacuna,
  Medicamento,
  Veterinario,
} from "../types/index";

export const medicoApi = {
  getTratamientos: (): Promise<Tratamiento[]> =>
    axiosClient.get("/medico/tratamientos").then((r) => r.data),

  registrarHistorial: (dto: {
    animalId: number;
    diagnostico: string;
    sintomas?: string;
    peso?: number;
    temperatura?: number;
    veterinarioId: number;
    observaciones?: string;
  }) => axiosClient.post("/medico/historial", dto).then((r) => r.data),

  registrarTratamiento: (dto: {
    historialMedicoId: number;
    medicamentoId: number;
    dosis: string;
    frecuencia: string;
    viaAdministracion: string;
    fechaInicio: string;
    fechaFin: string;
    veterinarioId: number;
    observaciones?: string;
  }) => axiosClient.post("/medico/tratamiento", dto).then((r) => r.data),

  actualizarEstadoTratamiento: (id: number, estado: string) =>
    axiosClient
      .put(`/medico/tratamiento/${id}/estado`, { estado })
      .then((r) => r.data),

  crearMedicamento: (nombre: string): Promise<{ id: number; nombre: string }> =>
    axiosClient.post("/medico/medicamentos", { nombre }).then((r) => r.data),

  getVacunasPorAnimal: (animalId: number): Promise<Vacuna[]> =>
    axiosClient.get(`/vacuna/animal/${animalId}`).then((r) => r.data),

  getTodasLasVacunas: () =>
    axiosClient.get("/vacuna/todas").then((r) => r.data),

  actualizarEstadoVacuna: (id: number, estado: string) =>
    axiosClient
      .put(`/vacuna/${id}/estado`, { estado })
      .then((r) => r.data),

  getAlertasVacunas: () =>
    axiosClient.get("/vacuna/alertas").then((r) => r.data),

  registrarVacuna: (dto: {
    animalId: number;
    tipoVacunaId: number;
    fechaAplicacion: string;
    proximaDosis?: string;
    lote?: string;
    veterinarioId: number;
    observaciones?: string;
  }) => axiosClient.post("/vacuna", dto).then((r) => r.data),

  registrarFallecimiento: (dto: {
    animalId: number;
    fechaFallecimiento: string;
    causaFallecimiento: string;
    veterinarioId: number;
    usuarioRegistroId: number;
    observaciones?: string;
  }) => axiosClient.post("/fallecimiento", dto).then((r) => r.data),

  getMedicamentos: (): Promise<Medicamento[]> =>
    axiosClient.get("/medico/medicamentos").then((r) => r.data),

  getTiposVacuna: (): Promise<TipoVacuna[]> =>
    axiosClient.get("/medico/tipos-vacuna").then((r) => r.data),

  getVeterinarios: (): Promise<Veterinario[]> =>
    axiosClient.get("/medico/veterinarios").then((r) => r.data),

  getallTratamientos: (): Promise<Tratamiento[]> =>
    axiosClient.get("/medico/tratamientosall").then((r) => r.data),

  // NUEVO: timeline unificada por animal (consultas + vacunas + fallecimiento)
  getTimeline: (animalId: number): Promise<unknown[]> =>
    axiosClient
      .get(`/medico/historial/${animalId}/timeline`)
      .then((r) => r.data),
};
