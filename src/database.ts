/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Turno, Visitante, Delegacion, Profesor, ActividadDeportiva, Torneo, ParqueEvento } from './types';

class InMemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

class SyncingStorage implements Storage {
  private baseStorage: Storage | InMemoryStorage;

  constructor(baseStorage: Storage | InMemoryStorage) {
    this.baseStorage = baseStorage;
  }

  get length(): number {
    return (this.baseStorage as any).length || 0;
  }

  key(index: number): string | null {
    return (this.baseStorage as any).key ? (this.baseStorage as any).key(index) : null;
  }

  getItem(key: string): string | null {
    return this.baseStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.baseStorage.setItem(key, value);
    // Background push to Supabase for park configurations
    if (key.startsWith('parque_')) {
      try {
        fetch(`/api/supabase/save/${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: JSON.parse(value) })
        }).catch(err => console.warn(`Background sync failed for key ${key}:`, err));
      } catch (e) {
        // Catch parsing errors safely
      }
    }
  }

  removeItem(key: string): void {
    this.baseStorage.removeItem(key);
  }

  clear(): void {
    this.baseStorage.clear();
  }
}

function getSafeLocalStorage() {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return new SyncingStorage(window.localStorage);
  } catch (e) {
    console.warn("localStorage is not accessible, using in-memory fallback:", e);
    return new SyncingStorage(new InMemoryStorage());
  }
}

export const safeLocalStorage = getSafeLocalStorage();

// Supabase synchronization helpers
export interface SupabaseStatus {
  configured: boolean;
  url: string;
  tableExists: boolean;
  message?: string;
  error?: string;
}

export async function obtenerEstadoSupabase(): Promise<SupabaseStatus> {
  try {
    const res = await fetch('/api/supabase/status');
    if (res.ok) {
      return await res.json();
    }
    return { configured: false, url: '', tableExists: false, message: 'No se pudo obtener el estado del servidor de backend.' };
  } catch (e: any) {
    return { configured: false, url: '', tableExists: false, error: e.message || e };
  }
}

export async function syncAllFromSupabase(): Promise<boolean> {
  const keys = [
    'parque_berduc_turnos',
    'parque_visitantes',
    'parque_delegaciones',
    'parque_berduc_profesores',
    'parque_actividad_deportiva',
    'parque_torneos',
    'parque_berduc_eventos'
  ];
  try {
    let anySynced = false;
    for (const key of keys) {
      const res = await fetch(`/api/supabase/load/${key}`);
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data) {
          // Directly write to the raw window.localStorage or baseStorage to avoid infinite loops,
          // or we can write to safeLocalStorage because SyncingStorage's setItem pushes but load doesn't trigger write-backs if values are identical.
          // To be safe, we temporarily disable or just write to standard localStorage or wrap it safely.
          const base = (safeLocalStorage as any).baseStorage;
          base.setItem(key, JSON.stringify(body.data));
          anySynced = true;
        }
      }
    }
    return anySynced;
  } catch (error) {
    console.error("Error syncing from Supabase:", error);
    return false;
  }
}

// Claves de localStorage
const KEY_TURNOS = 'parque_berduc_turnos';
const KEY_VISITANTES = 'parque_visitantes';
const KEY_DELEGACIONES = 'parque_delegaciones';
const KEY_PROFESORES = 'parque_berduc_profesores';
const KEY_ACTIVIDAD = 'parque_actividad_deportiva';
const KEY_TORNEOS = 'parque_torneos';
const KEY_EVENTOS = 'parque_berduc_eventos';

// Profesores iniciales hardcodeados
const PROFESORES_INICIALES: Profesor[] = [
  { id: 'p1', nombre: "Carlos 'Charly' Álvarez", categoria: "Elite y Lanzamientos", contacto: "+54 343 154-889911", deporte: "atletismo" },
  { id: 'p1b', nombre: "Marta Rodríguez", categoria: "Velocidad y Saltos", contacto: "+54 343 154-889912", deporte: "atletismo" },
  { id: 'p2', nombre: "Mariano Galarza", categoria: "Primera y Juveniles M18", contacto: "+54 343 154-223344", deporte: "futbol" },
  { id: 'p3', nombre: "Flavia Siede", categoria: "Natación Infantil y Adultos", contacto: "+54 343 154-334455", deporte: "natacion" },
  { id: 'p3b', nombre: "Ariel Albornoz", categoria: "Federados y Competición", contacto: "+54 343 154-334456", deporte: "natacion" },
  { id: 'p4', nombre: "Sofía Mildemberger", categoria: "Mini Vóley y Maxivóley", contacto: "+54 343 154-445566", deporte: "voley" },
  { id: 'p5', nombre: "Gustavo Brassesco", categoria: "Clases Avanzadas e Iniciación", contacto: "+54 343 154-556677", deporte: "padel" },
  { id: 'p6', nombre: "Esteban 'Bicho' Gómez", categoria: "U15, U17 y Mayores", contacto: "+54 343 154-667788", deporte: "basquet" },
  { id: 'p7', nombre: "Walter Galarza", categoria: "Cadetes y Primera", contacto: "+54 343 154-778899", deporte: "handball" },
  { id: 'p8', nombre: "Daniela Martínez", categoria: "Musculación y Fuerza Funcional", contacto: "+54 343 154-990011", deporte: "musculacion" }
];

// Torneos iniciales
const TORNEOS_INICIALES: Torneo[] = [
  {
    id: 't1',
    nombre: "Gran Prix Entrerriano - Homenaje Nazareno Sasia",
    deporte: "atletismo",
    fechaInicio: "2026-05-15",
    fechaFin: "2026-05-17",
    categoria: "Mayores Libre",
    participantes: 180,
    equipos: "Berduc, Gualeguaychú, Concordia, Paraná Atléticos, Rosario Tracker",
    ganador: "Nazareno Sasia (Lanzamiento de Bala)",
    segundoPuesto: "Julián Molina",
    tercerPuesto: "Federico Bruno",
    estado: "Finalizado"
  },
  {
    id: 't2',
    nombre: "Copa Ciudad de Paraná - Básquet",
    deporte: "basquet",
    fechaInicio: "2026-06-10",
    fechaFin: "2026-06-14",
    categoria: "U17 Masculino",
    participantes: 96,
    equipos: "Club Ciclista, Estudiantes, Rowing, Escuela Municipal Berduc, Sionista",
    estado: "Programado"
  },
  {
    id: 't3',
    nombre: "Torneo de Natación 'Delfines del Berduc'",
    deporte: "natacion",
    fechaInicio: "2026-05-20",
    fechaFin: "2026-05-20",
    categoria: "Juveniles y Cadetes",
    participantes: 120,
    equipos: "Berduc, Club Regatas Santa Fe, Echagüe, Rowing, Estudiantes de Paraná",
    ganador: "Club Rowing Paraná",
    segundoPuesto: "Parque Berduc",
    tercerPuesto: "Club Atlético Echagüe",
    estado: "Finalizado"
  },
  {
    id: 't4',
    nombre: "Abierto de Pádel Oro Berduc",
    deporte: "padel",
    fechaInicio: "2026-06-01",
    fechaFin: "2026-06-04",
    categoria: "Segunda Caballeros",
    participantes: 32,
    equipos: "16 parejas locales registradas de Paraná, Crespo y Diamante",
    estado: "En Curso"
  }
];

// Actividades deportivas iniciales (registro para métricas hermosas de entrada)
const ACTIVIDADES_INICIALES: ActividadDeportiva[] = [
  { id: 'act1', fecha: '2026-06-01', deporte: 'atletismo', nombre: 'Lucas', apellido: 'Gómez', dni: '45123456', genero: 'Masculino', edad: 16, fechaNacimiento: '2010-02-15', horasEntrenadas: 2, profesor: "Carlos 'Charly' Álvarez", categoria: 'Velocidad y Saltos' },
  { id: 'act2', fecha: '2026-06-01', deporte: 'natacion', nombre: 'Milena', apellido: 'Pérez', dni: '48765432', genero: 'Femenino', edad: 11, fechaNacimiento: '2015-05-12', horasEntrenadas: 1, profesor: "Flavia Siede", categoria: 'Natación Infantil' },
  { id: 'act3', fecha: '2026-06-01', deporte: 'padel', nombre: 'Carlos', apellido: 'Méndez', dni: '32123456', genero: 'Masculino', edad: 39, fechaNacimiento: '1987-07-22', horasEntrenadas: 1.5, profesor: "Gustavo Brassesco", categoria: 'Clases Avanzadas' },
  { id: 'act4', fecha: '2026-06-02', deporte: 'voley', nombre: 'Agustina', apellido: 'Solís', dni: '43987654', genero: 'Femenino', edad: 21, fechaNacimiento: '2005-11-04', horasEntrenadas: 2, profesor: "Sofía Mildemberger", categoria: 'Maxivóley' },
  { id: 'act5', fecha: '2026-06-02', deporte: 'musculacion', nombre: 'Juan José', apellido: 'Vargas', dni: '22876123', genero: 'Masculino', edad: 54, fechaNacimiento: '1972-01-30', horasEntrenadas: 1, profesor: "Daniela Martínez", categoria: 'Musculación' },
  { id: 'act6', fecha: '2026-06-02', deporte: 'futbol', nombre: 'Tomás', apellido: 'Grasso', dni: '46123987', genero: 'Masculino', edad: 15, fechaNacimiento: '2011-08-12', horasEntrenadas: 2, profesor: "Mariano Galarza", categoria: 'Juveniles M18' },
  { id: 'act7', fecha: '2026-05-28', deporte: 'basquet', nombre: 'Estanislao', apellido: 'Ríos', dni: '47123999', genero: 'Masculino', edad: 13, fechaNacimiento: '2013-03-24', horasEntrenadas: 1.5, profesor: "Esteban 'Bicho' Gómez", categoria: 'U15' },
  { id: 'act8', fecha: '2026-05-29', deporte: 'handball', nombre: 'Sofia', apellido: 'Fridman', dni: '42333444', genero: 'Femenino', edad: 23, fechaNacimiento: '2003-09-12', horasEntrenadas: 2, profesor: "Walter Galarza", categoria: 'Primera' },
  { id: 'act9', fecha: '2026-05-30', deporte: 'atletismo', nombre: 'Valentina', apellido: 'Acosta', dni: '45888999', genero: 'Femenino', edad: 17, fechaNacimiento: '2009-04-03', horasEntrenadas: 2, profesor: "Marta Rodríguez", categoria: 'Elite y Lanzamientos' },
  { id: 'act10', fecha: '2026-05-31', deporte: 'natacion', nombre: 'Esteban', apellido: 'Schumann', dni: '28666555', genero: 'Otro', edad: 47, fechaNacimiento: '1978-12-10', horasEntrenadas: 1, profesor: "Ariel Albornoz", categoria: 'Adultos Competición' }
];

// Turnos iniciales sembrados (algunos futuros para mostrar en la lista activa, otros pasados)
const TURNOS_INICIALES: Turno[] = [
  {
    id: 'turn1',
    nombre: 'Javier Domínguez',
    dni: '35123987',
    telefono: '+54 343 155-998822',
    deporte: 'padel',
    canchaId: 'padel',
    cancha: 'Pádel profesional (Cancha 1)',
    dia: '2026-06-08',
    hora: '17:00',
    fechaReserva: '2026-06-02T19:30:00.000Z',
    asistio: false,
    horas: 1.5
  },
  {
    id: 'turn2',
    nombre: 'Carla Benítez',
    dni: '41987541',
    telefono: '+54 343 154-123456',
    deporte: 'atletismo',
    canchaId: 'atletismo',
    cancha: 'Pista de Atletismo de 6 carriles',
    dia: '2026-06-08',
    hora: '15:00',
    fechaReserva: '2026-06-02T20:15:00.000Z',
    asistio: false,
    horas: 1
  },
  {
    id: 'turn3',
    nombre: 'Rodolfo Alarcón',
    dni: '18445123',
    telefono: '+54 343 154-998811',
    deporte: 'natacion',
    canchaId: 'natacion',
    cancha: 'Pileta olímpica climatizada',
    dia: '2026-06-01', // Vencido
    hora: '16:00',
    fechaReserva: '2026-05-30T10:00:00.000Z',
    asistio: true,
    horas: 1
  }
];

// Visitantes iniciales (algunos activos/recientes, otros antiguos)
const VISITANTES_INICIALES: Visitante[] = [
  {
    id: 'vis1',
    nombre: 'Nazareno',
    apellido: 'Sasia',
    dni: '43123456',
    fechaNacimiento: '2001-01-05',
    domicilio: 'Calle Nogoyá 445',
    localidad: 'Paraná',
    provincia: 'Entre Ríos',
    telefono: '+54 343 411-2233',
    email: 'nasasia@entrerios.edu.ar',
    foto: '',
    codigo: 'BERDUC-431234',
    fechaRegistro: '2026-06-02T15:00:00.000Z', // Menos de 24 horas (activo)
    visitas: 5,
    vigencia: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    genero: 'Masculino',
    contrasena: '123456'
  },
  {
    id: 'vis2',
    nombre: 'Sofía',
    apellido: 'Mildemberger',
    dni: '40123987',
    fechaNacimiento: '1997-09-12',
    domicilio: 'Moreno 120',
    localidad: 'Paraná',
    provincia: 'Entre Ríos',
    telefono: '+54 343 154-445566',
    email: 'sofia.mild@gmail.com',
    foto: '',
    codigo: 'BERDUC-401239',
    fechaRegistro: '2026-06-02T10:00:00.000Z', // Activo
    visitas: 12,
    vigencia: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    genero: 'Femenino',
    contrasena: '123456'
  },
  {
    id: 'vis3',
    nombre: 'Germán',
    apellido: 'Lauro',
    dni: '30765432',
    fechaNacimiento: '1984-04-02',
    domicilio: 'San Martín 920',
    localidad: 'Paraná',
    provincia: 'Entre Ríos',
    telefono: '+54 11 1234-5678',
    email: 'glauro@coarg.org.ar',
    foto: '',
    codigo: 'BERDUC-307654',
    fechaRegistro: '2026-05-15T09:00:00.000Z', // Vencido
    visitas: 1,
    vigencia: '2026-05-16T09:00:00.000Z',
    genero: 'Masculino',
    contrasena: '123456'
  }
];

// Delegaciones iniciales
const DELEGACIONES_INICIALES: Delegacion[] = [
  {
    id: 'del1',
    nombreEquipo: 'Club Atlético Talleres de Paraná',
    origen: 'Paraná, Entre Ríos',
    competencia: 'Copa Regional de Vóley Femenino',
    diasVisita: 2,
    deportes: 'Vóley',
    deportePrincipal: 'voley',
    responsable: {
      nombre: 'Lucio',
      apellido: 'Pérez',
      dni: '25445678',
      telefono: '3431548812',
      email: 'lperez@talleres.com'
    },
    integrantes: [
      { nombre: 'Martina', apellido: 'Sosa', dni: '48123456', tipo: 'Deportista' },
      { nombre: 'Delfina', apellido: 'García', dni: '48333222', tipo: 'Deportista' },
      { nombre: 'Paula', apellido: 'González', dni: '48555666', tipo: 'Deportista' },
      { nombre: 'Romina', apellido: 'Fernández', dni: '22345678', tipo: 'Acompañante' }
    ],
    fechaRegistro: '2026-06-01T15:00:00.000Z'
  }
];

// Eventos iniciales sembrados
const EVENTOS_INICIALES: ParqueEvento[] = [
  {
    id: 'evt-1',
    title: 'Torneo Relámpago Intercolegial de Básquet',
    category: 'Escolar',
    status: 'activo',
    sector: 'Gimnasio Cubierto (Básquetbol)',
    fecha: 'Hoy, 16 de Junio',
    horaInicio: '15:30 hs',
    duracion: 'Iniciado (Finaliza 18:00 hs)',
    description: 'Encuentro competitivo entre escuelas de Paraná buscando integrar y potenciar el básquet juvenil.',
    icon: 'Target',
  },
  {
    id: 'evt-2',
    title: 'Gimnasia Integral y Movilidad para Adultos Mayores',
    category: 'Salud / Recreación',
    status: 'activo',
    sector: 'Playón Polideportivo Abierto',
    fecha: 'Hoy, 16 de Junio',
    horaInicio: '16:00 hs',
    duracion: 'En curso (Finaliza 17:30 hs)',
    description: 'Sesión para la tercera edad enfocada en el bienestar físico, coordinada por entrenadoras certificadas del parque.',
    icon: 'Smile',
  },
  {
    id: 'evt-3',
    title: 'Clínica de Pádel Infantil (Iniciación)',
    category: 'Formativo',
    status: 'activo',
    sector: 'Canchas de Pádel Vidriadas de Césped Sintético',
    fecha: 'Hoy, 16 de Junio',
    horaInicio: '15:00 hs',
    duracion: 'En curso (Finaliza 17:00 hs)',
    description: 'Prácticas introductorias gratuitas para chicos de 8 a 15 años en nuestras impecables pistas profesionales.',
    icon: 'Activity',
  },
  {
    id: 'evt-4',
    title: 'Selectivo Provincial de Atletismo de Velocidad U18',
    category: 'Competencia Deportiva',
    status: 'proximo',
    sector: 'Pista de Atletismo (Sector Recta Principal)',
    fecha: 'Sábado 20 de Junio',
    horaInicio: '08:30 hs',
    duracion: '08:30 a 14:00 hs',
    description: 'Pruebas selectivas de 100m, 200m y postas para conformar la delegación entrerriana rumbo al Campeonato Nacional U18.',
    icon: 'Flame',
  },
  {
    id: 'evt-5',
    title: 'Maratón Acuática y Aquafitness Solidaria',
    category: 'Solidario / Comunitario',
    status: 'proximo',
    sector: 'Pileta Olímpica Climatizada',
    fecha: 'Domingo 21 de Junio',
    horaInicio: '10:00 hs',
    duracion: '10:00 a 13:00 hs',
    description: 'Clase colectiva abierta de aquagym con música en vivo. Entrada libre: Se solicita un alimento no perecedero para merenderos de Paraná.',
    icon: 'Droplets',
  },
  {
    id: 'evt-6',
    title: 'Liga Paranaense de Vóley Masculino (Fecha 7)',
    category: 'Federado / Oficial',
    status: 'proximo',
    sector: 'Gimnasio Cubierto (Vóley - Parquet Flotante)',
    fecha: 'Lunes 22 de Junio',
    horaInicio: '19:30 hs',
    duracion: 'Partidos estelares nocturnos',
    description: 'Cruce apasionante por el torneo oficial de la APV. Entrada completamente libre y gratuita para alentar a los equipos locales.',
    icon: 'Sparkles',
  },
  {
    id: 'evt-7',
    title: 'Entrenamiento Abierto y Encuentro de Rugby Infantil',
    category: 'Deporte Formativo',
    status: 'proximo',
    sector: 'Suela de Césped del Campo Principal de Rugby',
    fecha: 'Martes 23 de Junio',
    horaInicio: '16:30 hs',
    duracion: '16:30 a 18:30 hs',
    description: 'Prácticas recreativas de rugby tag (sin contacto) destinadas a que los niños incorporen valores de camaradería y destreza.',
    icon: 'Trophy',
  },
];

// Funciones auxiliares para verificar si localStorage está vacío e inicializarlo
export function inicializarLocalStorage() {
  if (!safeLocalStorage.getItem(KEY_PROFESORES)) {
    safeLocalStorage.setItem(KEY_PROFESORES, JSON.stringify(PROFESORES_INICIALES));
  }
  if (!safeLocalStorage.getItem(KEY_TORNEOS)) {
    safeLocalStorage.setItem(KEY_TORNEOS, JSON.stringify(TORNEOS_INICIALES));
  }
  if (!safeLocalStorage.getItem(KEY_ACTIVIDAD)) {
    safeLocalStorage.setItem(KEY_ACTIVIDAD, JSON.stringify(ACTIVIDADES_INICIALES));
  }
  if (!safeLocalStorage.getItem(KEY_TURNOS)) {
    safeLocalStorage.setItem(KEY_TURNOS, JSON.stringify(TURNOS_INICIALES));
  }
  if (!safeLocalStorage.getItem(KEY_VISITANTES)) {
    safeLocalStorage.setItem(KEY_VISITANTES, JSON.stringify(VISITANTES_INICIALES));
  }
  if (!safeLocalStorage.getItem(KEY_DELEGACIONES)) {
    safeLocalStorage.setItem(KEY_DELEGACIONES, JSON.stringify(DELEGACIONES_INICIALES));
  }
  if (!safeLocalStorage.getItem(KEY_EVENTOS)) {
    safeLocalStorage.setItem(KEY_EVENTOS, JSON.stringify(EVENTOS_INICIALES));
  }
}

// ------------------- CRUD TURNOS -------------------

export function cargarTurnos(): Turno[] {
  inicializarLocalStorage();
  const data = safeLocalStorage.getItem(KEY_TURNOS);
  return data ? JSON.parse(data) : [];
}

export function guardarTurnos(turnos: Turno[]): void {
  safeLocalStorage.setItem(KEY_TURNOS, JSON.stringify(turnos));
}

export function agregarTurno(turno: Omit<Turno, 'id' | 'fechaReserva' | 'asistio'>): Turno {
  const turnos = cargarTurnos();
  const nuevoTurno: Turno = {
    ...turno,
    id: 'turn-' + Math.random().toString(36).substring(2, 9),
    fechaReserva: new Date().toISOString(),
    asistio: false
  };
  turnos.push(nuevoTurno);
  guardarTurnos(turnos);

  // Registrar en actividad deportiva también para estadísticas
  agregarActividadDesdeTurno(nuevoTurno);

  return nuevoTurno;
}

export function eliminarTurno(id: string): void {
  const turnos = cargarTurnos();
  const filtrados = turnos.filter(t => t.id !== id);
  guardarTurnos(filtrados);
}

export function eliminarTodosLosTurnos(): void {
  guardarTurnos([]);
}

// Calcula si el turno ya ocurrió
export function esTurnoVencido(turno: Turno): boolean {
  if (!turno || !turno.dia || !turno.hora) return true;
  // Ej: dia="2026-06-08", hora="15:00"
  try {
    const [año, mes, dia] = turno.dia.split('-').map(Number);
    const [horas, minutos] = turno.hora.split(':').map(Number);
    if (isNaN(año) || isNaN(mes) || isNaN(dia) || isNaN(horas) || isNaN(minutos)) return true;
    const fechaTurno = new Date(año, mes - 1, dia, horas, minutos);
    return fechaTurno.getTime() < Date.now();
  } catch (e) {
    return true;
  }
}

export function obtenerTurnosActivos(): Turno[] {
  const turnos = cargarTurnos();
  return turnos.filter(t => !esTurnoVencido(t));
}

export function obtenerTodosLosTurnos(): Turno[] {
  return cargarTurnos();
}

// ------------------- CRUD VISITANTES -------------------

export function cargarVisitantes(): Visitante[] {
  inicializarLocalStorage();
  const data = safeLocalStorage.getItem(KEY_VISITANTES);
  return data ? JSON.parse(data) : [];
}

export function guardarVisitantes(visitantes: Visitante[]): void {
  safeLocalStorage.setItem(KEY_VISITANTES, JSON.stringify(visitantes));
}

export function registrarVisitante(
  visitante: Omit<Visitante, 'id' | 'codigo' | 'fechaRegistro' | 'visitas' | 'vigencia'> & {
    sectorIngresoId?: string;
    sectorIngresoName?: string;
  }
): Visitante {
  const { sectorIngresoId, sectorIngresoName, ...datosBase } = visitante;
  const visitantes = cargarVisitantes();
  // Verificar si ya existe por DNI para incrementar visitas
  const existente = visitantes.find(v => v.dni.replace(/\D/g, '') === datosBase.dni.replace(/\D/g, ''));

  if (existente) {
    existente.visitas += 1;
    existente.fechaRegistro = new Date().toISOString();
    existente.vigencia = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Pase de 24hs
    // Actualizar otros campos que puedan haber cambiado
    existente.domicilio = datosBase.domicilio;
    existente.localidad = datosBase.localidad;
    existente.provincia = datosBase.provincia;
    existente.telefono = datosBase.telefono;
    existente.email = datosBase.email;
    if (datosBase.foto) existente.foto = datosBase.foto;
    if (datosBase.deporteFavorito) existente.deporteFavorito = datosBase.deporteFavorito;
    if (datosBase.deportesFavoritos) existente.deportesFavoritos = datosBase.deportesFavoritos;
    if (datosBase.contrasena) existente.contrasena = datosBase.contrasena;

    // Agregar historial de visitas por sector
    if (!existente.historialVisitas) {
      existente.historialVisitas = [];
    }
    const secId = sectorIngresoId || datosBase.deporteFavorito || (datosBase.deportesFavoritos && datosBase.deportesFavoritos[0]) || 'recreativo';
    // Find sector display name if we can
    const secName = sectorIngresoName || (secId === 'recreativo' ? 'Acceso Libre Recreativo' : secId);
    existente.historialVisitas.push({
      id: 'visit-' + Math.random().toString(36).substring(2, 9),
      fecha: new Date().toISOString(),
      sectorId: secId,
      sectorName: secName
    });

    guardarVisitantes(visitantes);
    return existente;
  }

  const codDNI = datosBase.dni.substring(0, 6);
  const nuevoVisitante: Visitante = {
    ...datosBase,
    id: 'vis-' + Math.random().toString(36).substring(2, 9),
    codigo: `BERDUC-${codDNI}`,
    fechaRegistro: new Date().toISOString(),
    visitas: 1,
    vigencia: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas de vigencia
  };

  // Agregar historial de visitas por sector
  nuevoVisitante.historialVisitas = [];
  const secId = sectorIngresoId || datosBase.deporteFavorito || (datosBase.deportesFavoritos && datosBase.deportesFavoritos[0]) || 'recreativo';
  const secName = sectorIngresoName || (secId === 'recreativo' ? 'Acceso Libre Recreativo' : secId);
  nuevoVisitante.historialVisitas.push({
    id: 'visit-' + Math.random().toString(36).substring(2, 9),
    fecha: new Date().toISOString(),
    sectorId: secId,
    sectorName: secName
  });

  visitantes.push(nuevoVisitante);
  guardarVisitantes(visitantes);
  return nuevoVisitante;
}

export function esVisitaVencida(visitante: Visitante): boolean {
  return new Date(visitante.vigencia).getTime() < Date.now();
}

export function obtenerVisitantesActivos(): Visitante[] {
  const visitantes = cargarVisitantes();
  return visitantes.filter(v => !esVisitaVencida(v));
}

export function obtenerTodosLosVisitantes(): Visitante[] {
  return cargarVisitantes();
}

export function eliminarVisitante(id: string): void {
  const visitantes = cargarVisitantes();
  const actualizados = visitantes.filter(v => v.id !== id);
  guardarVisitantes(actualizados);
}

// ------------------- CRUD DELEGACIONES -------------------

export function cargarDelegaciones(): Delegacion[] {
  inicializarLocalStorage();
  const data = safeLocalStorage.getItem(KEY_DELEGACIONES);
  return data ? JSON.parse(data) : [];
}

export function guardarDelegaciones(delegaciones: Delegacion[]): void {
  safeLocalStorage.setItem(KEY_DELEGACIONES, JSON.stringify(delegaciones));
}

export function registrarDelegacion(delegacion: Omit<Delegacion, 'id' | 'fechaRegistro'>): Delegacion {
  const delegaciones = cargarDelegaciones();
  const nueva: Delegacion = {
    ...delegacion,
    id: 'del-' + Math.random().toString(36).substring(2, 9),
    fechaRegistro: new Date().toISOString()
  };
  delegaciones.push(nueva);
  guardarDelegaciones(delegaciones);
  return nueva;
}

export function eliminarDelegacion(id: string): void {
  const delegaciones = cargarDelegaciones();
  const filtradas = delegaciones.filter(d => d.id !== id);
  guardarDelegaciones(filtradas);
}

// Consideremos que una delegación vence si fue registrada hace más de la cantidad de días de visita especificados + 1
export function esDelegacionVencida(delegacion: Delegacion): boolean {
  const fechaReg = new Date(delegacion.fechaRegistro).getTime();
  const diasMs = (delegacion.diasVisita + 1) * 24 * 60 * 60 * 1000;
  return (fechaReg + diasMs) < Date.now();
}

export function obtenerDelegacionesActivas(): Delegacion[] {
  const delegaciones = cargarDelegaciones();
  return delegaciones.filter(d => !esDelegacionVencida(d));
}

export function obtenerTodasLasDelegaciones(): Delegacion[] {
  return cargarDelegaciones();
}

// ------------------- CRUD PROFESORES -------------------

export function cargarProfesores(): Profesor[] {
  inicializarLocalStorage();
  const data = safeLocalStorage.getItem(KEY_PROFESORES);
  return data ? JSON.parse(data) : PROFESORES_INICIALES;
}

export function guardarProfesores(profs: Profesor[]): void {
  safeLocalStorage.setItem(KEY_PROFESORES, JSON.stringify(profs));
}

// ------------------- CRUD TORNEOS -------------------

export function cargarTorneos(): Torneo[] {
  inicializarLocalStorage();
  const data = safeLocalStorage.getItem(KEY_TORNEOS);
  return data ? JSON.parse(data) : TORNEOS_INICIALES;
}

export function guardarTorneos(torneos: Torneo[]): void {
  safeLocalStorage.setItem(KEY_TORNEOS, JSON.stringify(torneos));
}

export function registrarTorneo(torneo: Omit<Torneo, 'id'>): Torneo {
  const torneos = cargarTorneos();
  const nuevo: Torneo = {
    ...torneo,
    id: 'torneo-' + Math.random().toString(36).substring(2, 9)
  };
  torneos.push(nuevo);
  guardarTorneos(torneos);
  return nuevo;
}

// ------------------- CRUD ACTIVIDAD DEPORTIVA (MÉTRICAS) -------------------

export function cargarActividadDeportiva(): ActividadDeportiva[] {
  inicializarLocalStorage();
  const data = safeLocalStorage.getItem(KEY_ACTIVIDAD);
  return data ? JSON.parse(data) : ACTIVIDADES_INICIALES;
}

export function guardarActividadDeportiva(activid: ActividadDeportiva[]): void {
  safeLocalStorage.setItem(KEY_ACTIVIDAD, JSON.stringify(activid));
}

// Registra la reserva como actividad realizada
function agregarActividadDesdeTurno(turno: Turno): void {
  const actividades = cargarActividadDeportiva();
  const edad = 24; // Valor por defecto si no tenemos visitante asociado
  
  // Buscar si hay un visitante con este DNI para sacar la edad exacta y genero
  const v = cargarVisitantes().find(vis => vis.dni.replace(/\D/g, '') === turno.dni.replace(/\D/g, ''));
  const edadFinal = v ? calcularEdad(v.fechaNacimiento) : edad;
  const generoFinal = v ? v.genero : 'Masculino';
  const nacFinal = v ? v.fechaNacimiento : '2002-01-01';

  // Buscar un profesor asignado al deporte
  const profesores = cargarProfesores();
  const prof = profesores.find(p => p.deporte === turno.deporte);
  const nombreProf = prof ? prof.nombre : "Profesor del Parque";
  const catProf = prof ? prof.categoria : "General";

  const nuevaAct: ActividadDeportiva = {
    id: 'act-' + Math.random().toString(36).substring(2, 9),
    fecha: turno.dia,
    deporte: turno.deporte,
    nombre: turno.nombre.split(' ')[0] || 'Reservante',
    apellido: turno.nombre.split(' ').slice(1).join(' ') || 'General',
    dni: turno.dni,
    genero: generoFinal,
    edad: edadFinal,
    fechaNacimiento: nacFinal,
    horasEntrenadas: turno.horas,
    profesor: nombreProf,
    categoria: catProf
  };

  actividades.push(nuevaAct);
  guardarActividadDeportiva(actividades);
}

// Registrar entrenamiento general manual desde Admin (opcional/auxiliar)
export function registrarActividadDeportiva(act: Omit<ActividadDeportiva, 'id'>): ActividadDeportiva {
  const acts = cargarActividadDeportiva();
  const nueva: ActividadDeportiva = {
    ...act,
    id: 'act-' + Math.random().toString(36).substring(2, 9)
  };
  acts.push(nueva);
  guardarActividadDeportiva(acts);
  return nueva;
}

// Aux de edad
export function calcularEdad(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0;
  try {
    const nacimiento = new Date(fechaNacimiento);
    if (isNaN(nacimiento.getTime())) return 0;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  } catch (e) {
    return 0;
  }
}

// ------------------- CRUD EVENTOS DEL PARQUE -------------------

export function cargarEventos(): ParqueEvento[] {
  inicializarLocalStorage();
  const data = safeLocalStorage.getItem(KEY_EVENTOS);
  return data ? JSON.parse(data) : EVENTOS_INICIALES;
}

export function guardarEventos(eventos: ParqueEvento[]): void {
  safeLocalStorage.setItem(KEY_EVENTOS, JSON.stringify(eventos));
}

export function registrarEvento(evento: Omit<ParqueEvento, 'id'>): ParqueEvento {
  const eventos = cargarEventos();
  const nuevo: ParqueEvento = {
    ...evento,
    id: 'evt-' + Math.random().toString(36).substring(2, 9)
  };
  eventos.push(nuevo);
  guardarEventos(eventos);
  return nuevo;
}

export function eliminarEvento(id: string): void {
  const eventos = cargarEventos();
  const filtrados = eventos.filter(e => e.id !== id);
  guardarEventos(filtrados);
}

// ------------------- IMPORTACIÓN / EXPORTACIÓN JSON BACKUP -------------------

export function exportarDatosJSON(): string {
  const backup = {
    turnos: cargarTurnos(),
    visitantes: cargarVisitantes(),
    delegaciones: cargarDelegaciones(),
    profesores: cargarProfesores(),
    actividad: cargarActividadDeportiva(),
    torneos: cargarTorneos(),
    eventos: cargarEventos()
  };
  return JSON.stringify(backup, null, 2);
}

export function importarDatosJSON(jsonString: string): boolean {
  try {
    const backup = JSON.parse(jsonString);
    if (backup.turnos) safeLocalStorage.setItem(KEY_TURNOS, JSON.stringify(backup.turnos));
    if (backup.visitantes) safeLocalStorage.setItem(KEY_VISITANTES, JSON.stringify(backup.visitantes));
    if (backup.delegaciones) safeLocalStorage.setItem(KEY_DELEGACIONES, JSON.stringify(backup.delegaciones));
    if (backup.profesores) safeLocalStorage.setItem(KEY_PROFESORES, JSON.stringify(backup.profesores));
    if (backup.actividad) safeLocalStorage.setItem(KEY_ACTIVIDAD, JSON.stringify(backup.actividad));
    if (backup.torneos) safeLocalStorage.setItem(KEY_TORNEOS, JSON.stringify(backup.torneos));
    if (backup.eventos) safeLocalStorage.setItem(KEY_EVENTOS, JSON.stringify(backup.eventos));
    return true;
  } catch (e) {
    console.error("Error al importar datos", e);
    return false;
  }
}

export function descargarBackup(): void {
  const raw = exportarDatosJSON();
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_parque_berduc_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
