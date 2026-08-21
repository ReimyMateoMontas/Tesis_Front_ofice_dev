export type Rol = "Administrador" | "Veterinario" | "Trabajador";
export type EstadoSalud =
  | "Saludable"
  | "EnTratamiento"
  | "Critico"
  | "Recuperado";
export type EstadoGeneral = "Activo" | "Adoptado" | "Fallecido" | "Transferido";
export type EstadoAdopcion =
  | "Pendiente"
  | "Aprobada"
  | "Rechazada"
  | "Devuelto";
export type EstadoTratamiento = "Activo" | "Completado" | "Suspendido";
export type FormaPago = "Efectivo" | "Transferencia" | "Tarjeta" | "Cheque";
export type TipoAnimal = "Perro" | "Gato" | "Otro";
export type UnidadMedida = "Kg" | "Lb" | "Unidad" | "Bolsa";

export interface LoginResponse {
  token: string;
  nombre: string;
  email: string;
  rol: Rol;
  fotoPerfilUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  fotoPerfilUrl?: string;
}

export interface Especie {
  id: number;
  nombre: string;
}

export interface Animal {
  id: number;
  nombre: string;
  especie?: string;
  especieId?: number;
  raza?: string;
  edad?: number;
  unidadEdad?: "años" | "meses" | "semanas";
  fechaNacimiento?: string; // ISO "yyyy-MM-dd" (real o estimada)
  fechaNacimientoEstimada?: boolean;
  fechaIngreso?: string;
  sexo?: string;
  zonaActual?: string;
  zonaActualId?: number;
  color?: string;
  fotografiaUrl?: string;
  observaciones?: string;
  estadoSalud: EstadoSalud;
  estadoGeneral: EstadoGeneral;
  zona?: string;
  usuarioRegistroId?: number;
}

export interface MovimientoZona {
  id: number;
  zonaOrigen: string;
  zonaDestino: string;
  motivo: string;
  fecha: string;
  usuario: string;
}
export interface Zona {
  id: number;
  name: string;
  description?: string;
  maxCapacity: number;
  currentCapacity: number;
  isActive: boolean;
}

export interface AnimalEnZona {
  id: number;
  nombre: string;
  especie?: string;
  raza?: string;
  fotografiaUrl?: string;
  estadoSalud: string;
}

export interface Movimiento {
  id: number;
  animal: string;
  animalId: number;
  zonaOrigen: string;
  zonaDestino: string;
  motivo?: string;
  fecha: string;
  usuario: string;
}
export interface Adopcion {
  id: number;
  animal: string;
  animalId?: number;
  raza?: string;
  nombreAdoptante: string;
  documentoIdentidad?: string;
  telefonoAdoptante?: string;
  emailAdoptante?: string;
  direccionAdoptante?: string;
  fechaAdopcion: string;
  estadoAdopcion: string;
  usuarioResponsable?: string;
  observaciones?: string;
}

export interface AdopcionDetalle extends Adopcion {
  fechaSeguimiento?: string;
}

export interface Tratamiento {
  id: number;
  animalId: number;
  animal: string;
  fotografiaUrl?: string;
  especie?: string;
  diagnostico: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  viaAdministracion?: string;
  estado: "Activo" | "Completado" | "Suspendido";
  fechaInicio: string;
  fechaFin?: string;
  historialMedicoId: number;
}

export interface Vacuna {
  id: number;
  tipoVacuna: string;
  fechaAplicacion: string;
  proximaDosis?: string;
  lote?: string;
  veterinario: string;
  observaciones?: string;
  vencida: boolean;
  estado?: "Pendiente" | "Completada";
}

export interface TipoVacuna {
  id: number;
  nombre: string;
  especieId: number;
  descripcion?: string;
  duracionMeses?: number;
  obligatoria?: boolean;
}

export interface Medicamento {
  id: number;
  nombre: string;
  principioActivo?: string;
  presentacion?: string;
  concentracion?: string;
}

export interface Veterinario {
  id: number;
  nombre: string;
  apellido: string;
}
export interface Alimento {
  id: number;
  nombre: string;
  tipoAnimal: string;
  marca?: string;
  unidadMedida: string;
  cantidadDisponible: number;
  stockMinimo: number;
  fechaVencimiento?: string;
  activo?: boolean;
  stockBajo: boolean;
}

export interface MovimientoInventario {
  id: number;
  alimentoId: number;
  tipoMovimiento: string;
  cantidad: number;
  motivo?: string;
  fechaMovimiento: string;
  usuarioResponsable: string;
  observaciones?: string;
  costoUnitario?: number;
}
export interface Gasto {
  id: number;
  categoria: string;
  categoriaId: number;
  concepto: string;
  monto: number;
  fechaGasto: string;
  formaPago: string;
  numeroFactura?: string;
  nombreProveedor?: string;
  observaciones?: string;
  registradoPor: string;
  alimentoId?: number;
  medicamentoId?: number;
}

export interface CategoriaGasto {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface ResumenMensual {
  mes: string;
  total: number;
}
export interface Donacion {
  id: number;
  tipoDonacion: string;
  tipoDonacionId: number;
  esMonetaria: boolean;
  montoDinero?: number;
  valorEstimado?: number;
  cantidadArticulos?: number;
  descripcionDonacion?: string;
  formaPago?: string;
  numeroTransaccion?: string;
  fechaDonacion: string;
  donante: string;
  donanteId?: number;
  registradoPor: string;
  observaciones?: string;
  objetivo?: string;
  objetivoId?: number;
  fechaCreacion?: string;
}

export interface Objetivo {
  id: number;
  nombre: string;
  descripcion?: string;
  montoObjetivo: number;
  montoRecaudado: number;
  progreso: number;
  estado: "Activo" | "Completado" | "Pausado";
  fechaInicio: string;
  fechaLimite?: string;
  creadoPor: string;
  observaciones?: string;
  totalDonaciones: number;
}

export interface ResumenDonaciones {
  totalDinero: number;
  totalEspecie: number;
  totalDonaciones: number;
  porTipo: { tipo: string; total: number }[];
}
