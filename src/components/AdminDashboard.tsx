/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  History,
  TrendingUp,
  FileSpreadsheet,
  Trash2,
  Download,
  Upload,
  Search,
  X,
  ChevronRight,
  ShieldAlert,
  Dribbble,
  Award,
  PlusCircle,
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  Sparkles,
  Brain,
  User
} from 'lucide-react';
import { Turno, Visitante, Delegacion, Torneo, ActividadDeportiva, Profesor, ParqueEvento } from '../types';
import {
  cargarTurnos,
  guardarTurnos,
  eliminarTurno,
  eliminarTodosLosTurnos,
  esTurnoVencido,
  cargarVisitantes,
  guardarVisitantes,
  esVisitaVencida,
  cargarDelegaciones,
  guardarDelegaciones,
  eliminarDelegacion,
  cargarTorneos,
  guardarTorneos,
  registrarTorneo,
  cargarActividadDeportiva,
  calcularEdad,
  descargarBackup,
  importarDatosJSON,
  cargarEventos,
  guardarEventos,
  registrarEvento,
  eliminarEvento,
  eliminarVisitante,
  safeLocalStorage,
  obtenerEstadoSupabase,
  syncAllFromSupabase,
  SupabaseStatus
} from '../database';
import { SPORTS_DATA } from '../data';

interface AdminDashboardProps {
  onBackToSite: () => void;
}

export function AdminDashboard({ onBackToSite }: AdminDashboardProps) {
  // Autenticación de administrador
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return safeLocalStorage.getItem('parque_berduc_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Estructura de pestañas: 'turnos-activos' | 'historial-turnos' | 'visitantes-activos' | 'historial-visitas' | 'delegaciones' | 'metricas'
  const [activeTab, setActiveTab] = useState('turnos-activos');

  // Estado para modal de confirmación personalizado
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Filtros de la pestaña de Usuarios del Parque
  const [usuariosSearch, setUsuariosSearch] = useState('');
  const [usuariosSportFilter, setUsuariosSportFilter] = useState('todos');
  const [selectedUserDetail, setSelectedUserDetail] = useState<Visitante | null>(null);

  // Estado de conexión a Supabase
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Datos reactivos de localStorage
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [delegaciones, setDelegaciones] = useState<Delegacion[]>([]);
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [actividades, setActividades] = useState<ActividadDeportiva[]>([]);
  const [eventos, setEventos] = useState<ParqueEvento[]>([]);

  // Estado para formulario de creación de eventos
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<ParqueEvento, 'id'>>({
    title: '',
    category: 'Competencia Deportiva',
    status: 'proximo',
    sector: 'Pista de Atletismo (Sector Recta Principal)',
    fecha: '',
    horaInicio: '',
    duracion: '',
    description: '',
    icon: 'Flame',
    entryType: 'gratis',
    price: ''
  });

  // Estados para el Sistema de Inteligencia Operacional del Parque Enrique Berduc
  const [selectedMapSector, setSelectedMapSector] = useState<string>('atletismo');
  const [simulatedExtraPeople, setSimulatedExtraPeople] = useState<number>(35);
  const [simulationProfile, setSimulationProfile] = useState<string>('normal'); // 'normal' | 'alta_competencia' | 'recreativo_infantil'
  const [metricsSubTab, setMetricsSubTab] = useState<string>('berduc-brain');

  // Estados para Berduc Brain Copilot
  const [selectedDetailedSportTab, setSelectedDetailedSportTab] = useState<string>('atletismo');
  const [copilotMessages, setCopilotMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([
    {
      id: "1",
      role: "assistant",
      text: "🤖 ¡Hola, Administrador! Soy Berduc Brain Copilot v3.5, tu inteligencia operativa y de aforo en Paraná, Entre Ríos. Puedo analizar datos en tiempo real de concurrentes, predecir picos de asistencia, recomendar desvíos para sectores y canchas saturados, o darte informes de torneos y profesores del parque. ¿En qué te puedo asesorar hoy?"
    }
  ]);
  const [copilotInput, setCopilotInput] = useState<string>("");
  const [isCopilotPending, setIsCopilotPending] = useState<boolean>(false);
  const [copilotErrorMsg, setCopilotErrorMsg] = useState<string>("");

  const handleSendCopilotQuery = async (msgText?: string) => {
    const textToSend = msgText || copilotInput;
    if (!textToSend.trim() || isCopilotPending) return;

    // Agregar mensaje del usuario
    const userMsgId = "msg-" + Math.random().toString(36).substring(2, 9);
    const newMsg = { id: userMsgId, role: "user" as const, text: textToSend };
    setCopilotMessages(prev => [...prev, newMsg]);
    if (!msgText) setCopilotInput("");
    setIsCopilotPending(true);
    setCopilotErrorMsg("");

    try {
      const sectorsSummary: { [key: string]: any } = {};
      ["atletismo", "futbol", "natacion", "padel", "voley", "musculacion", "playon", "recreativo"].forEach(sId => {
        let weight = 0.12;
        if (simulationProfile === "normal") {
          if (sId === "atletismo") weight = 0.22;
          else if (sId === "futbol") weight = 0.20;
          else if (sId === "natacion") weight = 0.14;
          else if (sId === "padel") weight = 0.08;
          else if (sId === "voley") weight = 0.14;
          else if (sId === "musculacion") weight = 0.08;
          else if (sId === "playon") weight = 0.08;
          else if (sId === "recreativo") weight = 0.06;
        } else if (simulationProfile === "alta_competencia") {
          if (sId === "atletismo") weight = 0.30;
          else if (sId === "futbol") weight = 0.25;
          else if (sId === "natacion") weight = 0.15;
          else if (sId === "padel") weight = 0.05;
          else if (sId === "voley") weight = 0.15;
          else if (sId === "musculacion") weight = 0.10;
        } else {
          if (sId === "atletismo") weight = 0.08;
          else if (sId === "futbol") weight = 0.10;
          else if (sId === "natacion") weight = 0.22;
          else if (sId === "padel") weight = 0.04;
          else if (sId === "voley") weight = 0.04;
          else if (sId === "musculacion") weight = 0.02;
          else if (sId === "playon") weight = 0.20;
          else if (sId === "recreativo") weight = 0.30;
        }

        const activeTurnosDeporte = turnos.filter(t => t.deporte === sId && !esTurnoVencido(t)).length;
        const totalRealVisitors = visitantes.length;
        const poolPeople = totalRealVisitors + simulatedExtraPeople;
        const assignedGeneral = Math.round(poolPeople * weight);
        const finalCount = Math.max(assignedGeneral + (activeTurnosDeporte * 4), activeTurnosDeporte * 4);
        
        sectorsSummary[sId] = {
          count: finalCount,
          activeTurnos: activeTurnosDeporte,
          occupationRate: Math.min(Math.round((finalCount / (sId === "padel" ? 16 : sId === "natacion" ? 40 : sId === "musculacion" ? 25 : 50)) * 100), 100)
        };
      });

      const response = await fetch("/api/copilot/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          context: {
            visitantesCount: visitantes.length,
            turnosCount: turnos.filter(t => !esTurnoVencido(t)).length,
            delegacionesCount: delegaciones.length,
            simulationProfile: simulationProfile,
            simulatedExtraPeople: simulatedExtraPeople,
            sectorsSummary: sectorsSummary
          }
        })
      });

      if (!response.ok) {
        throw new Error("Respuesta del servidor no exitosa");
      }

      const data = await response.json();
      const assistantMsg = {
        id: "msg-" + Math.random().toString(36).substring(2, 9),
        role: "assistant" as const,
        text: data.answer || "Disculpas, no obtuve una respuesta estructurada del motor cerebral."
      };
      setCopilotMessages(prev => [...prev, assistantMsg]);

    } catch (err: any) {
      console.error(err);
      setCopilotMessages(prev => [
        ...prev,
        {
          id: "err-" + Math.random().toString(36).substring(2, 9),
          role: "assistant" as const,
          text: "⚠ No pude conectar con el servidor de inteligencia. Asegúrate de configurar la clave secreta GEMINI_API_KEY o reintenta en breve."
        }
      ]);
    } finally {
      setIsCopilotPending(false);
    }
  };

  // Filtros de búsqueda
  const [filterDeporte, setFilterDeporte] = useState('todos');
  const [filterDia, setFilterDia] = useState('');
  const [searchDni, setSearchDni] = useState('');
  const [filterVigenciaVisita, setFilterVigenciaVisita] = useState('todos'); // 'todos' | 'activos' | 'vencidos'
  const [searchDelegacion, setSearchDelegacion] = useState('');
  const [searchDelegacionOrigen, setSearchDelegacionOrigen] = useState('');

  // Modal de Detalle de Delegación
  const [selectedDelegacion, setSelectedDelegacion] = useState<Delegacion | null>(null);

  // Formulario para registrar Torneo
  const [showAddTorneo, setShowAddTorneo] = useState(false);
  const [newTorneo, setNewTorneo] = useState({
    nombre: '',
    deporte: 'atletismo',
    fechaInicio: '',
    fechaFin: '',
    categoria: 'Única',
    participantes: 20,
    equipos: '',
    estado: 'Programado' as 'Programado' | 'En Curso' | 'Finalizado',
    ganador: '',
    segundoPuesto: '',
    tercerPuesto: ''
  });

  // Efecto inicial y teclas de acceso rápido (Cerrar modales con 'Escape')
  useEffect(() => {
    cargarDatosLocales();
    comprobarYSincronizarSupabase();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDelegacion(null);
        setShowAddTorneo(false);
        setSelectedUserDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const comprobarYSincronizarSupabase = async () => {
    setIsSyncing(true);
    setSyncMessage('Comprobando conexión con tu base de datos Supabase...');
    try {
      const status = await obtenerEstadoSupabase();
      setSupabaseStatus(status);
      if (status.configured && status.tableExists) {
        setSyncMessage('Sincronizando colecciones locales con la nube...');
        const synced = await syncAllFromSupabase();
        if (synced) {
          setSyncMessage('¡Datos de Supabase sincronizados correctamente!');
          cargarDatosLocales();
        } else {
          setSyncMessage('¡Listo! Estado en la nube y local sincronizados.');
        }
      } else {
        setSyncMessage(status.message || 'Supabase conectado, requiere crear la tabla parque_store.');
      }
    } catch (err: any) {
      console.error("Error al sincronizar con Supabase:", err);
      setSyncMessage('No se pudo conectar a Supabase, operando localmente.');
    } finally {
      setTimeout(() => {
        setSyncMessage('');
        setIsSyncing(false);
      }, 3000);
    }
  };

  const cargarDatosLocales = () => {
    setTurnos(cargarTurnos());
    setVisitantes(cargarVisitantes());
    setDelegaciones(cargarDelegaciones());
    setTorneos(cargarTorneos());
    setActividades(cargarActividadDeportiva());
    setEventos(cargarEventos());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin123') {
      safeLocalStorage.setItem('parque_berduc_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta. Intente de nuevo.');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    safeLocalStorage.removeItem('parque_berduc_admin_auth');
    setIsAuthenticated(false);
    setPasswordInput('');
    onBackToSite();
  };

  // Acciones en Grid
  const handleCancelarTurno = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancelar Turno',
      message: '¿Está seguro de que desea cancelar este turno reservado?',
      onConfirm: () => {
        eliminarTurno(id);
        cargarDatosLocales();
      }
    });
  };

  const handleEliminarVisitanteAction = (id: string, nombre: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Usuario',
      message: `¿Está seguro de que desea eliminar permanentemente al usuario "${nombre}" de los registros del parque? Esta acción es irreversible y borrará su pase y registros.`,
      onConfirm: () => {
        eliminarVisitante(id);
        cargarDatosLocales();
      }
    });
  };

  const handleAgregarEvento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.fecha || !newEvent.horaInicio || !newEvent.sector) {
      alert('Por favor complete los campos marcados con asterisco (*)');
      return;
    }
    registrarEvento(newEvent);
    setNewEvent({
      title: '',
      category: 'Competencia Deportiva',
      status: 'proximo',
      sector: 'Pista de Atletismo (Sector Recta Principal)',
      fecha: '',
      horaInicio: '',
      duracion: '',
      description: '',
      icon: 'Flame',
      entryType: 'gratis',
      price: ''
    });
    setShowAddEvent(false);
    cargarDatosLocales();
  };

  const handleEliminarEvento = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Evento',
      message: '¿Está seguro de que desea eliminar este evento de la agenda del parque?',
      onConfirm: () => {
        eliminarEvento(id);
        cargarDatosLocales();
      }
    });
  };

  const handleEliminarTodosLosTurnos = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Todos los Turnos',
      message: '▲ ADVERTENCIA: Esta acción es irreversible. Se eliminarán TODOS los turnos guardados del sistema. ¿Desea continuar?',
      onConfirm: () => {
        eliminarTodosLosTurnos();
        cargarDatosLocales();
      }
    });
  };

  const handleEliminarDelegacion = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Delegación',
      message: '¿Desea eliminar este registro de delegación?',
      onConfirm: () => {
        eliminarDelegacion(id);
        cargarDatosLocales();
      }
    });
  };

  const handleEliminarDelegacionesVencidas = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Delegaciones Vencidas',
      message: '¿Desea eliminar automáticamente las delegaciones cuya fecha de visita haya expirado?',
      onConfirm: () => {
        const activas = delegaciones.filter(d => {
          const fechaReg = new Date(d.fechaRegistro).getTime();
          const diasMs = (d.diasVisita + 1) * 24 * 60 * 60 * 1000;
          return (fechaReg + diasMs) >= Date.now();
        });
        guardarDelegaciones(activas);
        cargarDatosLocales();
      }
    });
  };

  const handleAgregarTorneoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registrarTorneo({
      nombre: newTorneo.nombre,
      deporte: newTorneo.deporte,
      fechaInicio: newTorneo.fechaInicio,
      fechaFin: newTorneo.fechaFin,
      categoria: newTorneo.categoria,
      participantes: Number(newTorneo.participantes) || 0,
      equipos: newTorneo.equipos,
      estado: newTorneo.estado,
      ganador: newTorneo.ganador || undefined,
      segundoPuesto: newTorneo.segundoPuesto || undefined,
      tercerPuesto: newTorneo.tercerPuesto || undefined
    });
    setShowAddTorneo(false);
    setNewTorneo({
      nombre: '',
      deporte: 'atletismo',
      fechaInicio: '',
      fechaFin: '',
      categoria: 'Única',
      participantes: 20,
      equipos: '',
      estado: 'Programado',
      ganador: '',
      segundoPuesto: '',
      tercerPuesto: ''
    });
    cargarDatosLocales();
  };

  // Importar / Exportar Backup
  const handleExportBackup = () => {
    descargarBackup();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const exito = importarDatosJSON(result);
      if (exito) {
        alert('Copia de seguridad importada con éxito de manera local.');
        cargarDatosLocales();
      } else {
        alert('El archivo cargado no contiene un formato de respaldo del Parque Berduc válido.');
      }
    };
    reader.readAsText(file);
  };

  const limpiarFiltros = () => {
    setFilterDeporte('todos');
    setFilterDia('');
    setSearchDni('');
    setFilterVigenciaVisita('todos');
    setSearchDelegacion('');
    setSearchDelegacionOrigen('');
  };

  // --- FILTROS DE DATOS ---
  const turnosFiltradosAll = turnos.filter(t => {
    const matchDeporte = filterDeporte === 'todos' || t.deporte === filterDeporte;
    const matchDia = !filterDia || t.dia === filterDia;
    const matchDni = !searchDni || t.dni.replace(/\D/g, '').includes(searchDni.replace(/\D/g, ''));
    return matchDeporte && matchDia && matchDni;
  });

  // Turnos Activos: futuros
  const turnosActivos = turnosFiltradosAll.filter(t => !esTurnoVencido(t));
  // Historial: todos ordenados de más recientes a antiguos
  const turnosHistorial = [...turnosFiltradosAll].sort((a, b) => new Date(b.dia + 'T' + b.hora).getTime() - new Date(a.dia + 'T' + a.hora).getTime());

  // Visitantes Activos: registro < 24hs o vigencia > hoy
  const visitantesFiltradosAll = visitantes.filter(v => {
    const matchDni = !searchDni || v.dni.replace(/\D/g, '').includes(searchDni.replace(/\D/g, ''));
    const vencida = esVisitaVencida(v);
    const matchVigencia =
      filterVigenciaVisita === 'todos' ||
      (filterVigenciaVisita === 'activos' && !vencida) ||
      (filterVigenciaVisita === 'vencidos' && vencida);
    return matchDni && matchVigencia;
  });

  const visitantesActivos = visitantesFiltradosAll.filter(v => !esVisitaVencida(v));

  // Delegaciones filtradas
  const delegacionesFiltradas = delegaciones.filter(d => {
    const matchNombre = !searchDelegacion || d.nombreEquipo.toLowerCase().includes(searchDelegacion.toLowerCase());
    const matchOrigen = !searchDelegacionOrigen || d.origen.toLowerCase().includes(searchDelegacionOrigen.toLowerCase());
    return matchNombre && matchOrigen;
  });

  // --- MODELAMIENTO DE MÉTRICAS Y ESTADÍSTICAS ---
  const totalTurnos = turnos.length;
  const totalVisitantesReg = visitantes.length;
  const totalDelegacionesReg = delegaciones.length;

  // Edad Promedio de Visitantes
  const edadesValidas = visitantes.map(v => calcularEdad(v.fechaNacimiento));
  const edadPromedio = edadesValidas.length > 0 ? Number((edadesValidas.reduce((a, b) => a + b, 0) / edadesValidas.length).toFixed(1)) : 0;

  // Distribución de Rangos Etarios
  const rangosEtarios = {
    '0-12': 0,
    '13-17': 0,
    '18-25': 0,
    '26-35': 0,
    '36-50': 0,
    '51+': 0
  };
  edadesValidas.forEach(ed => {
    if (ed <= 12) rangosEtarios['0-12']++;
    else if (ed <= 17) rangosEtarios['13-17']++;
    else if (ed <= 25) rangosEtarios['18-25']++;
    else if (ed <= 35) rangosEtarios['26-35']++;
    else if (ed <= 50) rangosEtarios['36-50']++;
    else rangosEtarios['51+']++;
  });

  // Porcentaje visitantes recurrentes (visitas > 1)
  const recurrentesCount = visitantes.filter(v => v.visitas > 1).length;
  const pctRecurrentes = totalVisitantesReg > 0 ? Number(((recurrentesCount / totalVisitantesReg) * 100).toFixed(1)) : 0;

  // Tasa de conversión: (turnos totales / visitantes registrados únicos) * 100
  const tasaConversion = totalVisitantesReg > 0 ? Number(((totalTurnos / totalVisitantesReg) * 100).toFixed(1)) : 0;

  // Porcentaje de turnos vencidos del total
  const turnosVencidosCount = turnos.filter(t => esTurnoVencido(t)).length;
  const pctVencidos = totalTurnos > 0 ? Number(((turnosVencidosCount / totalTurnos) * 100).toFixed(1)) : 0;

  // Turnos por deporte
  const turnosPorDeporteObj: { [key: string]: number } = {};
  SPORTS_DATA.forEach(s => {
    turnosPorDeporteObj[s.id] = 0;
  });
  turnos.forEach(t => {
    if (turnosPorDeporteObj[t.deporte] !== undefined) {
      turnosPorDeporteObj[t.deporte]++;
    } else {
      turnosPorDeporteObj[t.deporte] = 1;
    }
  });

  // Turnos por día de la semana (Lunes a Domingo)
  const turnosDiaSemana = {
    'Lunes': 0,
    'Martes': 0,
    'Miércoles': 0,
    'Jueves': 0,
    'Viernes': 0,
    'Sábado': 0,
    'Domingo': 0
  };
  turnos.forEach(t => {
    // Parser de fecha
    const fecha = new Date(t.dia + 'T' + t.hora);
    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaNom = diasNombres[fecha.getDay()] as keyof typeof turnosDiaSemana;
    if (diaNom) turnosDiaSemana[diaNom]++;
  });

  // Turnos por hora (para hora pico)
  const turnosPorHoraObj: { [key: string]: number } = {};
  turnos.forEach(t => {
    const h = t.hora.split(':')[0] + ':00hs';
    turnosPorHoraObj[h] = (turnosPorHoraObj[h] || 0) + 1;
  });
  const horaPico = Object.entries(turnosPorHoraObj).length > 0
    ? Object.entries(turnosPorHoraObj).sort((a, b) => b[1] - a[1])[0]
    : ['N/A', 0];

  // Ranking de profesores (basado en cantidad de clases/actividades por deporte)
  const rankingProfesores = SPORTS_DATA.map(sport => {
    // Alumnos asistidos/reservados para este deporte
    const countTurnosDeporte = turnos.filter(t => t.deporte === sport.id).length;
    // Busquemos primer profesor de este deporte
    const profs = [
      { nombre: "Carlos 'Charly' Álvarez", deporte: 'atletismo' },
      { nombre: "Mariano Galarza", deporte: 'futbol' },
      { nombre: "Flavia Siede", deporte: 'natacion' },
      { nombre: "Sofía Mildemberger", deporte: 'voley' },
      { nombre: "Gustavo Brassesco", deporte: 'padel' },
      { nombre: "Esteban 'Bicho' Gómez", deporte: 'basquet' },
      { nombre: "Walter Galarza", deporte: 'handball' },
      { nombre: "Daniela Martínez", deporte: 'musculacion' },
      { nombre: "Servicios Generales", deporte: 'playon' }
    ];
    const p = profs.find(pf => pf.deporte === sport.id);
    return {
      nombre: p ? p.nombre : 'Profesor',
      deporte: sport.name,
      turnosCount: countTurnosDeporte
    };
  }).sort((a, b) => b.turnosCount - a.turnosCount);

  // Delegaciones agrupadas por competencia
  const delPorCompetencia: { [key: string]: number } = {};
  delegaciones.forEach(d => {
    const comp = d.competencia || 'Recreativo';
    delPorCompetencia[comp] = (delPorCompetencia[comp] || 0) + 1;
  });

  // Delegaciones agrupadas por origen
  const delPorOrigen: { [key: string]: number } = {};
  delegaciones.forEach(d => {
    const orig = d.origen.split(',')[0] || 'Paraná';
    delPorOrigen[orig] = (delPorOrigen[orig] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 antialiased font-sans">
      
      {/* 🔐 PANTALLA DE ACCESO PARA NO AUTENTICADOS */}
      {!isAuthenticated ? (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12 pattern-grid">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition border border-gray-100 p-8">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100/50">
                <ShieldAlert className="h-7 w-7 text-emerald-700 animate-pulse" />
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-gray-950">Acceso de Administración</h2>
              <p className="mt-1.5 text-xs text-gray-500">
                Parque Escolar Deportivo Enrique Berduc
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Contraseña de Entrada
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Ingrese la clave..."
                  required
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {authError && (
                <p className="text-xs text-red-600 font-semibold">{authError}</p>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-800 py-3 text-sm font-bold text-white hover:bg-emerald-900 transition shadow-xs cursor-pointer"
                  id="admin-login-submit-btn"
                >
                  Verificar Clave e Ingresar
                </button>
                <button
                  type="button"
                  onClick={onBackToSite}
                  className="w-full rounded-xl bg-gray-100 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition"
                >
                  Volver al Sitio General
                </button>
              </div>
            </form>
            
            <div className="mt-6 border-t border-gray-100 pt-4 text-center">
              <span className="text-[10px] text-gray-400 font-mono">Dato seguro: Clave por defecto "admin123"</span>
            </div>
          </div>
        </div>
      ) : (
        /* 🏟️ PANEL PRINCIPAL DE ADMINISTRACIÓN */
        <div className="flex flex-col md:flex-row min-h-screen">
          
          {/* Sidebar de navegación del panel */}
          <aside className="w-full md:w-64 bg-zinc-950 text-gray-300 flex flex-col shrink-0 border-r border-zinc-800">
            <div className="p-6 border-b border-zinc-900">
              <div className="flex items-center space-x-2.5">
                <div className="h-8.5 w-8.5 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm tracking-widest shadow-md">
                  EB
                </div>
                <div>
                  <h1 className="font-extrabold text-white text-sm tracking-tight leading-tight">Admin Berduc</h1>
                  <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Paraná, Entre Ríos</span>
                </div>
              </div>
            </div>

            {/* Selector de pestañas */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 px-3 block mb-2">Reservas y Turneros</span>
                <button
                  onClick={() => setActiveTab('turnos-activos')}
                  className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center space-x-3 transition ${
                    activeTab === 'turnos-activos' ? 'bg-emerald-800/20 text-emerald-400 border-l-4 border-emerald-500 font-bold' : 'hover:bg-zinc-900'
                  }`}
                  id="btn-tab-turnos-activos"
                >
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Turnos Activos</span>
                </button>
                <button
                  onClick={() => setActiveTab('historial-turnos')}
                  className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center space-x-3 transition ${
                    activeTab === 'historial-turnos' ? 'bg-emerald-800/20 text-emerald-400 border-l-4 border-emerald-500 font-bold' : 'hover:bg-zinc-900'
                  }`}
                  id="btn-tab-historial-turnos"
                >
                  <History className="h-4 w-4 shrink-0" />
                  <span>Historial de Turnos</span>
                </button>
              </div>

              <div className="pt-4">
                <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 px-3 block mb-2">Pases de Visitantes</span>
                <button
                  onClick={() => setActiveTab('visitantes-activos')}
                  className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center space-x-3 transition ${
                    activeTab === 'visitantes-activos' ? 'bg-emerald-800/20 text-emerald-400 border-l-4 border-emerald-500 font-bold' : 'hover:bg-zinc-900'
                  }`}
                  id="btn-tab-visitantes-activos"
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Visitantes Activos</span>
                </button>
                <button
                  onClick={() => setActiveTab('historial-visitas')}
                  className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center space-x-3 transition ${
                    activeTab === 'historial-visitas' ? 'bg-emerald-800/20 text-emerald-400 border-l-4 border-emerald-500 font-bold' : 'hover:bg-zinc-900'
                  }`}
                  id="btn-tab-historial-visitas"
                >
                  <FileSpreadsheet className="h-4 w-4 shrink-0" />
                  <span>Historial de Visitas</span>
                </button>
                <button
                  onClick={() => setActiveTab('usuarios-parque')}
                  className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center space-x-3 transition ${
                    activeTab === 'usuarios-parque' ? 'bg-emerald-800/20 text-emerald-400 border-l-4 border-emerald-500 font-bold' : 'hover:bg-zinc-900'
                  }`}
                  id="btn-tab-usuarios-parque"
                >
                  <User className="h-4 w-4 shrink-0 text-emerald-450" />
                  <span>Usuarios del Parque</span>
                </button>
              </div>

              <div className="pt-4">
                <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 px-3 block mb-2">Comunidades y Eventos</span>
                <button
                  onClick={() => setActiveTab('delegaciones')}
                  className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center space-x-3 transition ${
                    activeTab === 'delegaciones' ? 'bg-emerald-800/20 text-emerald-400 border-l-4 border-emerald-500 font-bold' : 'hover:bg-zinc-900'
                  }`}
                  id="btn-tab-delegaciones"
                >
                  <Dribbble className="h-4 w-4 shrink-0" />
                  <span>Delegaciones / Grupos</span>
                </button>
                <button
                  onClick={() => setActiveTab('eventos')}
                  className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center space-x-3 transition ${
                    activeTab === 'eventos' ? 'bg-emerald-800/20 text-emerald-400 border-l-4 border-emerald-500 font-bold' : 'hover:bg-zinc-900'
                  }`}
                  id="btn-tab-eventos"
                >
                  <Calendar className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Carga de Eventos</span>
                </button>
                <button
                  onClick={() => setActiveTab('metricas')}
                  className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center space-x-3 transition ${
                    activeTab === 'metricas' ? 'bg-emerald-800/20 text-emerald-400 border-l-4 border-emerald-500 font-bold' : 'hover:bg-zinc-900'
                  }`}
                  id="btn-tab-metricas-estadisticas"
                >
                  <TrendingUp className="h-4 w-4 shrink-0" />
                  <span>Métricas y Torneos</span>
                </button>
              </div>

              <div className="pt-4">
                <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 px-3 block mb-2">Inteligencia Operacional</span>
                <button
                  onClick={() => {
                    setActiveTab('berduc-brain');
                    setMetricsSubTab('berduc-brain');
                  }}
                  className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center space-x-3 transition ${
                    activeTab === 'berduc-brain' ? 'bg-emerald-800/20 text-emerald-400 border-l-4 border-emerald-500 font-bold' : 'hover:bg-zinc-900'
                  }`}
                  id="btn-tab-berduc-brain"
                >
                  <Brain className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Berduc Brain (Mapa)</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('copilot');
                    setMetricsSubTab('copilot');
                  }}
                  className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center space-x-3 transition ${
                    activeTab === 'copilot' ? 'bg-emerald-800/20 text-emerald-400 border-l-4 border-emerald-500 font-bold' : 'hover:bg-zinc-900'
                  }`}
                  id="btn-tab-copilot"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-purple-400" />
                  <span>Brain Copilot (AI)</span>
                </button>
              </div>

              <div className="pt-4">
                <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 px-3 block mb-2 font-black">Fichas de Deportes</span>
                {[
                  { id: 'atletismo', name: '🏃 Atletismo' },
                  { id: 'futbol', name: '⚽ Fútbol / Rugby' },
                  { id: 'natacion', name: '🏊 Natación' },
                  { id: 'padel', name: '🎾 Pádel' },
                  { id: 'voley', name: '🏐 Vóley' },
                  { id: 'musculacion', name: '🏋️ Musculación' },
                  { id: 'playon', name: 'Basketball / Playón' },
                  { id: 'recreativo', name: '🪁 Recreativo' }
                ].map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => {
                      setActiveTab(sport.id);
                      setMetricsSubTab(sport.id);
                      setSelectedDetailedSportTab(sport.id);
                    }}
                    className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center space-x-3 transition ${
                      activeTab === sport.id ? 'bg-emerald-800/20 text-emerald-400 border-l-4 border-emerald-500 font-bold' : 'hover:bg-zinc-900'
                    }`}
                    id={`btn-tab-sport-${sport.id}`}
                  >
                    <span>{sport.name}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Pie de sidebar con herramientas rápidas */}
            <div className="p-4 border-t border-zinc-900 bg-black/40 space-y-3.5">
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={handleExportBackup}
                  className="w-full flex items-center space-x-2 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 py-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Exportar Respaldo</span>
                </button>

                <label className="w-full flex items-center space-x-2 text-[11px] font-bold text-orange-400 hover:text-orange-300 py-1 cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Importar Respaldo</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="border-t border-zinc-900 pt-3 flex items-center justify-between">
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition"
                  id="admin-logout-btn"
                >
                  Salir de Admin
                </button>
                <button
                  onClick={onBackToSite}
                  className="rounded-lg bg-emerald-800 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-990 tracking-wide transition"
                  id="admin-back-to-site-btn"
                >
                  Volver al Sitio
                </button>
              </div>
            </div>
          </aside>

          {/* Área del Contenido Principal */}
          <main className="flex-1 min-w-0 flex flex-col bg-gray-50">
            {/* Barra superior de estado */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-950 uppercase tracking-wide">
                  {activeTab === 'turnos-activos' && 'Turnos de Cancha Activos'}
                  {activeTab === 'historial-turnos' && 'Historial Completo de Reservas'}
                  {activeTab === 'visitantes-activos' && 'Visitantes Recreativos Activos'}
                  {activeTab === 'historial-visitas' && 'Historial General de Visitantes'}
                  {activeTab === 'usuarios-parque' && '👥 Usuarios Oficiales del Parque'}
                  {activeTab === 'delegaciones' && 'Registro de Delegaciones y Equipos'}
                  {activeTab === 'eventos' && '📅 Agenda de Eventos y Actividades'}
                  {activeTab === 'metricas' && 'Métricas, Estadísticas de Uso y Torneos'}
                  {activeTab === 'berduc-brain' && '🧠 Berduc Brain - Mapa de Inteligencia y Aforo Colectivo'}
                  {activeTab === 'copilot' && '🤖 Brain Copilot - Asistente de Gestión AI'}
                  {activeTab === 'atletismo' && '🏃 Atletismo - Ficha y Aforo en Detalle'}
                  {activeTab === 'futbol' && '⚽ Fútbol y Rugby - Ficha y Aforo en Detalle'}
                  {activeTab === 'natacion' && '🏊 Natación - Ficha y Aforo en Detalle'}
                  {activeTab === 'padel' && '🎾 Pádel - Ficha y Aforo en Detalle'}
                  {activeTab === 'voley' && '🏐 Vóley - Ficha y Aforo en Detalle'}
                  {activeTab === 'musculacion' && '🏋️ Musculación - Ficha y Aforo en Detalle'}
                  {activeTab === 'playon' && '🏀 Basketball y Playón - Ficha y Aforo en Detalle'}
                  {activeTab === 'recreativo' && '🪁 Espacio Recreativo - Ficha y Aforo en Detalle'}
                </h2>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs">
                  <span className="text-gray-500 font-medium">Base de Datos Local</span>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1.5">
                    {isSyncing ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        {syncMessage || 'Sincronizando...'}
                      </span>
                    ) : supabaseStatus?.configured && supabaseStatus?.tableExists ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-extrabold bg-emerald-55/40 px-2 py-0.5 rounded-full border border-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Sincronizado con Supabase Nube
                        <button 
                          onClick={comprobarYSincronizarSupabase} 
                          className="hover:text-emerald-950 hover:underline font-extrabold cursor-pointer ml-1 text-[10px]"
                        >
                          (Sincronizar ahora)
                        </button>
                      </span>
                    ) : (
                      <button 
                        onClick={() => {
                          alert(`Información de Configuración de Supabase:\n\nConexión: ${supabaseStatus?.message || "No establecida"}\n\nPara sincronizar con Supabase de manera permanente y segura, copia y ejecuta este script en la Consola SQL de Supabase (SQL Editor):\n\n-- 1. Crear la tabla parque_store si no existe\nCREATE TABLE IF NOT EXISTS parque_store (\n  key TEXT PRIMARY KEY,\n  value JSONB NOT NULL,\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\n-- 2. Habilitar seguridad de nivel de fila (RLS)\nALTER TABLE parque_store ENABLE ROW LEVEL SECURITY;\n\n-- 3. Borrar políticas existentes para evitar errores de duplicado (Evita ERROR: 42710)\nDROP POLICY IF EXISTS "Allow public read access" ON "parque_store";\nDROP POLICY IF EXISTS "Allow public insert access" ON "parque_store";\nDROP POLICY IF EXISTS "Allow public update access" ON "parque_store";\nDROP POLICY IF EXISTS "Allow public delete access" ON "parque_store";\nDROP POLICY IF EXISTS "Allow public all access" ON "parque_store";\n\n-- 4. Crear nueva política unificada de acceso público total\nCREATE POLICY "Allow public all access" ON "parque_store"\n  AS PERMISSIVE\n  FOR ALL\n  TO public\n  USING (true)\n  WITH CHECK (true);`);
                        }}
                        className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-150 hover:bg-amber-100 transition cursor-pointer"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Supabase: Configurar Sincronización Nube
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón de limpiar base de datos en las vistas de listados */}
              {(activeTab === 'turnos-activos' || activeTab === 'historial-turnos') && (
                <button
                  onClick={handleEliminarTodosLosTurnos}
                  className="flex items-center space-x-1.5 rounded-lg bg-red-50 border border-red-100 text-red-700 px-3 py-1.5 text-xs font-bold hover:bg-red-100 hover:text-red-800 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Limpiar Todos los Turnos</span>
                </button>
              )}
            </header>

            {/* Barra de filtros superior adaptativa (sólo para las vistas de listados que lo requieren) */}
            {['turnos-activos', 'historial-turnos', 'visitantes-activos', 'historial-visitas', 'delegaciones'].includes(activeTab) && (
              <section className="bg-white border-b border-gray-100 px-6 py-4 flex flex-wrap items-center gap-4 text-xs">
                {/* Filtro general por DNI para buscar personas */}
                {(activeTab.includes('visitantes') || activeTab.includes('turnos')) && (
                  <div className="relative w-full sm:w-48 shadow-2xs">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar por DNI..."
                      value={searchDni}
                      onChange={(e) => setSearchDni(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-1.5 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Filtro Deporte (sólo para Turnos) */}
                {activeTab.includes('turnos') && (
                  <select
                    value={filterDeporte}
                    onChange={(e) => setFilterDeporte(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs focus:border-emerald-500 focus:outline-none text-gray-700 font-medium"
                  >
                    <option value="todos">Todos los Deportes</option>
                    {SPPORTS_SELECTOR_OPTIONS}
                  </select>
                )}

                {/* Filtro Día (sólo para Turnos) */}
                {activeTab.includes('turnos') && (
                  <input
                    type="date"
                    value={filterDia}
                    onChange={(e) => setFilterDia(e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1 focus:border-emerald-500 focus:outline-none text-xs text-gray-700"
                  />
                )}

                {/* Filtro Vigencia (sólo para Historial Visitas) */}
                {activeTab === 'historial-visitas' && (
                  <select
                    value={filterVigenciaVisita}
                    onChange={(e) => setFilterVigenciaVisita(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs focus:border-emerald-500 focus:outline-none font-medium text-gray-700"
                  >
                    <option value="todos">Todos los Estados pases</option>
                    <option value="activos">Pases Activos (menos de 24hs)</option>
                    <option value="vencidos">Pases Expirados</option>
                  </select>
                )}

                {/* Filtro Delegaciones */}
                {activeTab === 'delegaciones' && (
                  <>
                    <input
                      type="text"
                      placeholder="Nombre del Equipo..."
                      value={searchDelegacion}
                      onChange={(e) => setSearchDelegacion(e.target.value)}
                      className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-emerald-500 focus:outline-none w-full sm:w-44"
                    />
                    <input
                      type="text"
                      placeholder="Origen (Localidad)..."
                      value={searchDelegacionOrigen}
                      onChange={(e) => setSearchDelegacionOrigen(e.target.value)}
                      className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-emerald-500 focus:outline-none w-full sm:w-44"
                    />
                  </>
                )}

                <button
                  onClick={limpiarFiltros}
                  className="rounded-lg bg-gray-100 hover:bg-gray-200 px-3.5 py-1.5 font-bold text-gray-700 transition"
                >
                  Limpiar filtros
                </button>
              </section>
            )}

            {/* Contenedor adaptativo de datos correspondientes */}
            <div className="flex-1 p-6 overflow-y-auto">

              {/* 1. SECCIÓN: TURNOS ACTIVOS */}
              {activeTab === 'turnos-activos' && (
                <div className="overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm">
                  {turnosActivos.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900 border-none">No hay turnos activos futuros</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Utilice los filtros o cree nuevas reservas desde la página web general.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                          <tr>
                            <th className="p-4">Usuario</th>
                            <th className="p-4">DNI</th>
                            <th className="p-4">Teléfono</th>
                            <th className="p-4">Deporte</th>
                            <th className="p-4">Cancha</th>
                            <th className="p-4">Día</th>
                            <th className="p-4">Hora</th>
                            <th className="p-4">Reserva realizada</th>
                            <th className="p-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {turnosActivos.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50/50">
                              <td className="p-4 font-bold text-gray-900">{t.nombre}</td>
                              <td className="p-4 font-mono">{t.dni}</td>
                              <td className="p-4 text-gray-600">{t.telefono}</td>
                              <td className="p-4">
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-800 border border-emerald-100">
                                  {t.deporte}
                                </span>
                              </td>
                              <td className="p-4 font-medium text-gray-700">{t.cancha}</td>
                              <td className="p-4 font-semibold">{formatDateReadable(t.dia)}</td>
                              <td className="p-4 text-gray-900 font-bold">{t.hora}hs</td>
                              <td className="p-4 text-[10px] text-gray-400">{new Date(t.fechaReserva).toLocaleString('es-AR')}</td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleCancelarTurno(t.id)}
                                  className="text-[11px] font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg px-2 py-1 transition"
                                >
                                  Cancelar turno
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 2. SECCIÓN: HISTORIAL DE TURNOS */}
              {activeTab === 'historial-turnos' && (
                <div className="overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm">
                  {turnosHistorial.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <History className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">Historial vacío</h3>
                      <p className="text-xs text-gray-500 mt-1">No se detectaron turnos registrados en la base de datos.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                          <tr>
                            <th className="p-4">Usuario</th>
                            <th className="p-4">DNI</th>
                            <th className="p-4">Deporte</th>
                            <th className="p-4">Día</th>
                            <th className="p-4">Hora</th>
                            <th className="p-4">Duración</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Estrellas Fedback</th>
                            <th className="p-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {turnosHistorial.map((t) => {
                            const vencida = esTurnoVencido(t);
                            return (
                              <tr key={t.id} className="hover:bg-gray-50/50">
                                <td className="p-4 font-bold text-gray-900">{t.nombre}</td>
                                <td className="p-4 font-mono">{t.dni}</td>
                                <td className="p-4 capitalize">{t.deporte === 'padel' ? 'Pádel profesional' : t.deporte}</td>
                                <td className="p-4 font-semibold">{formatDateReadable(t.dia)}</td>
                                <td className="p-4 text-gray-900 font-bold">{t.hora}hs</td>
                                <td className="p-4 font-medium text-gray-500">{t.horas} h</td>
                                <td className="p-4">
                                  {vencida ? (
                                    <span className="inline-flex items-center space-x-1.5 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-850 border border-orange-100">
                                      <Clock className="h-3 w-3" />
                                      <span>Vencido / Concluido</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-800 border border-green-100">
                                      <CheckCircle className="h-3 w-3" />
                                      <span>Activo</span>
                                    </span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex text-amber-500 text-xs">
                                    {t.satisfaccion ? '★'.repeat(t.satisfaccion) + '☆'.repeat(5 - t.satisfaccion) : 'S/F'}
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  {!vencida && (
                                    <button
                                      onClick={() => handleCancelarTurno(t.id)}
                                      className="text-[11px] font-bold text-red-600 hover:text-red-800"
                                    >
                                      Cancelar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 3. SECCIÓN: VISITANTES ACTIVOS (Pase de ingreso con validez menor de 24hs) */}
              {activeTab === 'visitantes-activos' && (
                <div className="overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm">
                  {visitantesActivos.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Users className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">Ningún visitante activo</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Todos los visitas registradas han excedido el plazo de vigencia diario de libre esparcimiento.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                          <tr>
                            <th className="p-4">Foto</th>
                            <th className="p-4">Visitante</th>
                            <th className="p-4">DNI</th>
                            <th className="p-4">Código Único</th>
                            <th className="p-4">Ubicación</th>
                            <th className="p-4">Teléfono / Email</th>
                            <th className="p-4">Registro</th>
                            <th className="p-4">Vence Pase</th>
                            <th className="p-4 text-center">Visitas</th>
                            <th className="p-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {visitantesActivos.map((v) => (
                            <tr key={v.id} className="hover:bg-gray-50/50">
                              <td className="p-4">
                                {v.foto ? (
                                  <img
                                    src={v.foto}
                                    alt="Selfie"
                                    referrerPolicy="no-referrer"
                                    className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold uppercase">
                                    {v.nombre[0]}
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-gray-900">{v.nombre} {v.apellido}</div>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{v.genero} ({calcularEdad(v.fechaNacimiento)} años)</span>
                              </td>
                              <td className="p-4 font-mono">{v.dni}</td>
                              <td className="p-4 text-emerald-800 font-bold font-mono text-[11px] select-all cursor-pointer" title="Haga clic para copiar">
                                {v.codigo}
                              </td>
                              <td className="p-4 text-gray-500 leading-tight">
                                <p>{v.domicilio}</p>
                                <p className="text-[10px] font-semibold text-gray-400">{v.localidad}, {v.provincia}</p>
                              </td>
                              <td className="p-4 text-gray-600 leading-tight">
                                <p>{v.telefono}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{v.email}</p>
                              </td>
                              <td className="p-4 text-gray-400 text-[10px]">{new Date(v.fechaRegistro).toLocaleString('es-AR')}</td>
                              <td className="p-4 text-emerald-800 font-bold text-[11px] italic">
                                {new Date(v.vigencia).toLocaleString('es-AR')}
                              </td>
                              <td className="p-4 text-center font-extrabold text-gray-900">{v.visitas}</td>
                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleEliminarVisitanteAction(v.id, `${v.nombre} ${v.apellido}`)}
                                  className="text-rose-650 hover:text-rose-900 font-bold hover:bg-rose-50 p-1.5 rounded-lg transition"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="h-4 w-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 4. SECCIÓN: HISTORIAL DE VISITAS GENERALES */}
              {activeTab === 'historial-visitas' && (
                <div className="overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm">
                  {visitantesFiltradosAll.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Users className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">Historial de visitas sin registros</h3>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                          <tr>
                            <th className="p-4">Foto</th>
                            <th className="p-4">Visitante</th>
                            <th className="p-4">DNI</th>
                            <th className="p-4">Código pase</th>
                            <th className="p-4">Edad</th>
                            <th className="p-4">Domicilio / Celular</th>
                            <th className="p-4">Último ingreso y Sector</th>
                            <th className="p-4">Estado pase</th>
                            <th className="p-4 text-center">Frecuencia total</th>
                            <th className="p-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {visitantesFiltradosAll.map((v) => {
                            const vencida = esVisitaVencida(v);
                            return (
                              <tr key={v.id} className="hover:bg-gray-50/50">
                                <td className="p-4">
                                  {v.foto ? (
                                    <img
                                      src={v.foto}
                                      alt="Selfie"
                                      referrerPolicy="no-referrer"
                                      className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-bold uppercase">
                                      {v.nombre[0]}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-gray-900">{v.nombre} {v.apellido}</div>
                                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{v.genero}</span>
                                </td>
                                <td className="p-4 font-mono">{v.dni}</td>
                                <td className="p-4 text-emerald-800 font-bold font-mono text-[11px]">{v.codigo}</td>
                                <td className="p-4 font-semibold text-gray-650">{calcularEdad(v.fechaNacimiento)} años</td>
                                <td className="p-4 text-gray-500 font-medium">
                                  <p>{v.domicilio}, {v.localidad}</p>
                                  <p className="text-[10px] text-gray-400 font-semibold">{v.telefono}</p>
                                </td>
                                <td className="p-4">
                                  <p className="font-extrabold text-slate-850 text-[11px]">
                                    {v.historialVisitas && v.historialVisitas.length > 0
                                      ? v.historialVisitas[v.historialVisitas.length - 1].sectorName
                                      : 'Acceso General'}
                                  </p>
                                  <p className="text-gray-400 text-[10px] mt-0.5">
                                    {new Date(v.fechaRegistro).toLocaleString('es-AR')}
                                  </p>
                                </td>
                                <td className="p-4">
                                  {vencida ? (
                                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700 border border-orange-100">
                                      Pase Vencido
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 border border-green-100">
                                      Pase Activo
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-center font-extrabold text-gray-950">{v.visitas} visitas</td>
                                <td className="p-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarVisitanteAction(v.id, `${v.nombre} ${v.apellido}`)}
                                    className="text-rose-655 hover:text-rose-900 font-bold hover:bg-rose-50 p-1.5 rounded-lg transition"
                                    title="Eliminar usuario"
                                  >
                                    <Trash2 className="h-4 w-4 inline" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SECCIÓN NUEVA: USUARIOS DEL PARQUE */}
              {activeTab === 'usuarios-parque' && (() => {
                const filteredUsers = visitantes.filter(v => {
                  const matchSearch = 
                    v.nombre.toLowerCase().includes(usuariosSearch.toLowerCase()) ||
                    v.apellido.toLowerCase().includes(usuariosSearch.toLowerCase()) ||
                    v.dni.includes(usuariosSearch);
                  const matchSport = 
                    usuariosSportFilter === 'todos' || 
                    v.deporteFavorito === usuariosSportFilter ||
                    (v.deportesFavoritos && v.deportesFavoritos.includes(usuariosSportFilter));
                  return matchSearch && matchSport;
                });

                return (
                  <div className="space-y-6">
                    {/* Filtros superiores */}
                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                      {/* Buscador de texto */}
                      <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar por DNI, Nombre o Apellido..."
                          value={usuariosSearch}
                          onChange={(e) => setUsuariosSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-250 focus:outline-emerald-500 bg-gray-50/50 font-semibold"
                        />
                      </div>

                      {/* Dropdown por deporte favorito */}
                      <div className="flex items-center gap-2.5 w-full md:w-auto">
                        <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wide shrink-0">Deporte Favorito:</span>
                        <select
                          value={usuariosSportFilter}
                          onChange={(e) => setUsuariosSportFilter(e.target.value)}
                          className="flex-1 md:flex-none px-3 py-2 text-xs rounded-lg border border-gray-250 focus:outline-emerald-500 bg-white font-bold text-gray-700"
                        >
                          <option value="todos">Todos los deportes</option>
                          {SPORTS_DATA.map(sport => (
                            <option key={sport.id} value={sport.id}>
                              {sport.name.charAt(0).toUpperCase() + sport.name.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Grid de Íconos de Usuarios e Información Detallada */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                      
                      {/* Panel Izquierdo: Directorio de Usuarios en forma de íconos */}
                      <div className="xl:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                              Directorio Visual ({filteredUsers.length} deportistas)
                            </h3>
                            {selectedUserDetail && (
                              <button 
                                onClick={() => setSelectedUserDetail(null)}
                                className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-bold cursor-pointer"
                              >
                                Ver todos (cerrar detalles)
                              </button>
                            )}
                          </div>

                          {filteredUsers.length === 0 ? (
                            <div className="text-center py-16 px-4">
                              <Users className="mx-auto h-12 w-12 text-gray-300 animate-pulse" />
                              <h3 className="mt-2 text-sm font-semibold text-gray-900">No se encontraron usuarios</h3>
                              <p className="text-xs text-gray-500 mt-1">Ajustá los filtros o el buscador para encontrar deportistas.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                              {filteredUsers.map((v) => {
                                const isSelected = selectedUserDetail?.id === v.id;
                                const isExpired = new Date(v.vigencia).getTime() < Date.now();
                                const sportEmojis: { [key: string]: string } = {
                                  atletismo: '🏃',
                                  futbol: '⚽',
                                  natacion: '🏊',
                                  voley: '🏐',
                                  padel: '🎾',
                                  basquet: '🏀',
                                  handball: '🤾',
                                  musculacion: '🏋️',
                                  playon: '🛹',
                                  recreativo: '🪁'
                                };
                                const emoji = sportEmojis[v.deporteFavorito || 'atletismo'] || '🏟️';

                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => setSelectedUserDetail(v)}
                                    className={`group flex flex-col items-center text-center p-3 rounded-2xl border transition-all relative cursor-pointer ${
                                      isSelected
                                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                                        : 'border-gray-200/60 bg-white hover:border-emerald-400 hover:bg-emerald-50/10 hover:shadow-sm'
                                    }`}
                                  >
                                    {/* Avatar Circular con Borde Estilizado */}
                                    <div className="relative">
                                      {v.foto ? (
                                        <img
                                          src={v.foto}
                                          alt={v.nombre}
                                          className="h-14 w-14 rounded-full object-cover border-2 border-emerald-500 shadow-xs group-hover:scale-105 transition duration-150"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <div className="h-14 w-14 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-700 text-base font-black uppercase group-hover:scale-105 transition duration-150">
                                          {v.nombre.charAt(0)}{v.apellido.charAt(0)}
                                        </div>
                                      )}
                                      
                                      {/* Mini emoji flotante del deporte */}
                                      <span className="absolute -bottom-1 -right-1 h-6 w-6 bg-white rounded-full flex items-center justify-center text-xs shadow-xs border border-gray-100">
                                        {emoji}
                                      </span>
                                    </div>

                                    {/* Información básica */}
                                    <span className="mt-2 text-xs font-black text-gray-950 group-hover:text-emerald-800 transition truncate max-w-full block leading-tight">
                                      {v.nombre}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-semibold truncate max-w-full leading-none block mt-0.5">
                                      {v.apellido}
                                    </span>

                                    {/* Indicador de vigencia del Pase */}
                                    <span className={`absolute top-2 right-2 h-2.5 w-2.5 rounded-full border border-white ${
                                      isExpired ? 'bg-orange-400' : 'bg-emerald-500'
                                    }`} title={isExpired ? 'Pase Vencido' : 'Pase Activo'} />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Panel Derecho: Ficha Técnica Completa y Lugares que Visitó */}
                      <div className="xl:col-span-1">
                        {selectedUserDetail ? (
                          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-6 sticky top-4">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                <span>📄 Ficha del Visitante</span>
                              </h3>
                              <button
                                onClick={() => setSelectedUserDetail(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Encabezado del Perfil */}
                            <div className="flex flex-col items-center text-center pb-1">
                              {selectedUserDetail.foto ? (
                                <img
                                  src={selectedUserDetail.foto}
                                  alt={selectedUserDetail.nombre}
                                  className="h-20 w-20 rounded-full object-cover border-4 border-emerald-500 shadow-md"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-20 w-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center text-emerald-800 text-2xl font-black uppercase shadow-inner">
                                  {selectedUserDetail.nombre.charAt(0)}{selectedUserDetail.apellido.charAt(0)}
                                </div>
                              )}
                              <h4 className="mt-3.5 text-lg font-black text-gray-950 capitalize leading-tight">
                                {selectedUserDetail.nombre} {selectedUserDetail.apellido}
                              </h4>
                              <p className="text-[10px] text-gray-400 font-mono mt-1 tracking-wider bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
                                {selectedUserDetail.codigo}
                              </p>

                              {/* Estado del Pase */}
                              <div className="mt-3">
                                {new Date(selectedUserDetail.vigencia).getTime() > Date.now() ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-100">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                    Pase Activo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold text-orange-700 border border-orange-100 animate-pulse">
                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                                    Pase Vencido
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Datos de Identidad y Contacto */}
                            <div className="space-y-4 text-xs">
                              <div>
                                <h5 className="font-bold text-gray-900 border-l-3 border-emerald-500 pl-2 mb-2">Datos Personales</h5>
                                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                  <div>
                                    <span className="text-[9px] uppercase font-bold text-gray-400 block leading-none">DNI</span>
                                    <p className="font-bold text-gray-800 font-mono mt-1">{selectedUserDetail.dni}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] uppercase font-bold text-gray-400 block leading-none">Edad / Género</span>
                                    <p className="font-semibold text-gray-800 mt-1">
                                      {calcularEdad(selectedUserDetail.fechaNacimiento)} años • {selectedUserDetail.genero || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h5 className="font-bold text-gray-900 border-l-3 border-emerald-500 pl-2 mb-2">Canales de Contacto</h5>
                                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                  <div>
                                    <span className="text-[9px] uppercase font-bold text-gray-400 block leading-none">Celular</span>
                                    <p className="font-semibold text-gray-800 mt-1">{selectedUserDetail.telefono || 'No especificado'}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] uppercase font-bold text-gray-400 block leading-none">E-mail</span>
                                    <p className="font-semibold text-gray-800 font-mono text-[11px] truncate mt-1">{selectedUserDetail.email || 'No especificado'}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] uppercase font-bold text-gray-400 block leading-none">Dirección</span>
                                    <p className="font-semibold text-gray-800 mt-1">
                                      {selectedUserDetail.domicilio ? `${selectedUserDetail.domicilio}, ${selectedUserDetail.localidad || 'Paraná'}` : 'No especificado'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* LUGARES QUE VISITÓ (HISTORIAL DE SECTORES) */}
                              <div>
                                <h5 className="font-black text-gray-900 border-l-3 border-emerald-500 pl-2 mb-2 flex items-center justify-between">
                                  <span>📍 Lugares que visitó</span>
                                  <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100 font-mono">
                                    {selectedUserDetail.visitas || selectedUserDetail.historialVisitas?.length || 0} visitas
                                  </span>
                                </h5>

                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                                  {selectedUserDetail.historialVisitas && selectedUserDetail.historialVisitas.length > 0 ? (
                                    [...selectedUserDetail.historialVisitas].reverse().map((vis, index) => (
                                      <div key={vis.id || index} className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg border border-gray-100 hover:bg-slate-100/50 transition">
                                        <div className="flex items-center gap-2">
                                          <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                                            📍
                                          </div>
                                          <div>
                                            <p className="font-extrabold text-gray-900 text-[11px] leading-tight">
                                              {vis.sectorName}
                                            </p>
                                            <p className="text-[9px] text-gray-400 font-medium">
                                              {new Date(vis.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                                            </p>
                                          </div>
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-500 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                                          {new Date(vis.fecha).toLocaleDateString('es-AR')}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                                      <p className="text-[11px] text-gray-450 italic">
                                        Este usuario aún no registra visitas específicas.<br />(Acceso Libre General al Parque)
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Acciones del Usuario en la Ficha */}
                            <div className="border-t border-gray-100 pt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEliminarVisitanteAction(selectedUserDetail.id, `${selectedUserDetail.nombre} ${selectedUserDetail.apellido}`)}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 py-2.5 text-xs font-bold transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Eliminar Usuario</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-100/60 rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center text-gray-400 space-y-4 sticky top-4">
                            <div className="mx-auto h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-2xl shadow-inner">
                              👤
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-700 text-sm">Ficha de Usuario Vacía</h4>
                              <p className="text-xs text-gray-450 mt-1 max-w-[200px] mx-auto leading-relaxed">
                                Hacé clic sobre el ícono de cualquier deportista del parque para cargar su ficha técnica, pase y sectores visitados.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 5. SECCIÓN : DELEGACIONES / GRUPOS */}
              {activeTab === 'delegaciones' && (
                <div className="space-y-4">
                  <div className="flex justify-end gap-3 text-xs mb-2">
                    <button
                      onClick={handleEliminarDelegacionesVencidas}
                      className="rounded-lg bg-red-50 text-red-700 font-bold hover:bg-red-100 px-3.5 py-1.5 transition border border-red-100"
                    >
                      Eliminar Delegaciones Vencidas
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm">
                    {delegacionesFiltradas.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <Dribbble className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900 border-none">No se encontraron delegaciones</h3>
                        <p className="text-xs text-gray-500 mt-1">Cargue nuevos grupos de atletas desde la página web general.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                            <tr>
                              <th className="p-4">Responsable</th>
                              <th className="p-4">Nombre de Delegación / Club</th>
                              <th className="p-4">Lugar de Origen</th>
                              <th className="p-4">Competencia / Actividad</th>
                              <th className="p-4">Deporte Central</th>
                              <th className="p-4">Días Visita</th>
                              <th className="p-4 text-center">Atletas</th>
                              <th className="p-4">Registro</th>
                              <th className="p-4 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {delegacionesFiltradas.map((d) => (
                              <tr key={d.id} className="hover:bg-gray-50/50">
                                <td className="p-4">
                                  <div className="flex items-center space-x-2.5">
                                    {d.responsable.foto ? (
                                      <img
                                        src={d.responsable.foto}
                                        alt="Selfie"
                                        referrerPolicy="no-referrer"
                                        className="h-8 w-8 rounded-full object-cover border border-gray-100"
                                      />
                                    ) : (
                                      <div className="h-8 w-8 rounded-full bg-emerald-55 flex items-center justify-center font-bold text-gray-600 shrink-0 text-[11px] border">
                                        R
                                      </div>
                                    )}
                                    <div className="leading-tight">
                                      <div className="font-bold text-gray-900">{d.responsable.nombre} {d.responsable.apellido}</div>
                                      <p className="text-[10px] text-gray-400 font-semibold font-mono">DNI {d.responsable.dni}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 font-bold text-gray-900 leading-tight">
                                  {d.nombreEquipo}
                                </td>
                                <td className="p-4 text-gray-600 leading-tight font-medium">
                                  <MapPin className="h-3 w-3 inline text-emerald-700 mr-1" />
                                  <span>{d.origen}</span>
                                </td>
                                <td className="p-4 font-medium text-gray-500">{d.competencia}</td>
                                <td className="p-4">
                                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-800 border border-orange-100 uppercase">
                                    {d.deportePrincipal || d.deportes}
                                  </span>
                                </td>
                                <td className="p-4 text-center text-gray-900 font-semibold">{d.diasVisita} días</td>
                                <td className="p-4 text-center font-bold text-emerald-800">
                                  {d.integrantes ? d.integrantes.length : 0} integrantes
                                </td>
                                <td className="p-4 text-[10px] text-gray-400">{new Date(d.fechaRegistro).toLocaleString('es-AR')}</td>
                                <td className="p-4 text-right space-x-1.5">
                                  <button
                                    onClick={() => setSelectedDelegacion(d)}
                                    className="inline-flex items-center space-x-1 font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 hover:bg-emerald-50 rounded-lg transition"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Ver</span>
                                  </button>
                                  <button
                                    onClick={() => handleEliminarDelegacion(d.id)}
                                    className="text-red-650 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-lg transition inline-block/5 text-[11px]"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECCIÓN CARGA DE EVENTOS */}
              {activeTab === 'eventos' && (
                <div className="space-y-6">
                  {/* Botón superior para desplegar formulario de alta */}
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-150 shadow-sm">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Agenda Activa ({eventos.length} eventos registrados)</h3>
                      <p className="text-xs text-gray-400">Agregá y administrá actividades deportivas, clínicas y competencias en tiempo real.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddEvent(!showAddEvent)}
                      className="px-4 py-2 bg-[#2C5F2D] text-white hover:bg-emerald-900 transition rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <span>{showAddEvent ? '✕ Cerrar Formulario' : '＋ Registrar Nuevo Evento'}</span>
                    </button>
                  </div>

                  {/* Formulario de Alta de Evento */}
                  {showAddEvent && (
                    <form
                      onSubmit={handleAgregarEvento}
                      className="bg-white p-6 rounded-2xl border border-emerald-100/70 shadow-md space-y-4 max-w-3xl animate-fade-in"
                    >
                      <h3 className="text-sm font-black text-[#2C5F2D] flex items-center gap-2 border-b border-gray-150 pb-2">
                        <span>📝</span> Detallar Nueva Actividad Deportiva
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Título */}
                        <div className="col-span-full space-y-1">
                          <label className="font-bold text-gray-700">Título del Evento *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Liga Paranaense de Vóley o Clínica de iniciación..."
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-[#2C5F2D] bg-gray-50/50"
                          />
                        </div>

                        {/* Categoría */}
                        <div className="space-y-1">
                          <label className="font-bold text-gray-700">Categoría *</label>
                          <select
                            value={newEvent.category}
                            onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-[#2C5F2D] bg-gray-50/50"
                          >
                            <option value="Competencia Deportiva">Competencia Deportiva</option>
                            <option value="Escolar">Escolar / Formativo</option>
                            <option value="Salud / Recreación">Salud / Recreación</option>
                            <option value="Solidario / Comunitario">Solidario / Comunitario</option>
                            <option value="Federado / Oficial">Federado / Oficial</option>
                            <option value="Deporte Formativo">Deporte Formativo</option>
                          </select>
                        </div>

                        {/* Estado */}
                        <div className="space-y-1">
                          <label className="font-bold text-gray-700">Estado del Evento *</label>
                          <select
                            value={newEvent.status}
                            onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value as 'activo' | 'proximo' })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-[#2C5F2D] bg-gray-50/50"
                          >
                            <option value="activo">En curso (Se realiza en este momento)</option>
                            <option value="proximo">Próximo (A programar o realizarse)</option>
                          </select>
                        </div>

                        {/* Sector del Parque */}
                        <div className="space-y-1">
                          <label className="font-bold text-gray-700">Ubicación / Sector del Parque *</label>
                          <select
                            value={newEvent.sector}
                            onChange={(e) => setNewEvent({ ...newEvent, sector: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-[#2C5F2D] bg-gray-50/50"
                          >
                            <option value="Gimnasio Cubierto (Básquetbol)">Gimnasio Cubierto (Básquetbol)</option>
                            <option value="Playón Polideportivo Abierto">Playón Polideportivo Abierto</option>
                            <option value="Canchas de Pádel Vidriadas de Césped Sintético">Canchas de Pádel Vidriadas (Pádel)</option>
                            <option value="Pista de Atletismo (Sector Recta Principal)">Pista de Atletismo (Atletismo)</option>
                            <option value="Pileta Olímpica Climatizada">Pileta Olímpica Climatizada (Natación)</option>
                            <option value="Gimnasio Cubierto (Vóley - Parquet Flotante)">Gimnasio Cubierto (Vóley / Handball)</option>
                            <option value="Suela de Césped del Campo Principal de Rugby">Campo Principal de Rugby y Fútbol</option>
                            <option value="Sala de Musculación y Fuerza">Sala de Musculación</option>
                          </select>
                        </div>

                        {/* Fecha */}
                        <div className="space-y-1">
                          <label className="font-bold text-gray-700">Fecha del Evento *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Hoy, 16 de Junio, o Sábado 20 de Junio"
                            value={newEvent.fecha}
                            onChange={(e) => setNewEvent({ ...newEvent, fecha: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-[#2C5F2D] bg-gray-50/50"
                          />
                        </div>

                        {/* Hora Inicio */}
                        <div className="space-y-1">
                          <label className="font-bold text-gray-700">Hora de Inicio *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: 15:30 hs o 08:30 hs"
                            value={newEvent.horaInicio}
                            onChange={(e) => setNewEvent({ ...newEvent, horaInicio: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-[#2C5F2D] bg-gray-50/50"
                          />
                        </div>

                        {/* Duración */}
                        <div className="space-y-1">
                          <label className="font-bold text-gray-700">Duración o Detalle adicional</label>
                          <input
                            type="text"
                            placeholder="Ej: 15:30 a 18:00 hs, o Iniciado..."
                            value={newEvent.duracion}
                            onChange={(e) => setNewEvent({ ...newEvent, duracion: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-[#2C5F2D] bg-gray-50/50"
                          />
                        </div>

                        {/* Ícono descriptivo */}
                        <div className="space-y-1">
                          <label className="font-bold text-gray-700">Identificador / Deporte Ícono</label>
                          <select
                            value={newEvent.icon}
                            onChange={(e) => setNewEvent({ ...newEvent, icon: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-[#2C5F2D] bg-gray-50/50"
                          >
                            <option value="Flame">🏃 Persona Corriendo (Atletismo)</option>
                            <option value="Droplets">🏊 Persona Nadando (Natación / Pileta)</option>
                            <option value="Target">🏀 Pelota de Básquetbol (Básquet / Playón)</option>
                            <option value="Activity">🎾 Raqueta y Pelota (Pádel)</option>
                            <option value="Trophy">🏉 Pelota de Rugby (Rugby / Fútbol)</option>
                            <option value="Sparkles">🏐 Pelota de Vóley (Vóley)</option>
                            <option value="Heart">🏋️ Pesas y Fuerza (Musculación)</option>
                            <option value="Smile">😊 Salud y Recreación / Juegos</option>
                          </select>
                        </div>

                        {/* Tipo de Entrada */}
                        <div className="space-y-1 overflow-hidden">
                          <label className="font-bold text-gray-700">Tipo de Entrada *</label>
                          <select
                            value={newEvent.entryType || 'gratis'}
                            onChange={(e) => setNewEvent({ ...newEvent, entryType: e.target.value as 'gratis' | 'pago' })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-[#2C5F2D] bg-gray-50/50"
                          >
                            <option value="gratis">Gratuita (Ingreso libre)</option>
                            <option value="pago">Arancelada (Requiere entrada / pago)</option>
                          </select>
                        </div>

                        {/* Precio de la Entrada */}
                        <div className={`space-y-1 transition-all duration-300 ${newEvent.entryType === 'pago' ? 'opacity-100 scale-100' : 'opacity-40 select-none'}`}>
                          <label className="font-bold text-gray-700">Precio de Entrada ($ ARS) {newEvent.entryType === 'pago' && '*'}</label>
                          <input
                            type="text"
                            required={newEvent.entryType === 'pago'}
                            disabled={newEvent.entryType !== 'pago'}
                            placeholder="Ej: 1500 o 3000..."
                            value={newEvent.price || ''}
                            onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-[#2C5F2D] bg-gray-50/50"
                          />
                        </div>

                        {/* Descripción */}
                        <div className="col-span-full space-y-1">
                          <label className="font-bold text-gray-700">Descripción breve del Evento</label>
                          <textarea
                            rows={3}
                            placeholder="Brindá detalles atractivos para el público..."
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-[#2C5F2D] bg-gray-50/50 resize-y"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setShowAddEvent(false)}
                          className="px-4 py-2 border border-gray-200 hover:bg-gray-50 transition rounded-xl text-xs font-bold text-gray-500 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#2C5F2D] text-white hover:bg-emerald-900 transition rounded-xl text-xs font-bold shadow-md cursor-pointer"
                        >
                          Guardar Actividad
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tabla / Lista de Eventos Registrados */}
                  <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
                    {eventos.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900 border-none font-sans">No hay eventos ingresados</h3>
                        <p className="text-xs text-gray-500 mt-1">Cargá nuevas actividades usando el formulario de arriba.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#F8FAF8] text-[10px] font-extrabold uppercase tracking-widest text-[#2C5F2D] border-b border-gray-150">
                            <tr>
                              <th className="p-4">Evento / Actividad</th>
                              <th className="p-4">Categoría</th>
                              <th className="p-4">Estado</th>
                              <th className="p-4">Sector del Parque</th>
                              <th className="p-4">Entrada</th>
                              <th className="p-4">Fecha y Hora</th>
                              <th className="p-4">Detalles</th>
                              <th className="p-4 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 leading-normal mb-1">
                            {eventos.map((evt) => {
                              const isActive = evt.status === 'activo';
                              return (
                                <tr key={evt.id} className="hover:bg-gray-50/50 transition">
                                  <td className="p-4 font-bold text-gray-950 max-w-xs truncate">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">
                                        {evt.icon === 'Flame' && '🏃'}
                                        {evt.icon === 'Droplets' && '🏊'}
                                        {evt.icon === 'Target' && '🏀'}
                                        {evt.icon === 'Activity' && '🎾'}
                                        {evt.icon === 'Trophy' && '🏉'}
                                        {evt.icon === 'Sparkles' && '🏐'}
                                        {evt.icon === 'Heart' && '🏋️'}
                                        {evt.icon === 'Smile' && '😊'}
                                        {!['Target','Activity','Trophy','Flame','Droplets','Smile','Sparkles','Heart'].includes(evt.icon) && '📅'}
                                      </span>
                                      <span>{evt.title}</span>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] tracking-wide">
                                      {evt.category}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    {isActive ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-black tracking-wide text-[9px] border border-red-100 uppercase animate-pulse">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                        En Curso
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold tracking-wide text-[9px] border border-emerald-100 uppercase">
                                        Próximo
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-gray-600 font-semibold">{evt.sector}</td>
                                  <td className="p-4">
                                    {evt.entryType === 'pago' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-bold tracking-wide text-[9px] border border-orange-150 uppercase">
                                        💵 ${evt.price || '0'}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EBF5EC] text-[#2C5F2D] font-bold tracking-wide text-[9px] border border-[#D5EAD8] uppercase">
                                        🎟️ Gratuito
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 font-mono text-gray-500">
                                    <div className="font-bold text-gray-800">{evt.fecha}</div>
                                    <div>{evt.horaInicio}</div>
                                  </td>
                                  <td className="p-4 max-w-xs truncate text-gray-400 font-normal">
                                    {evt.description || '-'}
                                  </td>
                                  <td className="p-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleEliminarEvento(evt.id)}
                                      className="text-red-650 font-bold hover:text-red-800 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition text-[11px]"
                                    >
                                      Eliminar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 6. SECCIÓN: DASHBOARD DE MÉTRICAS Y EVENTOS DEPORTIVOS */}
              {activeTab === 'metricas' && (
                <div className="space-y-6">
                  
                  {/* METRICAS GENERALES - KPIN CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Turnos Totales</span>
                        <h4 className="mt-1 text-2xl font-extrabold text-gray-900">{totalTurnos}</h4>
                        <p className="text-[10px] text-gray-500 mt-1">Canchas deportivas de Paraná</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-850">
                        <Calendar className="h-5.5 w-5.5" />
                      </div>
                    </div>
                    
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pases de Visitantes</span>
                        <h4 className="mt-1 text-2xl font-extrabold text-gray-900">{totalVisitantesReg}</h4>
                        <p className="text-[10px] text-emerald-800 font-semibold mt-1">Retención recurrentes: {pctRecurrentes}%</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-800">
                        <Users className="h-5.5 w-5.5" />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Edad Promedio Visitantes</span>
                        <h4 className="mt-1 text-2xl font-extrabold text-gray-900">{edadPromedio} <span className="text-xs font-normal text-gray-400">años</span></h4>
                        <p className="text-[10px] text-gray-500 mt-1">Tasa conversión DNI: {tasaConversion}%</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                        <TrendingUp className="h-5.5 w-5.5" />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Hora Pico del Parque</span>
                        <h4 className="mt-1 text-xl font-extrabold text-gray-900">{horaPico[0]}</h4>
                        <p className="text-[10px] text-orange-700 font-semibold mt-1">Turnos cancelados/vencidos: {pctVencidos}%</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-800">
                        <Clock className="h-5.5 w-5.5" />
                      </div>
                    </div>
                  </div>

                  {/* PROFESORES Y DELEGACIONES MÉTRICAS & TORNEOS */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
                    
                    {/* Profesores por Clases */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-1">
                      <h4 className="font-extrabold text-gray-950 text-xs uppercase tracking-wider text-gray-400 mb-4 flex items-center space-x-1">
                        <Award className="h-4.5 w-4.5 text-emerald-800" />
                        <span>Desempeño del Elenco de Profesores</span>
                      </h4>
                      <div className="divide-y divide-gray-100 text-xs">
                        {rankingProfesores.slice(0, 5).map((prof, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2.5">
                            <div className="leading-tight">
                              <span className="font-bold text-gray-900 block">{prof.nombre}</span>
                              <span className="text-[10px] text-gray-400 font-semibold uppercase">{prof.deporte}</span>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                              {prof.turnosCount} turnos
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Procedencia de las delegaciones */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-1">
                      <h4 className="font-extrabold text-gray-950 text-xs uppercase tracking-wider text-gray-400 mb-4">
                        Procedencia y Competencias
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Procedencia (Top Ciudades)</span>
                          {Object.entries(delPorOrigen).length === 0 ? (
                            <p className="text-xs text-gray-400">No hay datos de delegación militar o civil.</p>
                          ) : (
                            <div className="space-y-2">
                              {Object.entries(delPorOrigen).map(([ ciudad, total ]) => (
                                <div key={ciudad} className="flex justify-between items-center text-xs text-gray-700">
                                  <span className="font-medium">{ciudad}</span>
                                  <span className="font-bold">{total} delegaciones</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Por Tipo de Competencia</span>
                          {Object.entries(delPorCompetencia).length === 0 ? (
                            <p className="text-xs text-gray-400">Sin datos de torneos de club.</p>
                          ) : (
                            <div className="space-y-2">
                              {Object.entries(delPorCompetencia).map(([ comp, total ]) => (
                                <div key={comp} className="flex items-center justify-between text-xs text-gray-700">
                                  <span className="font-medium leading-tight truncate max-w-[160px]">{comp}</span>
                                  <span className="font-bold shrink-0">{total} clubs</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Torneos & Botón Crear Torneo */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-extrabold text-gray-950 text-xs uppercase tracking-wider text-gray-400">
                            Torneos y Eventos
                          </h4>
                          <button
                            onClick={() => setShowAddTorneo(true)}
                            className="flex items-center space-x-1 bg-emerald-800 hover:bg-emerald-900 border-none text-white text-[10px] px-2 py-1.5 rounded-lg font-bold transition cursor-pointer"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span>Crear Torneo</span>
                          </button>
                        </div>

                        {/* Listado de torneos locales */}
                        <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
                          {torneos.map((tor) => (
                            <div key={tor.id} className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-xs text-gray-700 leading-tight">
                              <div className="flex justify-between font-bold text-gray-900">
                                <span className="truncate max-w-[170px]">{tor.nombre}</span>
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                                  tor.estado === 'Finalizado' ? 'bg-zinc-200 text-zinc-700' :
                                  tor.estado === 'En Curso' ? 'bg-orange-100 text-orange-950' :
                                  'bg-green-100 text-green-909'
                                }`}>
                                  {tor.estado}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-gray-500 font-semibold">
                                <div>Deporte: <span className="font-bold capitalize text-emerald-800">{tor.deporte}</span></div>
                                <div>Atletas: <span className="font-bold text-gray-850">{tor.participantes}</span></div>
                              </div>
                              {tor.ganador && (
                                <div className="mt-1.5 text-[10px] text-slate-800 font-bold flex items-center space-x-1">
                                  <span>🏆</span>
                                  <span>Ganador: {tor.ganador}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

                  {/* ======================================================== */}
                  {/* SISTEMA DE INTELIGENCIA OPERACIONAL CON MAPA INTERACTIVO */}
                  {/* ======================================================== */}
                  {activeTab === 'berduc-brain' && (() => {
                    const mapSectorsList = [
                      { id: 'atletismo', name: 'Pista de Atletismo (E01)', desc: 'Pista de atletismo y lanzamiento', maxCap: 80, emoji: '🏃', color: '#E07A5F' },
                      { id: 'futbol', name: 'Campo de Fútbol & Rugby (E02)', desc: 'Cancha central de césped natural', maxCap: 55, emoji: '⚽', color: '#2C5F2D' },
                      { id: 'natacion', name: 'Pileta Olímpica Climatizada (E03)', desc: 'Natatorio olímpico bajo supervisión', maxCap: 40, emoji: '🏊', color: '#5FA8D3' },
                      { id: 'padel', name: 'Canchas de Pádel Vidriadas (E04)', desc: 'Complejo de canchas de pádel profesional', maxCap: 16, emoji: '🎾', color: '#3D5A80' },
                      { id: 'voley', name: 'Gimnasio Techado / Polideportivo (E05)', desc: 'Estadio cerrado de Vóley y Básquet', maxCap: 60, emoji: '🏐', color: '#F2CC8F' },
                      { id: 'musculacion', name: 'Sala de Musculación & Wellness (E06)', desc: 'Gimnasio de fuerza y sobrecarga', maxCap: 25, emoji: '🏋️', color: '#813772' },
                      { id: 'playon', name: 'Playón Multideportivo Abierto (E07)', desc: 'Básquet, handball y recreación libre', maxCap: 45, emoji: '🏀', color: '#9A7B56' },
                      { id: 'recreativo', name: 'Espacio de Juegos y Recreación (E08)', desc: 'Área libre para actividad aeróbica e infantil', maxCap: 35, emoji: '🪁', color: '#4EA8DE' }
                    ];

                    const getSectorStats = (sectorId: string) => {
                      let weight = 0.12; 
                      let childrenPct = 0.20;
                      let teensPct = 0.20;
                      let youthPct = 0.25;
                      let adultsPct = 0.25;
                      let seniorsPct = 0.10;

                      if (simulationProfile === 'normal') {
                        if (sectorId === 'atletismo') { weight = 0.22; childrenPct = 0.10; teensPct = 0.30; youthPct = 0.35; adultsPct = 0.20; seniorsPct = 0.05; }
                        else if (sectorId === 'futbol') { weight = 0.20; childrenPct = 0.15; teensPct = 0.25; youthPct = 0.30; adultsPct = 0.25; seniorsPct = 0.05; }
                        else if (sectorId === 'natacion') { weight = 0.14; childrenPct = 0.30; teensPct = 0.15; youthPct = 0.25; adultsPct = 0.20; seniorsPct = 0.10; }
                        else if (sectorId === 'padel') { weight = 0.08; childrenPct = 0.05; teensPct = 0.05; youthPct = 0.20; adultsPct = 0.50; seniorsPct = 0.20; }
                        else if (sectorId === 'voley') { weight = 0.14; childrenPct = 0.10; teensPct = 0.35; youthPct = 0.30; adultsPct = 0.20; seniorsPct = 0.05; }
                        else if (sectorId === 'musculacion') { weight = 0.08; childrenPct = 0.00; teensPct = 0.10; youthPct = 0.45; adultsPct = 0.40; seniorsPct = 0.05; }
                        else if (sectorId === 'playon') { weight = 0.08; childrenPct = 0.25; teensPct = 0.35; youthPct = 0.25; adultsPct = 0.12; seniorsPct = 0.03; }
                        else if (sectorId === 'recreativo') { weight = 0.06; childrenPct = 0.50; teensPct = 0.10; youthPct = 0.05; adultsPct = 0.30; seniorsPct = 0.05; }
                      } else if (simulationProfile === 'alta_competencia') {
                        if (sectorId === 'atletismo') { weight = 0.30; childrenPct = 0.02; teensPct = 0.28; youthPct = 0.50; adultsPct = 0.18; seniorsPct = 0.02; }
                        else if (sectorId === 'futbol') { weight = 0.25; childrenPct = 0.02; teensPct = 0.18; youthPct = 0.55; adultsPct = 0.23; seniorsPct = 0.02; }
                        else if (sectorId === 'natacion') { weight = 0.15; childrenPct = 0.05; teensPct = 0.25; youthPct = 0.45; adultsPct = 0.22; seniorsPct = 0.03; }
                        else if (sectorId === 'padel') { weight = 0.05; childrenPct = 0.00; teensPct = 0.10; youthPct = 0.30; adultsPct = 0.50; seniorsPct = 0.10; }
                        else if (sectorId === 'voley') { weight = 0.15; childrenPct = 0.02; teensPct = 0.33; youthPct = 0.45; adultsPct = 0.18; seniorsPct = 0.02; }
                        else if (sectorId === 'musculacion') { weight = 0.10; childrenPct = 0.00; teensPct = 0.05; youthPct = 0.60; adultsPct = 0.33; seniorsPct = 0.02; }
                        else if (sectorId === 'playon') { weight = 0.00; childrenPct = 0.00; teensPct = 0.00; youthPct = 0.00; adultsPct = 0.00; seniorsPct = 0.00; }
                        else if (sectorId === 'recreativo') { weight = 0.00; childrenPct = 0.00; teensPct = 0.00; youthPct = 0.00; adultsPct = 0.00; seniorsPct = 0.00; }
                      } else if (simulationProfile === 'recreativo_infantil') {
                        if (sectorId === 'atletismo') { weight = 0.08; childrenPct = 0.20; teensPct = 0.20; youthPct = 0.20; adultsPct = 0.30; seniorsPct = 0.10; }
                        else if (sectorId === 'futbol') { weight = 0.10; childrenPct = 0.35; teensPct = 0.20; youthPct = 0.15; adultsPct = 0.25; seniorsPct = 0.05; }
                        else if (sectorId === 'natacion') { weight = 0.22; childrenPct = 0.45; teensPct = 0.15; youthPct = 0.15; adultsPct = 0.20; seniorsPct = 0.05; }
                        else if (sectorId === 'padel') { weight = 0.04; childrenPct = 0.10; teensPct = 0.10; youthPct = 0.10; adultsPct = 0.40; seniorsPct = 0.30; }
                        else if (sectorId === 'voley') { weight = 0.04; childrenPct = 0.25; teensPct = 0.25; youthPct = 0.15; adultsPct = 0.25; seniorsPct = 0.10; }
                        else if (sectorId === 'musculacion') { weight = 0.02; childrenPct = 0.00; teensPct = 0.05; youthPct = 0.35; adultsPct = 0.45; seniorsPct = 0.15; }
                        else if (sectorId === 'playon') { weight = 0.20; childrenPct = 0.40; teensPct = 0.30; youthPct = 0.10; adultsPct = 0.15; seniorsPct = 0.05; }
                        else if (sectorId === 'recreativo') { weight = 0.30; childrenPct = 0.65; teensPct = 0.05; youthPct = 0.05; adultsPct = 0.20; seniorsPct = 0.05; }
                      }

                      // Sume de turnos reales de este deporte
                      const activeTurnosDeporte = turnosActivos.filter(t => t.deporte === sectorId).length;
                      const athletesTurnos = activeTurnosDeporte * 4;

                      // Visitantes reales distribuidos
                      const totalRealVisitors = visitantesActivos.length > 0 ? visitantesActivos.length : (visitantes.length > 5 ? 8 : visitantes.length);
                      const poolPeople = totalRealVisitors + simulatedExtraPeople;
                      const assignedGeneral = Math.round(poolPeople * weight);

                      const finalCount = Math.max(assignedGeneral + athletesTurnos, athletesTurnos);
                      const capMap: { [key: string]: number } = {
                        atletismo: 80,
                        futbol: 55,
                        natacion: 40,
                        padel: 16,
                        voley: 60,
                        musculacion: 25,
                        playon: 45,
                        recreativo: 35
                      };
                      const maxCap = capMap[sectorId] || 40;
                      const occupancyPct = Math.min(Math.round((finalCount / maxCap) * 100), 100);

                      const c = Math.round(finalCount * childrenPct);
                      const t = Math.round(finalCount * teensPct);
                      const y = Math.round(finalCount * youthPct);
                      const a = Math.round(finalCount * adultsPct);
                      const s = Math.max(finalCount - (c + t + y + a), 0);

                      let level: 'bajo' | 'medio' | 'alto' | 'sobrecargado' = 'bajo';
                      if (occupancyPct > 85) level = 'sobrecargado';
                      else if (occupancyPct > 60) level = 'alto';
                      else if (occupancyPct > 25) level = 'medio';

                      let statusText = 'Normal';
                      if (level === 'sobrecargado') statusText = 'Saturación Operativa';
                      else if (level === 'alto') statusText = 'Concurrencia Elevada';
                      else if (level === 'medio') statusText = 'Flujo Moderado';
                      else statusText = 'Flujo Despejado';

                      let actions = 'Monitoreo estándar. Sector operando en condiciones óptimas.';
                      if (level === 'sobrecargado') {
                        actions = '▲ ACCIÓN CRÍTICA: Desviar nuevos deportistas a playones alternativos y habilitar personal de apoyo adicional.';
                      } else if (level === 'alto') {
                        actions = '⚠ ALERTA DE CAPACIDAD: Coordinar con los profesores para dosificar turnos de juego de forma rotativa.';
                      } else if (sectorId === 'natacion' && finalCount > 15) {
                        actions = '🏊 RECOMENDACIÓN: Reforzar vigilancia perimetral y asegurar andarivel rápido para nadadores habituales.';
                      }

                      return {
                        count: finalCount,
                        cap: maxCap,
                        occupancyPct,
                        level,
                        statusText,
                        actions,
                        breakdown: {
                          children: c,
                          teens: t,
                          youth: y,
                          adults: a,
                          seniors: s
                        },
                        percents: {
                          children: Math.round(childrenPct * 100),
                          teens: Math.round(teensPct * 100),
                          youth: Math.round(youthPct * 100),
                          adults: Math.round(adultsPct * 100),
                          seniors: Math.round(seniorsPct * 100)
                        }
                      };
                    };

                    const activeSectorStats = getSectorStats(selectedMapSector);
                    const activeSectorMeta = mapSectorsList.find(s => s.id === selectedMapSector) || mapSectorsList[0];

                    return (
                      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-xl space-y-6">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
                              <Sparkles className="h-6 w-6 animate-pulse" />
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold tracking-wide uppercase text-slate-100 flex flex-wrap items-center gap-2">
                                <span>Berduc Brain v3.5</span>
                                <span className="text-[10px] font-mono bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded-md uppercase tracking-widest leading-none">Inteligencia Operacional</span>
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">Monitoreo de flujo, aforo, ocupación y segmentación demográfica por sectores en tiempo real.</p>
                            </div>
                          </div>

                          {/* Simulador Controls */}
                          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex flex-wrap items-center gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Perfil de Simulación</label>
                              <select
                                value={simulationProfile}
                                onChange={(e) => setSimulationProfile(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 font-bold"
                              >
                                <option value="normal">Normal (Tarde Regular)</option>
                                <option value="alta_competencia">Clínica / Alta Competencia</option>
                                <option value="recreativo_infantil">Tarde Familiar / Recreación</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2">
                                <span>Inyección de Tránsito</span>
                                <span className="text-emerald-400 font-mono">+{simulatedExtraPeople} pers.</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="150"
                                  value={simulatedExtraPeople}
                                  onChange={(e) => setSimulatedExtraPeople(Number(e.target.value))}
                                  className="w-32 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <span className="text-[10px] text-slate-455 font-bold">150 Max</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Main Workspace: 2 Column Layout (Map left, Details Right) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          
                          {/* Left: Custom SVG Map Schematic */}
                          <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-emerald-500" />
                                <span className="text-slate-200 font-bold">Plano General de Sectores (Pdo. Enrique Berduc)</span>
                              </span>
                              <span className="text-[9px] font-bold font-mono text-slate-550">Paraná, Entre Ríos</span>
                            </div>

                            {/* Interactive SVG Schematic Map */}
                            <div className="relative aspect-[500/320] w-full bg-slate-900/40 rounded-lg border border-slate-800/80 flex items-center justify-center p-2">
                              <svg viewBox="0 0 500 320" className="w-full h-full select-none text-xs">
                                {/* Outer Boundary Frame */}
                                <rect x="5" y="5" width="490" height="310" rx="12" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3 3" />
                                
                                {/* Streets */}
                                <text x="250" y="18" fill="#475569" className="font-bold tracking-widest text-[8px] uppercase text-center" textAnchor="middle">Calle San Lorenzo (Norte)</text>
                                <text x="250" y="310" fill="#475569" className="font-bold tracking-widest text-[8px] uppercase text-center" textAnchor="middle">Calle Nogoyá (Sur)</text>
                                <text x="18" y="160" fill="#475569" className="font-bold tracking-widest text-[8px] uppercase text-center" textAnchor="middle" transform="rotate(-90 18 160)">Calle Salta (Oeste)</text>
                                <text x="485" y="160" fill="#475569" className="font-bold tracking-widest text-[8px] uppercase text-center" textAnchor="middle" transform="rotate(90 485 160)">Calle Corrientes (Este)</text>

                                {/* Base Land Grid lines */}
                                <path d="M 50,0 L 50,320 M 100,0 L 100,320 M 150,0 L 150,320 M 200,0 L 200,320 M 250,0 L 250,320 M 300,0 L 300,320 M 350,0 L 350,320 M 400,0 L 400,320 M 450,0 L 450,320" fill="none" stroke="#0f172a" strokeWidth="0.5" />
                                <path d="M 0,50 L 500,50 M 0,100 L 500,100 M 0,150 L 500,150 M 0,200 L 500,200 M 0,250 L 500,250 M 0,300 L 500,300" fill="none" stroke="#0f172a" strokeWidth="0.5" />

                                {/* ======================================= */}
                                {/* SECTOR 1: Pista Atletismo (Grand Oval) */}
                                {/* ======================================= */}
                                <g 
                                  onClick={() => setSelectedMapSector('atletismo')}
                                  className="cursor-pointer group"
                                >
                                  <ellipse cx="200" cy="165" rx="130" ry="85" fill="none" stroke={selectedMapSector==='atletismo' ? '#E07A5F':'#475569'} strokeWidth={selectedMapSector==='atletismo'?'3.5':'1.5'} className="transition-all duration-200" />
                                  <ellipse cx="200" cy="165" rx="100" ry="60" fill="none" stroke="#1e293b" strokeWidth="1" />
                                  <ellipse cx="200" cy="165" rx="115" ry="72" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 2" />
                                  
                                  <text x="210" y="93" fill={selectedMapSector==='atletismo' ? '#E07A5F':'#94a3b8'} className="font-extrabold font-mono text-[9px] hover:scale-105 transition-transform" textAnchor="middle">🏃 Pista Atletismo</text>
                                  {/* Pulse Dot */}
                                  {(() => {
                                    const stats = getSectorStats('atletismo');
                                    return (
                                      <g>
                                        <circle cx="200" cy="107" r="5" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} className={stats.level==='sobrecargado'?'animate-pulse':''} />
                                        <circle cx="200" cy="107" r="3" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} />
                                      </g>
                                    );
                                  })()}
                                </g>

                                {/* ======================================= */}
                                {/* SECTOR 2: Campo Fútbol (Inside Oval) */}
                                {/* ======================================= */}
                                <g 
                                  onClick={() => setSelectedMapSector('futbol')}
                                  className="cursor-pointer group"
                                >
                                  <rect x="135" y="130" width="130" height="70" rx="4" fill={selectedMapSector==='futbol'?'#2C5F2D':'#0f172a'} fillOpacity={selectedMapSector==='futbol'?'0.35':'0.1'} stroke={selectedMapSector==='futbol'?'#2C5F2D':'#334155'} strokeWidth="1.5" className="transition-all" />
                                  <line x1="200" y1="130" x2="200" y2="200" stroke="#1e293b" strokeWidth="1" />
                                  <circle cx="200" cy="165" r="15" fill="none" stroke="#1e293b" strokeWidth="1" />

                                  <text x="200" y="168" fill={selectedMapSector==='futbol'?'#4ADE80':'#475569'} className="font-extrabold text-[8px] uppercase tracking-wider text-center" textAnchor="middle">⚽ Campo Fútbol</text>
                                  
                                  {/* Live indicators */}
                                  {(() => {
                                    const stats = getSectorStats('futbol');
                                    return (
                                      <g>
                                        <circle cx="200" cy="182" r="5" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} className={stats.level==='sobrecargado'?'animate-pulse':''} />
                                        <circle cx="200" cy="182" r="3" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} />
                                      </g>
                                    );
                                  })()}
                                </g>

                                {/* ======================================= */}
                                {/* SECTOR 3: Pileta Climatizada (South West) */}
                                {/* ======================================= */}
                                <g 
                                  onClick={() => setSelectedMapSector('natacion')}
                                  className="cursor-pointer group"
                                >
                                  <rect x="35" y="215" width="80" height="55" rx="6" fill={selectedMapSector==='natacion'?'#5FA8D3':'#0f172a'} fillOpacity={selectedMapSector==='natacion'?'0.35':'0.1'} stroke={selectedMapSector==='natacion'?'#5FA8D3':'#334155'} strokeWidth="1.5" />
                                  <line x1="35" y1="225" x2="115" y2="225" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
                                  <line x1="35" y1="235" x2="115" y2="235" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
                                  <line x1="35" y1="245" x2="115" y2="245" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
                                  <line x1="35" y1="255" x2="115" y2="255" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />

                                  <text x="75" y="247" fill={selectedMapSector==='natacion'?'#93C5FD':'#64748b'} className="font-extrabold text-[8px] uppercase text-center" textAnchor="middle">🏊 Pileta</text>
                                  
                                  {/* Indicator */}
                                  {(() => {
                                    const stats = getSectorStats('natacion');
                                    return (
                                      <g>
                                        <circle cx="105" cy="225" r="5" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} className={stats.level==='sobrecargado'?'animate-pulse':''} />
                                        <circle cx="105" cy="225" r="3" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} />
                                      </g>
                                    );
                                  })()}
                                </g>

                                {/* ======================================= */}
                                {/* SECTOR 4: Cancha Pádel (North West) */}
                                {/* ======================================= */}
                                <g 
                                  onClick={() => setSelectedMapSector('padel')}
                                  className="cursor-pointer group"
                                >
                                  <rect x="35" y="45" width="70" height="42" rx="4" fill={selectedMapSector==='padel'?'#3D5A80':'#0f172a'} fillOpacity={selectedMapSector==='padel'?'0.35':'0.1'} stroke={selectedMapSector==='padel'?'#3D5A80':'#334155'} strokeWidth="1.5" />
                                  <line x1="70" y1="45" x2="70" y2="87" stroke="#1e293b" strokeWidth="0.8" />
                                  <line x1="35" y1="66" x2="105" y2="66" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="1" />

                                  <text x="70" y="70" fill={selectedMapSector==='padel'?'#FFF':'#475569'} className="font-extrabold text-[8px] uppercase text-center" textAnchor="middle">🎾 Pádel</text>
                                  
                                  {/* Indicator */}
                                  {(() => {
                                    const stats = getSectorStats('padel');
                                    return (
                                      <g>
                                        <circle cx="95" cy="55" r="5" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} className={stats.level==='sobrecargado'?'animate-pulse':''} />
                                        <circle cx="95" cy="55" r="3" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} />
                                      </g>
                                    );
                                  })()}
                                </g>

                                {/* ======================================= */}
                                {/* SECTOR 5: Gimnasio Cerrado (North East) */}
                                {/* ======================================= */}
                                <g 
                                  onClick={() => setSelectedMapSector('voley')}
                                  className="cursor-pointer group"
                                >
                                  <rect x="355" y="42" width="105" height="60" rx="8" fill={selectedMapSector==='voley'?'#D97706':'#0f172a'} fillOpacity={selectedMapSector==='voley'?'0.3':'0.05'} stroke={selectedMapSector==='voley'?'#F59E0B':'#334155'} strokeWidth="1.5" />
                                  <path d="M 355,72 L 460,72" stroke="#1e293b" strokeWidth="0.8" />
                                  <circle cx="407.5" cy="72" r="10" fill="none" stroke="#1e293b" strokeWidth="0.8" />

                                  <text x="407" y="75" fill={selectedMapSector==='voley'?'#FBBF24':'#475569'} className="font-extrabold text-[8px] uppercase text-center" textAnchor="middle">🏐 GIMNASIO</text>
                                  
                                  {/* Indicator */}
                                  {(() => {
                                    const stats = getSectorStats('voley');
                                    return (
                                      <g>
                                        <circle cx="445" cy="54" r="5" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} className={stats.level==='sobrecargado'?'animate-pulse':''} />
                                        <circle cx="445" cy="54" r="3" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} />
                                      </g>
                                    );
                                  })()}
                                </g>

                                {/* ======================================= */}
                                {/* SECTOR 6: Musculación (South East) */}
                                {/* ======================================= */}
                                <g 
                                  onClick={() => setSelectedMapSector('musculacion')}
                                  className="cursor-pointer group"
                                >
                                  <rect x="375" y="215" width="85" height="55" rx="6" fill={selectedMapSector==='musculacion'?'#813772':'#0f172a'} fillOpacity={selectedMapSector==='musculacion'?'0.35':'0.1'} stroke={selectedMapSector==='musculacion'?'#813772':'#334155'} strokeWidth="1.5" />
                                  
                                  {/* Dumbbell shape */}
                                  <rect x="405" y="247" width="25" height="4" fill="#1e293b" rx="1" />
                                  <rect x="402" y="243" width="4" height="12" fill="#1e293b" rx="1" />
                                  <rect x="429" y="243" width="4" height="12" fill="#1e293b" rx="1" />

                                  <text x="417" y="235" fill={selectedMapSector==='musculacion'?'#E879F9':'#475569'} className="font-extrabold text-[7.5px] uppercase text-center" textAnchor="middle">🏋️ Musculación</text>
                                  
                                  {/* Indicator */}
                                  {(() => {
                                    const stats = getSectorStats('musculacion');
                                    return (
                                      <g>
                                        <circle cx="445" cy="227" r="5" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} className={stats.level==='sobrecargado'?'animate-pulse':''} />
                                        <circle cx="445" cy="227" r="3" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} />
                                      </g>
                                    );
                                  })()}
                                </g>

                                {/* ======================================= */}
                                {/* SECTOR 7: Playón Polideportivo (East Side Central) */}
                                {/* ======================================= */}
                                <g 
                                  onClick={() => setSelectedMapSector('playon')}
                                  className="cursor-pointer group"
                                >
                                  <rect x="355" y="122" width="105" height="73" rx="4" fill={selectedMapSector==='playon'?'#9A7B56':'#0f172a'} fillOpacity={selectedMapSector==='playon'?'0.3':'0.05'} stroke={selectedMapSector==='playon'?'#9A7B56':'#334155'} strokeWidth="1.5" />
                                  
                                  <text x="407" y="162" fill={selectedMapSector==='playon'?'#FDBA74':'#475569'} className="font-extrabold text-[8px] uppercase text-center" textAnchor="middle">🏀 Playón Deportivo</text>
                                  
                                  {/* Indicator */}
                                  {(() => {
                                    const stats = getSectorStats('playon');
                                    return (
                                      <g>
                                        <circle cx="445" cy="135" r="5" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} className={stats.level==='sobrecargado'?'animate-pulse':''} />
                                        <circle cx="445" cy="135" r="3" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} />
                                      </g>
                                    );
                                  })()}
                                </g>

                                {/* ======================================= */}
                                {/* SECTOR 8: Juegos Infantiles (South Center) */}
                                {/* ======================================= */}
                                <g 
                                  onClick={() => setSelectedMapSector('recreativo')}
                                  className="cursor-pointer group"
                                >
                                  <rect x="155" y="245" width="180" height="42" rx="4" fill={selectedMapSector==='recreativo'?'#4EA8DE':'#0f172a'} fillOpacity={selectedMapSector==='recreativo'?'0.3':'0.05'} stroke={selectedMapSector==='recreativo'?'#4EA8DE':'#334155'} strokeWidth="1.5" />
                                  
                                  <text x="245" y="270" fill={selectedMapSector==='recreativo'?'#38BDF8':'#475569'} className="font-extrabold text-[8px] uppercase text-center" textAnchor="middle">🪁 Juegos & Recreación</text>
                                  
                                  {/* Indicator */}
                                  {(() => {
                                    const stats = getSectorStats('recreativo');
                                    return (
                                      <g>
                                        <circle cx="320" cy="255" r="5" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} className={stats.level==='sobrecargado'?'animate-pulse':''} />
                                        <circle cx="320" cy="255" r="3" fill={stats.level==='sobrecargado'?'#EF4444':stats.level==='alto'?'#F59E0B':'#10B981'} />
                                      </g>
                                    );
                                  })()}
                                </g>

                              </svg>

                              {/* Hover hint */}
                              <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-[8px] font-bold tracking-wider text-slate-300 pointer-events-none uppercase">
                                💡 Haga Clic en un sector para auditar métricas
                              </div>
                            </div>

                            {/* Key list */}
                            <div className="flex flex-wrap justify-between items-center mt-3 border-t border-slate-800 pt-3 gap-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Estado de Sectores:</span>
                              <div className="flex space-x-3.5 text-[9px] font-extrabold uppercase text-slate-300">
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Despejado</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span> Moderado</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse"></span> Sobrecargado</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Detailed Sector Audit Panel */}
                          <div className="lg:col-span-5 bg-slate-950 rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
                            <div className="space-y-4">
                              {/* Sector title */}
                              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{activeSectorMeta.emoji}</span>
                                    <h4 className="font-extrabold text-sm text-slate-100 uppercase tracking-wide">{activeSectorMeta.name}</h4>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">{activeSectorMeta.desc}</p>
                                </div>
                                <span className="p-1 px-1.5 bg-slate-800 rounded font-code text-[8px] font-mono text-emerald-400 border border-slate-750">MONITOR</span>
                              </div>

                              {/* Capacity Metrics */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg leading-tight">
                                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wide block">Concurrencia Estimada</span>
                                  <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-xl font-extrabold text-slate-150">{activeSectorStats.count}</span>
                                    <span className="text-xs text-slate-500 font-medium">personas</span>
                                  </div>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg leading-tight">
                                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wide block">Nivel de Ocupación</span>
                                  <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-xl font-extrabold text-orange-400">{activeSectorStats.occupancyPct}%</span>
                                    <span className="text-[9px] text-slate-500 font-bold">Cap. {activeSectorStats.cap}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                                  <span>Estado: <strong className="text-slate-100 font-extrabold uppercase">{activeSectorStats.statusText}</strong></span>
                                  <span>{activeSectorStats.count} / {activeSectorStats.cap} personas</span>
                                </div>
                                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      activeSectorStats.level === 'sobrecargado' ? 'bg-red-500' :
                                      activeSectorStats.level === 'alto' ? 'bg-amber-500' :
                                      'bg-emerald-500'
                                    }`}
                                    style={{ width: `${activeSectorStats.occupancyPct}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Demographics */}
                              <div className="space-y-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                <h5 className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 border-b border-slate-800 pb-1.5 flex justify-between items-center">
                                  <span>Rango Etario del Sector</span>
                                  <span className="text-[8px] font-mono text-slate-505">Live Demographics</span>
                                </h5>

                                <div className="space-y-2.5">
                                  {/* Children */}
                                  <div className="text-[10px]">
                                    <div className="flex justify-between font-bold text-slate-300 mb-1">
                                      <span>🪁 Niños (0-12)</span>
                                      <span>{activeSectorStats.breakdown.children} pers. ({activeSectorStats.percents.children}%)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${activeSectorStats.percents.children}%`, backgroundColor: '#38bdf8' }}></div>
                                    </div>
                                  </div>

                                  {/* Teens */}
                                  <div className="text-[10px]">
                                    <div className="flex justify-between font-bold text-slate-300 mb-1">
                                      <span>🎒 Adolescentes (13-17)</span>
                                      <span>{activeSectorStats.breakdown.teens} pers. ({activeSectorStats.percents.teens}%)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${activeSectorStats.percents.teens}%`, backgroundColor: '#c084fc' }}></div>
                                    </div>
                                  </div>

                                  {/* Youth */}
                                  <div className="text-[10px]">
                                    <div className="flex justify-between font-bold text-slate-300 mb-1">
                                      <span>⚡ Jóvenes (18-25)</span>
                                      <span>{activeSectorStats.breakdown.youth} pers. ({activeSectorStats.percents.youth}%)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${activeSectorStats.percents.youth}%`, backgroundColor: '#34d399' }}></div>
                                    </div>
                                  </div>

                                  {/* Adults */}
                                  <div className="text-[10px]">
                                    <div className="flex justify-between font-bold text-slate-300 mb-1">
                                      <span>💼 Adultos (26-50)</span>
                                      <span>{activeSectorStats.breakdown.adults} pers. ({activeSectorStats.percents.adults}%)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${activeSectorStats.percents.adults}%`, backgroundColor: '#f97316' }}></div>
                                    </div>
                                  </div>

                                  {/* Seniors */}
                                  <div className="text-[10px]">
                                    <div className="flex justify-between font-bold text-slate-300 mb-1">
                                      <span>🧉 Adultos Mayores (51+)</span>
                                      <span>{activeSectorStats.breakdown.seniors} pers. ({activeSectorStats.percents.seniors}%)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${activeSectorStats.percents.seniors}%`, backgroundColor: '#f1c40f' }}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Recommendation box */}
                            <div className="p-3 bg-slate-900 border border-slate-800 text-[10px] rounded-lg mt-3 text-emerald-400 leading-relaxed font-semibold">
                              <p className="font-extrabold text-slate-400 uppercase tracking-wider text-[8px] mb-1">💡 Acción Operativa Sugerida:</p>
                              <p className="italic text-slate-300">{activeSectorStats.actions}</p>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })()}

                  {/* ======================================================== */}
                  {/* BERDUC BRAIN COPILOT DE INTELIGENCIA DE GESTIÓN */}
                  {/* ======================================================== */}
                  {activeTab === 'copilot' && (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-xl space-y-6">
                    <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                      <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30 text-purple-400">
                        <Sparkles className="h-6 w-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold tracking-wide uppercase text-slate-100 flex items-center gap-2">
                          <span>Berduc Brain Copilot</span>
                          <span className="text-[9px] font-mono bg-purple-500/20 border border-purple-500/30 text-purple-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider">AI AGENT</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">Pregúntale a nuestra IA integrada sobre el aforo de canchas, reportes de turnos, derivación de deportistas, eventos o profesores.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Chat history window */}
                      <div className="lg:col-span-8 flex flex-col justify-between bg-slate-950 rounded-xl border border-slate-800 p-4 h-[420px]">
                        <div className="space-y-4 overflow-y-auto flex-1 pr-2 max-h-[340px]">
                          {copilotMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`rounded-xl px-4 py-2.5 max-w-[85%] text-xs leading-relaxed ${
                                  msg.role === 'user'
                                    ? 'bg-emerald-600 text-white font-medium'
                                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                                }`}
                              >
                                <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest mb-1">
                                  {msg.role === 'user' ? '👤 Administrador Berduc' : '🤖 Berduc Brain'}
                                </span>
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                              </div>
                            </div>
                          ))}

                          {isCopilotPending && (
                            <div className="flex justify-start">
                              <div className="rounded-xl px-4 py-3 bg-slate-900 border border-slate-800 text-xs text-slate-350 max-w-[85%] animate-pulse flex items-center space-x-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span>Berduc Brain está analizando las métricas y sincronizando datos...</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Input form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendCopilotQuery();
                          }}
                          className="flex items-center space-x-2 border-t border-slate-800 pt-3 mt-3"
                        >
                          <input
                            type="text"
                            value={copilotInput}
                            onChange={(e) => setCopilotInput(e.target.value)}
                            placeholder="Ej: ¿Qué sector tiene mayor aforo hoy y qué me recomiendas?"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 flex-1 focus:outline-none focus:border-emerald-500"
                            disabled={isCopilotPending}
                          />
                          <button
                            type="submit"
                            disabled={isCopilotPending || !copilotInput.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg border-none transition cursor-pointer disabled:opacity-50"
                          >
                            Enviar
                          </button>
                        </form>
                      </div>

                      {/* Right: Suggestion Prompts / Instant Actions */}
                      <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex-1">
                          <h5 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2.5 flex items-center space-x-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                            <span>Acciones de Inteligencia Rápida</span>
                          </h5>
                          <p className="text-[10px] text-slate-450 mb-3 block">Haz clic para generar reportes automatizados de aforo y contingencias del parque berduc:</p>
                          
                          <div className="space-y-2">
                            {[
                              { label: "📊 Reporte Operacional de Aforo", query: "¿Podés darme un reporte detallado del estado de aforo en cada sector según la simulación actual y decirme si hay sobrecarga?" },
                              { label: "🚨 Plan de Contingencia para Sectores Saturados", query: "Recomendáme acciones de derivación operativa y de seguridad por si algún sector tiene flujo alto de personas hoy." },
                              { label: "📋 Profesores y Asignación Deportiva", query: "¿Cuáles son los profesores de atletismo, natación y fútbol y qué disciplinas atienden en el parque?" },
                              { label: "🏆 Torneos en Curso y Eventos", query: "Brindame un resumen de los torneos que están programados, finalizados y en curso en el complejo deportivo Berduc de Paraná." }
                            ].map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleSendCopilotQuery(preset.query)}
                                className="w-full text-left bg-slate-900 hover:bg-slate-850 p-2 text-[10px] rounded-lg border border-slate-850 hover:border-slate-750 text-slate-300 font-medium transition cursor-pointer block truncate"
                                disabled={isCopilotPending}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-[9px] text-slate-400 leading-relaxed font-semibold block">
                          <p className="font-extrabold text-slate-300 uppercase tracking-wider text-[8px] mb-1">💡 Notas del Motor AI:</p>
                          <p className="italic text-slate-300">El modelo de lenguaje procesa las estadísticas en tiempo real y ofrece recomendaciones de aforo basadas en directivas del Parque.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* ======================================================== */}
                  {/* DETALLE INDIVIDUAL DE LOS DEPORTES */}
                  {/* ======================================================== */}
                  {['atletismo', 'futbol', 'natacion', 'padel', 'voley', 'musculacion', 'playon', 'recreativo'].includes(activeTab) && (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-xl space-y-6">
                      <div className="border-b border-slate-805 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-mono bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Ficha de Deporte Oficial</span>
                          <h4 className="text-lg font-black tracking-wide uppercase text-slate-100 flex items-center gap-2 mt-1">
                            {activeTab === 'atletismo' && '🏃 PISTA DE ATLETISMO (E01)'}
                            {activeTab === 'futbol' && '⚽ CAMPO DE FÚTBOL & RUGBY (E02)'}
                            {activeTab === 'natacion' && '🏊 PILETA OLÍMPICA CLIMATIZADA (E03)'}
                            {activeTab === 'padel' && '🎾 CANCHAS DE PÁDEL VIDRIADAS (E04)'}
                            {activeTab === 'voley' && '🏐 GIMNASIO TECHADO / POLIDEPORTIVO (E05)'}
                            {activeTab === 'musculacion' && '🏋️ SALA DE MUSCULACIÓN & WELLNESS (E06)'}
                            {activeTab === 'playon' && '🏀 PLAYÓN MULTIDEPORTIVO ABIERTO (E07)'}
                            {activeTab === 'recreativo' && '🪁 ESPACIO DE JUEGOS Y RECREACIÓN (E08)'}
                          </h4>
                          <p className="text-xs text-slate-400">Detalles edilicios, inventario de recursos, estadísticas de aforo predictivo y personal docente a cargo.</p>
                        </div>
                        <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/60 text-right shrink-0">
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">Complejo Deportivo</span>
                          <span className="text-xs text-emerald-400 font-extrabold">Enrique Berduc</span>
                        </div>
                      </div>

                      {(() => {
                        // Lookup static sports configuration parameters
                        const config: { [key: string]: {
                          capMax: number;
                          infra: string;
                          materials: string;
                          main: string;
                          maintenanceReq: string;
                          profesores: Array<{nombre: string; cat: string; contacto: string}>;
                          torneos: Array<any>;
                        }} = {
                          atletismo: {
                            capMax: 80,
                            infra: "Pista reglamentaria de 6 carriles con suelo sintético amortiguante, fosa de arena para salto en largo y triple, jaula de lanzamiento de disco, rampa de saltos, y pista interna de calentamientos.",
                            materials: "Cronómetros portátiles, vallas metálicas regulables IAAF, testimonio para relevos, varilla de salto, balas de acero y jabalinas profesionales.",
                            main: "Pista de atletismo e infraestructura de saltos.",
                            maintenanceReq: "Barrer semanalmente suciedad de hojas, nivelar arena del foso post-entrenamientos, y relevamiento trimestral de líneas de andarivel.",
                            profesores: [
                              { nombre: "Carlos 'Charly' Álvarez", cat: "Elite y Lanzamientos", contacto: "+54 343 154-889911" },
                              { nombre: "Marta Rodríguez", cat: "Velocidad y Saltos", contacto: "+54 343 154-889912" }
                            ],
                            torneos: torneos.filter(t => t.deporte === 'atletismo')
                          },
                          futbol: {
                            capMax: 55,
                            infra: "Campo de juego reglamentario con césped natural, drenaje de arena subsuperficial, arcos olímpicos metálicos con redes protectoras y gradas perimetrales de ladrillo terracota.",
                            materials: "Balones N° 5 de cuero, conos de desvío, silbato Fox 40, banderines reglamentarios flexibles, chalecos fluorescentes.",
                            main: "Cancha central de fútbol.",
                            maintenanceReq: "Riego programado automatico interdiario, control de malezas bimensual y repintado de demarcación con cal blanca pre-competición.",
                            profesores: [
                              { nombre: "Mariano Galarza", cat: "Primera y Juveniles M18", contacto: "+54 343 154-223344" }
                            ],
                            torneos: torneos.filter(t => t.deporte === 'futbol')
                          },
                          natacion: {
                            capMax: 40,
                            infra: "Vaso olímpico climatizado de 50 x 25 m, 8 andariveles flotantes anti-sacudidas, sistema automático de filtración e iluminación subacuática para guardavidas.",
                            materials: "Tablas flotadoras, pullbuoys de entrenamiento, andariveles tensados bicolor, boyas salvavidas y botiquín de primeros auxilios completo.",
                            main: "Pileta olímpica climatizada.",
                            maintenanceReq: "Revisar cloroy pH diariamente de manera manual y automatizada, cepillar bordes anti-sarro y retro-lavado de filtros semanales de alta potencia.",
                            profesores: [
                              { nombre: "Flavia Siede", cat: "Natación Infantil y Adultos", contacto: "+54 343 154-334455" },
                              { nombre: "Ariel Albornoz", cat: "Federados y Competición", contacto: "+54 343 154-334456" }
                            ],
                            torneos: torneos.filter(t => t.deporte === 'natacion')
                          },
                          padel: {
                            capMax: 16,
                            infra: "2 canchas profesionales con cerramiento de vidrio templado de alta resistencia de 10mm, suelo de césped sintético azul de polietileno con arena de sílice uniforme.",
                            materials: "Pádel pelotas con presión oficial, paletas, tensores de red y red de polipropileno sin nudos homologada.",
                            main: "Dos canchas profesionales de pádel vidriadas.",
                            maintenanceReq: "Remoción and esparcido de arena de sílice cada 15 días, limpieza integral quincenal de los vidrios templados y ajuste de redes.",
                            profesores: [
                              { nombre: "Gustavo Brassesco", cat: "Clases Avanzadas e Iniciación", contacto: "+54 343 154-556677" }
                            ],
                            torneos: torneos.filter(t => t.deporte === 'padel')
                          },
                          voley: {
                            capMax: 60,
                            infra: "Estadio cubierto polideportivo con piso flotante de madera de guatambú laqueada, postes de red telescópicos y red de vóley certificada con varillas.",
                            materials: "Tablero electrónico, pelotas Mikasa para alta competencia, varillas reglamentarias tensadas y marcadores portátiles manuales.",
                            main: "Gimnasio cubierto con piso de parquet.",
                            maintenanceReq: "Mopa seca diaria para quitar la película de polvo resbaladizo, verificar tensión de red antes de partidos de elite y encerado semestral.",
                            profesores: [
                              { nombre: "Sofía Mildemberger", cat: "Mini Vóley y Maxivóley", contacto: "+54 343 154-445566" }
                            ],
                            torneos: torneos.filter(t => t.deporte === 'voley' || t.deporte === 'basquet' || t.deporte === 'handball')
                          },
                          musculacion: {
                            capMax: 25,
                            infra: "Sala cerrada con ventilación forzada y piso de goma amortiguante de alta densidad de 15mm para absorción acústica de carga de discos.",
                            materials: "Mancuernas de 2 a 40 kg, discos olímpicos, camillas de extensión, multipower reforzado, banco plano de fuerza e hidráulicos regulables.",
                            main: "Gimnasio de musculación y fuerza.",
                            maintenanceReq: "Desinfección de tapizados post-clases dos veces al día, lubricado de rieles con silicona líquida y control de poleas de acero tensoras.",
                            profesores: [
                              { nombre: "Daniela Martínez", cat: "Musculación y Fuerza Funcional", contacto: "+54 343 154-990011" }
                            ],
                            torneos: []
                          },
                          playon: {
                            capMax: 45,
                            infra: "Playón cementado continuo pintado en resina epoxídica antideslizante, arcos de balonmano fijos, jirafas telescópicas con tablero acrílico de básquet.",
                            materials: "Aros de básquet con red blanca, balones de básquet y handball reglamentarios, silbatos Fox y pecheras de división deportiva.",
                            main: "Playón multideportivo abierto.",
                            maintenanceReq: "Limpieza hidráulica semestral de polvillo de ciudad, pintado anual de líneas y control de fijación de rejas perimetrales protectoras del predio.",
                            profesores: [
                              { nombre: "Walter Galarza", cat: "Cadetes y Primera", contacto: "+54 343 154-778899" },
                              { nombre: "Esteban 'Bicho' Gómez", cat: "U15, U17 y Mayores", contacto: "+54 343 154-667788" }
                            ],
                            torneos: torneos.filter(t => t.deporte === 'basquet' || t.deporte === 'handball')
                          },
                          recreativo: {
                            capMax: 35,
                            infra: "Plaza de salud urbana y juegos infantiles con baldosas de caucho reciclado protectoras de impactos severos y pórtico de columpios inclusivos.",
                            materials: "Colchonetas delgadas aeróbicas, conos recreativos plásticos livianos, aros de PVC, sogas de salto y tizas de colores.",
                            main: "Espacio recreativo infantil de Paraná.",
                            maintenanceReq: "Control quincenal de desgaste de cadenas en columpios, inspección de astillas en toboganes y sanitización de áreas comunes.",
                            profesores: [],
                            torneos: []
                          }
                        };

                        const currentDeporteId = activeTab;
                        const currentTabDetails = config[currentDeporteId] || config.atletismo;

                        // Calcular métricas actuales por sector basados en la simulación activa
                        const activeTurnosDeporte = turnos.filter(t => t.deporte === currentDeporteId && !esTurnoVencido(t)).length;
                        const activeVisDeporte = visitantes.length;
                        
                        let tabWeight = 0.12;
                        if (simulationProfile === "normal") {
                          if (currentDeporteId === "atletismo") tabWeight = 0.22;
                          else if (currentDeporteId === "futbol") tabWeight = 0.20;
                          else if (currentDeporteId === "natacion") tabWeight = 0.14;
                          else if (currentDeporteId === "padel") tabWeight = 0.08;
                          else if (currentDeporteId === "voley") tabWeight = 0.14;
                          else if (currentDeporteId === "musculacion") tabWeight = 0.08;
                          else if (currentDeporteId === "playon") tabWeight = 0.08;
                          else if (currentDeporteId === "recreativo") tabWeight = 0.06;
                        } else if (simulationProfile === "alta_competencia") {
                          if (currentDeporteId === "atletismo") tabWeight = 0.30;
                          else if (currentDeporteId === "futbol") tabWeight = 0.25;
                          else if (currentDeporteId === "natacion") tabWeight = 0.15;
                          else if (currentDeporteId === "padel") tabWeight = 0.05;
                          else if (currentDeporteId === "voley") tabWeight = 0.15;
                          else if (currentDeporteId === "musculacion") tabWeight = 0.10;
                          else { tabWeight = 0.00; }
                        } else {
                          if (currentDeporteId === "atletismo") tabWeight = 0.08;
                          else if (currentDeporteId === "futbol") tabWeight = 0.10;
                          else if (currentDeporteId === "natacion") tabWeight = 0.22;
                          else if (currentDeporteId === "padel") tabWeight = 0.04;
                          else if (currentDeporteId === "voley") tabWeight = 0.04;
                          else if (currentDeporteId === "musculacion") tabWeight = 0.02;
                          else if (currentDeporteId === "playon") tabWeight = 0.20;
                          else if (currentDeporteId === "recreativo") tabWeight = 0.30;
                        }

                        const pool = activeVisDeporte + simulatedExtraPeople;
                        const genAssign = Math.round(pool * tabWeight);
                        const finalCount = Math.max(genAssign + (activeTurnosDeporte * 4), activeTurnosDeporte * 4);
                        const occupancyPct = Math.min(Math.round((finalCount / currentTabDetails.capMax) * 100), 100);

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-950 border border-slate-800 rounded-xl p-5">
                            {/* Col 1: Infra */}
                            <div className="space-y-4">
                              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl h-full flex flex-col justify-between">
                                <div>
                                  <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
                                    <MapPin className="h-4 w-4 text-emerald-400" />
                                    <span>Infraestructura Edilicia</span>
                                  </h5>
                                  <p className="text-xs text-slate-200 leading-relaxed">{currentTabDetails.infra}</p>
                                </div>
                              </div>
                            </div>

                            {/* Col 2: Materials & Maint */}
                            <div className="space-y-4">
                              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col h-full justify-between">
                                <div>
                                  <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
                                    <Award className="h-4 w-4 text-emerald-400" />
                                    <span>Equipamiento y Materiales</span>
                                  </h5>
                                  <p className="text-xs text-slate-200 leading-relaxed mb-3">{currentTabDetails.materials}</p>
                                </div>
                                <div className="border-t border-slate-800/80 pt-2 text-[10px] text-amber-400">
                                  <span className="font-bold flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> Mantenimiento:</span>
                                  <span className="text-[10px] text-slate-450 block mt-1">{currentTabDetails.maintenanceReq}</span>
                                </div>
                              </div>
                            </div>

                            {/* Col 3: Live Flow */}
                            <div className="space-y-4">
                              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between h-full">
                                <div>
                                  <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3 flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
                                    <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                                    <span>Aforo en Tiempo Real</span>
                                  </h5>
                                  <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Tránsito Estimado</span>
                                      <span className="text-lg font-black text-slate-100">{finalCount} <span className="text-[10px] font-normal text-slate-400">pers.</span></span>
                                    </div>
                                    <div>
                                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Ocupación</span>
                                      <span className="text-lg font-black text-orange-400">{occupancyPct}%</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-1 mt-auto">
                                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${occupancyPct}%` }}></div>
                                  </div>
                                  <span className="text-[8px] text-slate-400 block font-semibold text-right">Límite operativo: {currentTabDetails.capMax} personas</span>
                                </div>
                              </div>
                            </div>

                            {/* Col 4: Teachers & Tournaments */}
                            <div className="space-y-4">
                              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3 h-full font-sans">
                                <div>
                                  <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
                                    <Users className="h-4 w-4 text-emerald-400" />
                                    <span>Docentes Asignados</span>
                                  </h5>
                                  {currentTabDetails.profesores.length === 0 ? (
                                    <p className="text-[10px] text-slate-500 italic">No hay profesores fijos asignados.</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {currentTabDetails.profesores.map((prof, pIdx) => (
                                        <div key={pIdx} className="text-[10px]">
                                          <span className="font-extrabold text-slate-200 block truncate">{prof.nombre}</span>
                                          <div className="flex justify-between text-[8px] text-slate-400">
                                            <span>{prof.cat}</span>
                                            <span className="font-mono text-emerald-400">{prof.contacto}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="border-t border-slate-805 pt-2">
                                  <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center space-x-1.5">
                                    <Award className="h-4 w-4 text-emerald-400" />
                                    <span>Eventos y Calendario</span>
                                  </h5>
                                  {currentTabDetails.torneos.length === 0 ? (
                                    <p className="text-[10px] text-slate-500 italic">Sin torneos programados.</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {currentTabDetails.torneos.slice(0, 2).map((trn, idx) => (
                                        <div key={idx} className="text-[10px] flex justify-between items-center gap-1 bg-slate-950 p-1.5 rounded border border-slate-850">
                                          <span className="font-bold text-slate-300 truncate max-w-[100px]">{trn.nombre}</span>
                                          <span className={`text-[7px] font-bold p-0.5 rounded leading-none ${
                                            trn.estado === 'Finalizado' ? 'bg-slate-800 text-slate-400' :
                                            trn.estado === 'En Curso' ? 'bg-emerald-950 text-emerald-400' :
                                            'bg-blue-950 text-blue-400'
                                          }`}>{trn.estado}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* CUSTOM GRAPHICS GRID */}
                  {activeTab === 'berduc-brain' && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Turnos por deporte (Gráfico de barras simple) */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                      <h4 className="font-extrabold text-gray-950 text-xs uppercase tracking-wider text-gray-400 mb-4 flex items-center justify-between">
                        <span>Turnos Reservados por Deporte</span>
                        <span className="text-[10px] font-bold text-emerald-800">Demanda Real 2026</span>
                      </h4>
                      <div className="space-y-3 pt-2">
                        {SPORTS_DATA.map(sport => {
                          const count = turnosPorDeporteObj[sport.id] || 0;
                          const pct = totalTurnos > 0 ? (count / totalTurnos) * 100 : 0;
                          return (
                            <div key={sport.id} className="text-xs">
                              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                                <span className="capitalize">{sport.name}</span>
                                <div>
                                  <span className="text-gray-900 font-extrabold">{count}</span>
                                  <span className="text-[10px] text-gray-400 ml-1">({pct.toFixed(1)}%)</span>
                                </div>
                              </div>
                              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 bg-emerald-700"
                                  style={{ width: `${Math.max(pct, 3)}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Distribución por día de la semana y rango etario */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-gray-950 text-xs uppercase tracking-wider text-gray-400 mb-4">
                          Tránsito por Día de la Semana (Reservas)
                        </h4>
                        <div className="flex items-end justify-between h-40 pt-4 px-2">
                          {Object.entries(turnosDiaSemana).map(([dia, count]) => {
                            const maxVal = Math.max(...Object.values(turnosDiaSemana), 1);
                            const heightPct = (count / maxVal) * 80; // limitar a h-32
                            return (
                              <div key={dia} className="flex flex-col items-center flex-1 group">
                                <span className="text-[10px] font-bold text-gray-900 hidden group-hover:block transition duration-150 mb-1">{count}</span>
                                <div
                                  className="w-4.5 sm:w-6.5 rounded-t-md bg-orange-600 transition-all hover:bg-orange-700 hover:scale-105"
                                  style={{ height: `${Math.max(heightPct, 4)}px` }}
                                ></div>
                                <span className="text-[9px] font-bold text-gray-500 mt-2 rotate-12 sm:rotate-0">{dia.substring(0, 3)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4 mt-6">
                        <h5 className="font-bold text-xs text-gray-700 mb-3 uppercase tracking-wide">Rango Etario más Común de Visitantes</h5>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                          {Object.entries(rangosEtarios).map(([rango, count]) => (
                            <div key={rango} className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                              <span className="block text-[10px] text-gray-400 font-bold">{rango}</span>
                              <span className="block font-extrabold text-gray-950 mt-0.5">{count}</span>
                              <span className="block text-[8px] text-gray-400">personas</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                  </>
                  )}

            </div>
          </main>

          {/* ======================================================== */}
          {/* MODAL DETALLE DE DELEGACIÓN */}
          {selectedDelegacion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
              <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header del modal */}
                <div className="bg-emerald-800 p-5 text-white flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Dribbble className="h-6 w-6 text-emerald-300" />
                    <div>
                      <h3 className="font-bold text-base leading-tight">Detalle de Delegación Escolar o Deportiva</h3>
                      <p className="text-[11px] text-emerald-100 italic">ID: {selectedDelegacion.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDelegacion(null)}
                    className="rounded-full bg-black/10 p-1 text-white hover:bg-black/20"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body del modal */}
                <div className="p-6 overflow-y-auto max-h-[500px] text-xs text-gray-700 space-y-5">
                  
                  {/* Datos del responsable con foto */}
                  <div className="p-4 rounded-xl border border-gray-150 bg-gray-50 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div className="flex justify-center sm:col-span-1">
                      {selectedDelegacion.responsable.foto ? (
                        <img
                          src={selectedDelegacion.responsable.foto}
                          alt="Selfie Responsable"
                          referrerPolicy="no-referrer"
                          className="h-24 w-24 rounded-full object-cover border-2 border-emerald-600 shadow-sm"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gray-200 text-gray-500 font-bold flex items-center justify-center border text-xs">
                          Responsable
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-2 space-y-1.5 leading-tight">
                      <span className="text-[9px] uppercase font-bold text-gray-450 tracking-wider">Responsable del Grupo</span>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {selectedDelegacion.responsable.nombre} {selectedDelegacion.responsable.apellido}
                      </h4>
                      <p className="font-mono">DNI: {selectedDelegacion.responsable.dni}</p>
                      <p>Tel: {selectedDelegacion.responsable.telefono}</p>
                      <p>Email: {selectedDelegacion.responsable.email}</p>
                    </div>
                  </div>

                  {/* Datos de la delegación */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Nombre del Club o Escuela</span>
                      <p className="font-bold text-gray-950 text-sm">{selectedDelegacion.nombreEquipo}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Lugar de Origen</span>
                      <p className="font-bold text-gray-800 text-sm">{selectedDelegacion.origen}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Competencia / Actividad</span>
                      <p className="font-semibold text-gray-700">{selectedDelegacion.competencia}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Deportes a Practicar</span>
                      <p className="font-semibold text-gray-700 capitalize">{selectedDelegacion.deportes}</p>
                    </div>
                  </div>

                  {/* Lista de integrantes */}
                  <div className="border-t border-gray-100 pt-4">
                    <h5 className="font-bold text-xs text-gray-850 mb-3 flex items-center justify-between">
                      <span>Lista de Integrantes de Delegación</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold rounded px-2">
                        {selectedDelegacion.integrantes ? selectedDelegacion.integrantes.length : 0} personas
                      </span>
                    </h5>
                    
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 max-h-40 overflow-y-auto divide-y divide-gray-105">
                      {selectedDelegacion.integrantes && selectedDelegacion.integrantes.map((int, i) => (
                        <div key={i} className="flex justify-between items-center p-2.5">
                          <div>
                            <span className="font-bold text-gray-900">{int.nombre} {int.apellido}</span>
                            <span className="text-[10px] text-gray-400 ml-2">DNI {int.dni}</span>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                            int.tipo === 'Deportista' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-orange-50 text-orange-800 border border-orange-100'
                          }`}>
                            {int.tipo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL AGREGAR NUEVO TORNEO */}
          {showAddTorneo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
              <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="bg-emerald-800 p-4 text-white flex justify-between items-center">
                  <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                    <PlusCircle className="h-4.5 w-4.5" />
                    <span>Registrar Nuevo Evento o Torneo</span>
                  </h3>
                  <button onClick={() => setShowAddTorneo(false)} className="rounded-lg p-1 text-white/80 hover:text-white hover:bg-white/10 transition">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAgregarTorneoSubmit} className="p-6 text-xs space-y-4 max-h-[500px] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nombre del Torneo/Evento</label>
                      <input
                        type="text"
                        required
                        value={newTorneo.nombre}
                        onChange={(e) => setNewTorneo({ ...newTorneo, nombre: e.target.value })}
                        placeholder="Ej: Liga Departamental de Paraná Primera de Básquet"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Disciplina Deportiva</label>
                      <select
                        value={newTorneo.deporte}
                        onChange={(e) => setNewTorneo({ ...newTorneo, deporte: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.8 text-xs focus:border-emerald-500 focus:outline-none font-semibold text-gray-700"
                      >
                        {SPPORTS_SELECTOR_OPTIONS}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Categoría / Edad</label>
                      <input
                        type="text"
                        required
                        value={newTorneo.categoria}
                        onChange={(e) => setNewTorneo({ ...newTorneo, categoria: e.target.value })}
                        placeholder="Ej: U17 Mixto o Mayores Amateur"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Fecha de Inicio</label>
                      <input
                        type="date"
                        required
                        value={newTorneo.fechaInicio}
                        onChange={(e) => setNewTorneo({ ...newTorneo, fechaInicio: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none text-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Fecha de Finalización</label>
                      <input
                        type="date"
                        required
                        value={newTorneo.fechaFin}
                        onChange={(e) => setNewTorneo({ ...newTorneo, fechaFin: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none text-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Cant. Participantes (Aprox)</label>
                      <input
                        type="number"
                        required
                        value={newTorneo.participantes}
                        onChange={(e) => setNewTorneo({ ...newTorneo, participantes: Number(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Estado de Avance</label>
                      <select
                        value={newTorneo.estado}
                        onChange={(e) => setNewTorneo({ ...newTorneo, estado: e.target.value as any })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.8 text-xs focus:border-emerald-500 focus:outline-none font-semibold text-gray-700"
                      >
                        <option value="Programado">Programado</option>
                        <option value="En Curso">En Curso</option>
                        <option value="Finalizado">Finalizado</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Equipos / Clubs Participantes</label>
                      <textarea
                        value={newTorneo.equipos}
                        onChange={(e) => setNewTorneo({ ...newTorneo, equipos: e.target.value })}
                        placeholder="Ej: Club Talleres, Atlético Rowing, Escuela Berduc, Club Sionista"
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {newTorneo.estado === 'Finalizado' && (
                    <div className="border-t border-gray-100 pt-3 space-y-3">
                      <h4 className="font-extrabold text-[#E07A5F] text-[10px] uppercase tracking-wider">Podio / Resultados</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-450 uppercase mb-0.5">🏆 1º Puesto (Ganador)</label>
                          <input
                            type="text"
                            value={newTorneo.ganador}
                            onChange={(e) => setNewTorneo({ ...newTorneo, ganador: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 focus:border-emerald-500 focus:outline-none text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-450 uppercase mb-0.5">🥈 2º Puesto</label>
                          <input
                            type="text"
                            value={newTorneo.segundoPuesto}
                            onChange={(e) => setNewTorneo({ ...newTorneo, segundoPuesto: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 focus:border-emerald-500 focus:outline-none text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-450 uppercase mb-0.5">🥉 3º Puesto</label>
                          <input
                            type="text"
                            value={newTorneo.tercerPuesto}
                            onChange={(e) => setNewTorneo({ ...newTorneo, tercerPuesto: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 focus:border-emerald-500 focus:outline-none text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end gap-3.5">
                    <button
                      type="button"
                      onClick={() => setShowAddTorneo(false)}
                      className="rounded-lg bg-gray-105 hover:bg-gray-200 px-4 py-2 font-bold text-gray-700 text-xs transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-850 hover:bg-emerald-900 px-4 py-2 font-bold text-white text-xs transition cursor-pointer"
                    >
                      Registrar Torneo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Custom Confirmation Modal */}
          {confirmModal.isOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-50 rounded-full text-rose-600 shrink-0">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {confirmModal.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {confirmModal.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition duration-150 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    Confirmar Acción
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// Variables/Selectores comúnes para evitar duplicación
const SPPORTS_SELECTOR_OPTIONS = (
  <>
    <option value="atletismo">Pista de Atletismo</option>
    <option value="futbol">Campo Fútbol/Rugby</option>
    <option value="natacion">Pileta Natación</option>
    <option value="voley">Vóley (techado)</option>
    <option value="padel">Pádel profesional</option>
    <option value="basquet">Básquetbol</option>
    <option value="handball">Balonmano (Handball)</option>
    <option value="musculacion">Gimnasio Musculación</option>
    <option value="playon">Playón Polideportivo</option>
  </>
);

// Formateadores rápidos
function formatDateReadable(fechaString: string): string {
  if (!fechaString) return '';
  const [año, mes, dia] = fechaString.split('-').map(Number);
  const f = new Date(año, mes - 1, dia);
  const diasS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const mesesS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${diasS[f.getDay()]} ${dia} de ${mesesS[f.getMonth()]}, ${año}`;
}
