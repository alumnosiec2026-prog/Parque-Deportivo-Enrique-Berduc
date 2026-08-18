/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Turno {
  id: string;
  nombre: string;
  dni: string;
  telefono: string;
  deporte: string;
  canchaId: string;
  cancha: string;
  dia: string; // Formato YYYY-MM-DD
  hora: string; // Formato HH:MM
  fechaReserva: string; // ISO String
  asistio: boolean;
  horas: number;
  satisfaccion?: number; // 1 a 5 estrellas
}

export interface VisitaSector {
  id: string;
  fecha: string; // ISO string
  sectorId: string;
  sectorName: string;
}

export interface Visitante {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string; // Formato YYYY-MM-DD
  domicilio: string;
  localidad: string;
  provincia: string;
  telefono: string;
  email: string;
  foto?: string; // Base64 o URL
  codigo: string; // BERDUC-XXXXXX
  fechaRegistro: string; // ISO String
  visitas: number;
  vigencia: string; // ISO String hasta cuando vence el pase
  genero: 'Masculino' | 'Femenino' | 'Otro';
  deporteFavorito?: string;
  deportesFavoritos?: string[];
  historialVisitas?: VisitaSector[];
  contrasena?: string;
}

export interface IntegranteDelegacion {
  nombre: string;
  apellido: string;
  dni: string;
  tipo: 'Deportista' | 'Acompañante';
}

export interface ResponsableDelegacion {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  foto?: string; // Base64 o URL
}

export interface Delegacion {
  id: string;
  nombreEquipo: string;
  origen: string;
  competencia: string;
  diasVisita: number;
  deportes: string; // Deportes seleccionados
  deportePrincipal: string;
  responsable: ResponsableDelegacion;
  integrantes: IntegranteDelegacion[];
  fechaRegistro: string; // ISO String
}

export interface Profesor {
  id: string;
  nombre: string;
  categoria: string;
  contacto: string;
  deporte: string;
}

export interface ActividadDeportiva {
  id: string;
  fecha: string; // YYYY-MM-DD
  deporte: string;
  nombre: string;
  apellido: string;
  dni: string;
  genero: 'Masculino' | 'Femenino' | 'Otro';
  edad: number;
  fechaNacimiento: string;
  horasEntrenadas: number;
  profesor: string;
  categoria: string;
}

export interface Torneo {
  id: string;
  nombre: string;
  deporte: string;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  categoria: string;
  participantes: number;
  equipos: string; // Texto descriptivo o lista
  ganador?: string;
  segundoPuesto?: string;
  tercerPuesto?: string;
  estado: 'Programado' | 'En Curso' | 'Finalizado';
}

export interface ParqueEvento {
  id: string;
  title: string;
  category: string;
  status: 'activo' | 'proximo';
  sector: string;
  fecha: string;
  horaInicio: string;
  duracion: string;
  description: string;
  icon: string;
  entryType?: 'gratis' | 'pago';
  price?: string;
}

