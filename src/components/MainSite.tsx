/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Flame,
  Trophy,
  Droplets,
  Sparkles,
  Activity,
  Target,
  Shield,
  Gauge,
  Layers,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Camera,
  Upload,
  Calendar,
  Clock,
  User,
  Users,
  Check,
  AlertCircle,
  ArrowLeft,
  Settings,
  Heart,
  Smile,
  Search,
  Trash2
} from 'lucide-react';
import { Turno, Visitante, Delegacion, IntegranteDelegacion, Profesor, ParqueEvento } from '../types';
import { SPORTS_DATA, SportInfo } from '../data';
// @ts-ignore
import mainHeroImage from '../assets/images/parque_berduc_principal_1781650307718.jpg';
// @ts-ignore
import parqueBerducArcoImage from '../assets/images/parque_berduc_arco_1781650502438.jpg';
import {
  cargarTurnos,
  agregarTurno,
  registrarVisitante,
  registrarDelegacion,
  cargarProfesores,
  calcularEdad,
  cargarEventos,
  cargarVisitantes,
  eliminarVisitante
} from '../database';
import { DniScanner } from './DniScanner';
import { QrModal } from './QrModal';

// Dataset de eventos del parque para el requerimiento de agenda en tiempo real
const EVENTS_DATA = [
  {
    id: 'evt-1',
    title: 'Torneo Relámpago Intercolegial de Básquet',
    category: 'Escolar',
    status: 'activo', // sucede en este momento
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
    status: 'activo', // sucede en este momento
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
    status: 'activo', // sucede en este momento
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
    status: 'proximo', // por realizarse
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
    status: 'proximo', // por realizarse
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
    status: 'proximo', // por realizarse
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
    status: 'proximo', // por realizarse
    sector: 'Suela de Césped del Campo Principal de Rugby',
    fecha: 'Martes 23 de Junio',
    horaInicio: '16:30 hs',
    duracion: '16:30 a 18:30 hs',
    description: 'Prácticas recreativas de rugby tag (sin contacto) destinadas a que los niños incorporen valores de camaradería y destreza.',
    icon: 'Trophy',
  },
];

// Función auxiliar para obtener el componente icono correcto de Lucide sin colisiones
const getEventIcon = (iconName: string) => {
  const emojiMap: { [key: string]: string } = {
    Flame: '🏃',      // Persona corriendo (Atletismo)
    Droplets: '🏊',   // Persona nadando (Natación)
    Target: '🏀',     // Pelota de Básquetbol (Básquet/Playón)
    Activity: '🎾',   // Pelota de Pádel/Tenis (Pádel)
    Trophy: '🏉',     // Pelota de Rugby (Rugby/Fútbol)
    Sparkles: '🏐',   // Pelota de Vóley (Vóley)
    Smile: '😊',      // Recreación / Salud
    Heart: '🏋️'       // Persona levantando pesas (Musculación)
  };
  const emoji = emojiMap[iconName] || '📅';
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 text-xs border border-emerald-100 shadow-3xs shrink-0" style={{ minWidth: '24px' }}>
      {emoji}
    </span>
  );
};

interface MainSiteProps {
  onGoToAdmin: () => void;
}

export function MainSite({ onGoToAdmin }: MainSiteProps) {
  // Estado del menú lateral hamburguesa
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Vista del sitio: 'home' o id del deporte seleccionado ('atletismo', 'futbol', etc.)
  const [activeView, setActiveView] = useState('home');

  // Filtro de la agenda de eventos
  const [eventFilter, setEventFilter] = useState<'todos' | 'activo' | 'proximo'>('todos');

  // Datos reactivos de base de datos
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [eventos, setEventos] = useState<ParqueEvento[]>([]);

  // Estados de reserva (Turnera)
  const [selectedSportId, setSelectedSportId] = useState<string>('atletismo');
  const [bookingDate, setBookingDate] = useState<string>(() => {
    // Siguiente lunes desde hoy para una prueba fácil, o el día de hoy
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 1); // Mañana por defecto
    return hoy.toISOString().split('T')[0];
  });
  const [selectedHourSlot, setSelectedHourSlot] = useState<string>('');
  
  // Modal de datos personales de reserva
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    nombreCompleto: '',
    dni: '',
    telefono: ''
  });

  // Estados de Registro Individual
  const [showIndividualRegister, setShowIndividualRegister] = useState(false);
  const [individualForm, setIndividualForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    domicilio: '',
    localidad: 'Paraná',
    provincia: 'Entre Ríos',
    telefono: '',
    email: '',
    genero: 'Masculino' as 'Masculino' | 'Femenino' | 'Otro',
    aceptaTerminos: false,
    sectorIngresoId: 'recreativo'
  });
  
  // Captura de Foto del Perfil
  const [photoMode, setPhotoMode] = useState<'upload' | 'camera' | 'captured'>('upload');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Escáner de DNI Digital
  const [showDniScanner, setShowDniScanner] = useState(false);

  // Pase QR generado resultante
  const [generatedVisitor, setGeneratedVisitor] = useState<Visitante | null>(null);

  // Estados del Panel de Usuario
  const [userPanelTab, setUserPanelTab] = useState<'login' | 'register'>('login');
  const [loginDni, setLoginDni] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userPanelDniSearch, setUserPanelDniSearch] = useState('');
  const [userPanelLoggedUser, setUserPanelLoggedUser] = useState<Visitante | null>(null);
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);
  const [userPanelForm, setUserPanelForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    domicilio: '',
    localidad: 'Paraná',
    provincia: 'Entre Ríos',
    telefono: '',
    email: '',
    genero: 'Masculino' as 'Masculino' | 'Femenino' | 'Otro',
    deporteFavorito: 'atletismo',
    deportesFavoritos: ['atletismo'] as string[],
    foto: '',
    contrasena: ''
  });
  const [userPanelMessage, setUserPanelMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estados de Registro Grupal / Delegaciones
  const [showGroupRegister, setShowGroupRegister] = useState(false);
  const [delegacionForm, setDelegacionForm] = useState({
    nombreEquipo: '',
    origen: 'Paraná, Entre Ríos',
    competencia: 'Torneo Amistoso Provincial',
    diasVisita: 2,
    deportes: 'Básquet y Vóley',
    deportePrincipal: 'basquet',
    aceptaTerminos: false
  });
  const [responsableForm, setResponsableForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: ''
  });
  
  // Foto del Responsable
  const [responsablePhoto, setResponsablePhoto] = useState<string>('');
  const [responsablePhotoMode, setResponsablePhotoMode] = useState<'upload' | 'camera' | 'captured'>('upload');

  // Integrantes dinámicos de delegación
  const [integrantes, setIntegrantes] = useState<IntegranteDelegacion[]>([]);
  const [nuevoIntegrante, setNuevoIntegrante] = useState<IntegranteDelegacion>({
    nombre: '',
    apellido: '',
    dni: '',
    tipo: 'Deportista'
  });

  // Cargar datos locales de entrada
  useEffect(() => {
    setTurnos(cargarTurnos());
    setProfesores(cargarProfesores());
    setEventos(cargarEventos());
    
    // Hash routing handler simple para soportar redirección de deportes y admin
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/deportes/')) {
        const sportSlug = hash.replace('#/deportes/', '');
        const validSport = SPORTS_DATA.find(s => s.slug === sportSlug);
        if (validSport) {
          setActiveView(validSport.id);
          // Hacer scroll al tope
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (hash === '#/') {
        setActiveView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Ejecutar al inicio
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      stopCamera();
    };
  }, []);

  // Recarga turnos cuando ocurra un cambio
  const refrescarTurnos = () => {
    setTurnos(cargarTurnos());
  };

  // ------------------- LOGICA TURNERA (RESERVAS) -------------------
  
  // Reglas de turnos por fecha y deporte
  const obtenerSlotsDisponiblesFormateados = (): { raw: string; readable: string }[] => {
    if (!bookingDate) return [];
    
    const fecha = new Date(bookingDate + 'T00:00:00');
    // Día de la semana (0: Domingo, 1: Lunes... 6: Sábado)
    const diaNum = fecha.getDay();
    
    const esPadel = selectedSportId === 'padel';

    // Domingos: cerrado general. Padel sí abre.
    if (diaNum === 0 && !esPadel) {
      return [];
    }

    const slots: { raw: string; readable: string }[] = [];

    if (esPadel) {
      // Pádel: Lunes a Viernes 14:00 a 00:00 (cada 1:30hs). Sábado y Domingo 8:00 a 00:00.
      const inicioHora = (diaNum === 0 || diaNum === 6) ? 8 : 14;
      const finHora = 24; // Hasta medianoche
      
      // Armamos la secuencia sumando 1.5 horas (90 minutos)
      let corrienteMins = inicioHora * 60;
      const finalMins = finHora * 60;

      while (corrienteMins < finalMins) {
        const hh = Math.floor(corrienteMins / 60);
        const mm = corrienteMins % 60;
        const hhStr = hh.toString().padStart(2, '0');
        const mmStr = mm.toString().padStart(2, '0');
        const horaRaw = `${hhStr}:${mmStr}`;
        
        // Formatear texto completo legible requerido: "Lunes 8 de Junio 15:30hs"
        const readableStr = getReadableDateTimeString(bookingDate, horaRaw);

        slots.push({ raw: horaRaw, readable: readableStr });
        corrienteMins += 90; // suma de 1:30hs
      }
    } else {
      // Deportes generales: Lunes a Viernes 14:00 a 22:00, Sábados 8:00 a 14:00. Domingos cerrado (visto arriba).
      const inicioHora = (diaNum === 6) ? 8 : 14;
      const finHora = (diaNum === 6) ? 14 : 22;

      for (let h = inicioHora; h < finHora; h++) {
        const horaRaw = `${h.toString().padStart(2, '0')}:00`;
        const readableStr = getReadableDateTimeString(bookingDate, horaRaw);
        slots.push({ raw: horaRaw, readable: readableStr });
      }
    }

    // REGLA CLAVE: "Si un horario ya está reservado, DEBE DESAPARECER del selector de horas. No debe mostrarse como opción."
    // Filtramos los slots comparando con turnos existentes para este DEPORTE en ese DÍA y HORA.
    return slots.filter(slot => {
      const yaReservado = turnos.some(
        t => t.deporte === selectedSportId && t.dia === bookingDate && t.hora === slot.raw
      );
      
      // Control adicional: evitar seleccionar horas pasadas si el día seleccionado es HOY
      const hoyString = new Date().toISOString().split('T')[0];
      if (bookingDate === hoyString) {
        const [hSlot, mSlot] = slot.raw.split(':').map(Number);
        const ahora = new Date();
        const horaLimite = ahora.getHours() * 60 + ahora.getMinutes();
        const slotMins = hSlot * 60 + mSlot;
        if (slotMins < horaLimite + 15) return false; // Bloquea si faltan menos de 15 minutos o ya pasó
      }

      return !yaReservado;
    });
  };

  const activeSlotsDisponibles = obtenerSlotsDisponiblesFormateados();

  const abrirModalReserva = () => {
    if (!userPanelLoggedUser) {
      setUserPanelMessage({ type: 'error', text: '⚠️ Es obligatorio iniciar sesión o registrarse con una contraseña personalizada para poder solicitar un turno.' });
      setUserPanelTab('login');
      setActiveView('user-panel');
      return;
    }
    setBookingForm({
      nombreCompleto: `${userPanelLoggedUser.nombre} ${userPanelLoggedUser.apellido}`,
      dni: userPanelLoggedUser.dni,
      telefono: userPanelLoggedUser.telefono || ''
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.nombreCompleto || !bookingForm.dni || !selectedHourSlot) return;

    // Buscar el string de nombre de cancha adaptativo
    const sportName = SPORTS_DATA.find(s => s.id === selectedSportId)?.name || 'Cancha general';

    // Duración por defecto
    const duracion = selectedSportId === 'padel' ? 1.5 : 1;

    // Registrar en LocalStorage
    agregarTurno({
      nombre: bookingForm.nombreCompleto,
      dni: bookingForm.dni,
      telefono: bookingForm.telefono,
      deporte: selectedSportId,
      canchaId: selectedSportId,
      cancha: sportName,
      dia: bookingDate,
      hora: selectedHourSlot,
      horas: duracion
    });

    refrescarTurnos();
    setShowBookingModal(false);
    
    alert(`¡Reserva confirmada con éxito!\nDeporte: ${sportName}\nDía: ${formatDateReadable(bookingDate)} a las ${selectedHourSlot}hs.\nSu horario fue reservado y ya no se mostrará como disponible.`);
    
    // Limpieza
    setBookingForm({ nombreCompleto: '', dni: '', telefono: '' });
    setSelectedHourSlot('');
  };

  // ------------------- LOGICA REGISTRO INDIVIDUAL -------------------

  // Escaneo exitoso de DNI
  const handleDniScanSuccess = (scanned: { dni: string; nombre: string; apellido: string; fechaNacimiento: string; genero?: any }) => {
    setIndividualForm(prev => ({
      ...prev,
      dni: scanned.dni,
      nombre: scanned.nombre || prev.nombre,
      apellido: scanned.apellido || prev.apellido,
      fechaNacimiento: scanned.fechaNacimiento || prev.fechaNacimiento,
      genero: scanned.genero || prev.genero
    }));
    setShowDniScanner(false);
    alert('DNI escaneado y decodificado exitosamente.');
  };

  // Iniciar cámara trasera/selfie para foto de perfil
  const startCamera = async (isResponsable = false) => {
    if (isResponsable) {
      setResponsablePhotoMode('camera');
    } else {
      setPhotoMode('camera');
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 320 },
        audio: false
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      console.error("Error al acceder a la cámara frontal", err);
      alert("No se pudo iniciar la cámara web. Intente cargando un archivo PNG/JPG.");
      if (isResponsable) {
        setResponsablePhotoMode('upload');
      } else {
        setPhotoMode('upload');
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const captureSnapshot = (isResponsable = false) => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 300;
        canvas.height = 300;
        // Dibujar espejo o directo
        context.drawImage(video, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        if (isResponsable) {
          setResponsablePhoto(dataUrl);
          setResponsablePhotoMode('captured');
        } else {
          setProfilePhotoUrl(dataUrl);
          setPhotoMode('captured');
        }
        
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isResponsable = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (isResponsable) {
        setResponsablePhoto(dataUrl);
        setResponsablePhotoMode('captured');
      } else {
        setProfilePhotoUrl(dataUrl);
        setPhotoMode('captured');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!individualForm.nombre || !individualForm.apellido || !individualForm.dni || !individualForm.aceptaTerminos) {
      alert("Por favor, complete todos los campos requeridos y acepte los términos de seguridad.");
      return;
    }

    // Guardar ingreso en base de datos local
    const visitanteGuardado = registrarVisitante({
      nombre: individualForm.nombre,
      apellido: individualForm.apellido,
      dni: individualForm.dni,
      fechaNacimiento: individualForm.fechaNacimiento,
      domicilio: individualForm.domicilio,
      localidad: individualForm.localidad,
      provincia: individualForm.provincia,
      telefono: individualForm.telefono,
      email: individualForm.email,
      genero: individualForm.genero,
      foto: profilePhotoUrl,
      sectorIngresoId: individualForm.sectorIngresoId,
      sectorIngresoName: individualForm.sectorIngresoId === 'recreativo' 
        ? 'Acceso Libre Recreativo' 
        : (SPORTS_DATA.find(s => s.id === individualForm.sectorIngresoId)?.name || individualForm.sectorIngresoId)
    });

    setGeneratedVisitor(visitanteGuardado);
    
    // Resetear formulario
    setIndividualForm({
      nombre: '',
      apellido: '',
      dni: '',
      fechaNacimiento: '',
      domicilio: '',
      localidad: 'Paraná',
      provincia: 'Entre Ríos',
      telefono: '',
      email: '',
      genero: 'Masculino',
      aceptaTerminos: false,
      sectorIngresoId: 'recreativo'
    });
    setProfilePhotoUrl('');
    setPhotoMode('upload');
    setShowIndividualRegister(false);
  };

  // ------------------- LOGICA PANEL DE USUARIO -------------------
  const handleUserPanelLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginDni.trim() || !loginPassword.trim()) {
      setUserPanelMessage({ type: 'error', text: 'Por favor completá tu DNI y tu contraseña personalizada.' });
      return;
    }

    const visitantes = cargarVisitantes();
    const cleanDni = loginDni.replace(/\D/g, '');
    const encontrado = visitantes.find(v => v.dni.replace(/\D/g, '') === cleanDni);

    if (encontrado) {
      if (encontrado.contrasena === loginPassword || (!encontrado.contrasena && loginPassword === '123456')) {
        setUserPanelLoggedUser(encontrado);
        setUserPanelForm({
          nombre: encontrado.nombre,
          apellido: encontrado.apellido,
          dni: encontrado.dni,
          fechaNacimiento: encontrado.fechaNacimiento,
          domicilio: encontrado.domicilio,
          localidad: encontrado.localidad,
          provincia: encontrado.provincia,
          telefono: encontrado.telefono,
          email: encontrado.email,
          genero: encontrado.genero,
          deporteFavorito: encontrado.deporteFavorito || 'atletismo',
          deportesFavoritos: encontrado.deportesFavoritos || (encontrado.deporteFavorito ? [encontrado.deporteFavorito] : ['atletismo']),
          foto: encontrado.foto || '',
          contrasena: encontrado.contrasena || '123456'
        });
        setUserPanelMessage({ type: 'success', text: `¡Bienvenido/a de nuevo, ${encontrado.nombre}! Iniciaste sesión con éxito.` });
      } else {
        setUserPanelMessage({ type: 'error', text: 'Contraseña incorrecta. Por favor verificala e intentá de nuevo.' });
      }
    } else {
      setUserPanelMessage({ type: 'error', text: 'No se encontró un usuario registrado con ese DNI. Si todavía no tenés cuenta, ¡hacé clic en la pestaña "Registrarse"!' });
    }
  };

  const handleUserPanelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPanelForm.nombre || !userPanelForm.apellido || !userPanelForm.dni || !userPanelForm.contrasena) {
      setUserPanelMessage({ type: 'error', text: 'Por favor completá los campos requeridos (*) para el registro.' });
      return;
    }

    const guardado = registrarVisitante({
      nombre: userPanelForm.nombre,
      apellido: userPanelForm.apellido,
      dni: userPanelForm.dni,
      fechaNacimiento: userPanelForm.fechaNacimiento,
      domicilio: userPanelForm.domicilio,
      localidad: userPanelForm.localidad,
      provincia: userPanelForm.provincia,
      telefono: userPanelForm.telefono,
      email: userPanelForm.email,
      genero: userPanelForm.genero,
      deporteFavorito: userPanelForm.deportesFavoritos?.[0] || userPanelForm.deporteFavorito || 'atletismo',
      deportesFavoritos: userPanelForm.deportesFavoritos || [userPanelForm.deporteFavorito || 'atletismo'],
      foto: userPanelForm.foto,
      contrasena: userPanelForm.contrasena
    });

    setUserPanelLoggedUser(guardado);
    setUserPanelMessage({ type: 'success', text: '¡Tus datos han sido registrados con éxito! Tu credencial oficial ha sido actualizada.' });
  };

  const handleEliminarMiCuenta = () => {
    setDeleteAccountConfirmOpen(true);
  };

  const confirmarEliminarMiCuenta = () => {
    if (!userPanelLoggedUser) return;
    eliminarVisitante(userPanelLoggedUser.id);
    setUserPanelLoggedUser(null);
    setUserPanelMessage({ type: 'success', text: 'Tu cuenta ha sido eliminada permanentemente del sistema de Parque Berduc.' });
    setLoginDni('');
    setLoginPassword('');
    setUserPanelForm({
      nombre: '',
      apellido: '',
      dni: '',
      fechaNacimiento: '',
      domicilio: '',
      localidad: 'Paraná',
      provincia: 'Entre Ríos',
      telefono: '',
      email: '',
      genero: 'Masculino',
      deporteFavorito: 'atletismo',
      foto: '',
      contrasena: ''
    });
    setDeleteAccountConfirmOpen(false);
  };

  const handleUserPanelPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setUserPanelForm(prev => ({ ...prev, foto: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // ------------------- LOGICA REGISTRO GRUPAL / DELEGACIONES -------------------

  const handleAgregarIntegrante = () => {
    if (!nuevoIntegrante.nombre || !nuevoIntegrante.apellido || !nuevoIntegrante.dni) {
      alert("Complete nombre, apellido y DNI del deportista.");
      return;
    }
    setIntegrantes(prev => [...prev, nuevoIntegrante]);
    setNuevoIntegrante({ nombre: '', apellido: '', dni: '', tipo: 'Deportista' });
  };

  const handleRemoverIntegrante = (idx: number) => {
    setIntegrantes(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegacionForm.nombreEquipo || !responsableForm.nombre || !responsableForm.dni || !delegacionForm.aceptaTerminos) {
      alert("Por favor complete los datos obligatorios de la delegación y de su responsable.");
      return;
    }
    if (integrantes.length === 0) {
      alert("Debe agregar al menos un integrante deportista o acompañante al contingente.");
      return;
    }

    // Registrar en localStorage
    registrarDelegacion({
      nombreEquipo: delegacionForm.nombreEquipo,
      origen: delegacionForm.origen,
      competencia: delegacionForm.competencia,
      diasVisita: Number(delegacionForm.diasVisita) || 1,
      deportes: delegacionForm.deportes,
      deportePrincipal: delegacionForm.deportePrincipal,
      responsable: {
        nombre: responsableForm.nombre,
        apellido: responsableForm.apellido,
        dni: responsableForm.dni,
        telefono: responsableForm.telefono,
        email: responsableForm.email,
        foto: responsablePhoto
      },
      integrantes: integrantes
    });

    alert(`¡Delegación "${delegacionForm.nombreEquipo}" registrada con éxito!\nCódigo de Contingente generado. El panel administrativo ya puede visualizar los datos y fotos del responsable.`);
    
    // Resetear
    setDelegacionForm({
      nombreEquipo: '',
      origen: 'Paraná, Entre Ríos',
      competencia: 'Torneo Amistoso Provincial',
      diasVisita: 2,
      deportes: 'Básquet y Vóley',
      deportePrincipal: 'basquet',
      aceptaTerminos: false
    });
    setResponsableForm({ nombre: '', apellido: '', dni: '', telefono: '', email: '' });
    setIntegrantes([]);
    setResponsablePhoto('');
    setResponsablePhotoMode('upload');
    setShowGroupRegister(false);
  };

  // Al hacer clic en un enlace del menu lateral, scrollea al id o cambia pestaña y cierra sidebar
  const handleNavClick = (sectionId: string) => {
    setIsSidebarOpen(false);
    setActiveView('home');
    
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="bg-[#f6f9fc] min-h-screen lg:h-screen lg:overflow-hidden relative font-sans text-slate-850 flex flex-col lg:flex-row">
      
      {/* ==================== PANEL NAVIGATION LATERAL IZQUIERDO (Sleek Interface) ==================== */}
      <nav className="w-64 bg-white border-r border-slate-200 flex-col shadow-sm hidden lg:flex justify-between shrink-0 h-full">
        <div className="flex flex-col flex-1">
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
            <div className="w-8 h-8 bg-[#2C5F2D] rounded-lg flex items-center justify-center text-white text-base font-extrabold shadow-sm">•</div>
            <span className="font-bold text-[#2C5F2D] tracking-tight text-lg">Berduc Sport</span>
          </div>
          <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            <button
              onClick={() => { setActiveView('home'); window.location.hash = '#/'; }}
              className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition duration-150 cursor-pointer ${
                activeView === 'home'
                  ? 'bg-[#2C5F2D] text-white font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#2C5F2D]'
              }`}
            >
              <Smile className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Inicio</span>
            </button>
            <button
              onClick={() => { setActiveView('user-panel'); }}
              className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition duration-150 cursor-pointer ${
                activeView === 'user-panel'
                  ? 'bg-[#2C5F2D] text-white font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#2C5F2D]'
              }`}
            >
              <User className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Mi Panel de Usuario</span>
            </button>
            <button
              onClick={() => handleNavClick('espacios')}
              className="w-full p-3 text-slate-500 hover:bg-slate-50 hover:text-[#2C5F2D] rounded-xl flex items-center gap-3 text-left transition duration-150 cursor-pointer text-sm font-medium"
            >
              <Activity className="h-4 w-4 shrink-0" />
              <span>Espacios Deportivos</span>
            </button>
            <button
              onClick={() => handleNavClick('turneras')}
              className="w-full p-3 text-slate-500 hover:bg-slate-50 hover:text-[#2C5F2D] rounded-xl flex items-center gap-3 text-left transition duration-150 cursor-pointer text-sm font-medium"
            >
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Turneras de Reserva</span>
            </button>
            <button
              onClick={() => handleNavClick('registros')}
              className="w-full p-3 text-slate-500 hover:bg-slate-50 hover:text-[#2C5F2D] rounded-xl flex items-center gap-3 text-left transition duration-150 cursor-pointer text-sm font-medium"
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Registros de Ingreso</span>
            </button>
            <button
              onClick={() => handleNavClick('eventos')}
              className="w-full p-3 text-slate-500 hover:bg-slate-50 hover:text-[#2C5F2D] rounded-xl flex items-center gap-3 text-left transition duration-150 cursor-pointer text-sm font-medium"
            >
              <Calendar className="h-4 w-4 shrink-0 text-[#2C5F2D]" />
              <span>Eventos del Parque</span>
            </button>
            <button
              onClick={() => handleNavClick('contacto')}
              className="w-full p-3 text-slate-500 hover:bg-slate-50 hover:text-[#2C5F2D] rounded-xl flex items-center gap-3 text-left transition duration-150 cursor-pointer text-sm font-medium"
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <span>Contacto y Líneas</span>
            </button>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="text-center text-[10px] text-slate-400 font-bold leading-tight mb-2 uppercase tracking-wide">
            <p>Parque Enrique Berduc</p>
            <p className="opacity-70 mt-0.5">Paraná, Entre Ríos</p>
          </div>
          <button
            onClick={onGoToAdmin}
            className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Panel Administrativo</span>
          </button>
        </div>
      </nav>

      {/* CONTENEDOR CENTRAL DE TRABAJO (Sleek Interface) */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-[#f6f9fc]">
        
        {/* HEADER CENTRAL */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-3xs">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden rounded-lg p-2 hover:bg-slate-100 transition text-[#2C5F2D] cursor-pointer"
            id="hamburger-menu-btn"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden lg:block w-10"></div>

          <h1
            onClick={() => { setActiveView('home'); window.location.hash = '#/'; }}
            className="text-base md:text-lg lg:text-xl font-extrabold text-[#2C5F2D] uppercase tracking-[0.2em] font-sans hover:opacity-85 transition cursor-pointer select-none text-center flex-1"
            id="main-app-header-title"
          >
            Parque Enrique Berduc
          </h1>

          <div className="flex items-center gap-3">
            <div className="text-[10px] text-slate-405 font-bold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded hidden sm:block">
              Paraná, Entre Ríos
            </div>
            <button
              onClick={onGoToAdmin}
              className="lg:hidden rounded-xl bg-[#2C5F2D] hover:bg-[#224b23] text-white p-2.5 text-xs font-bold transition cursor-pointer flex items-center justify-center shadow-sm"
              id="admin-access-btn"
              title="Panel Admin"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CONTENIDO INTERNO DESPLAZABLE */}
        <div id="middle-scrollable-content" className="flex-1 overflow-y-auto">


      {/* 2. MENÚ LATERAL DESPLEGABLE (Hamburguesa) desde Izquierda */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          ></div>

          {/* Menú */}
          <div className="relative w-72 max-w-sm bg-zinc-950 text-gray-200 flex flex-col p-6 shadow-2xl z-10 transition duration-300">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
              <div className="leading-tight">
                <span className="text-[10px] uppercase font-mono font-bold text-[#E07A5F] tracking-widest">Establecido 1929</span>
                <h4 className="font-extrabold text-white text-base">Parque Berduc</h4>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-900 text-gray-400 transition"
              >
                <X className="h-5.5 w-5.5" />
              </button>
            </div>

            <nav className="flex-1 space-y-2 text-sm font-semibold">
              <button
                onClick={() => { setIsSidebarOpen(false); setActiveView('home'); window.location.hash = '#/'; }}
                className="w-full text-left rounded-xl px-4 py-3 hover:bg-zinc-900 transition flex items-center space-x-3 text-white"
              >
                <Smile className="h-4 w-4 text-[#5FA8D3]" />
                <span>Inicio</span>
              </button>

              <button
                onClick={() => { setIsSidebarOpen(false); setActiveView('user-panel'); }}
                className="w-full text-left rounded-xl px-4 py-3 hover:bg-zinc-900 transition flex items-center space-x-3 text-white"
              >
                <User className="h-4 w-4 text-[#5FA8D3]" />
                <span>Mi Panel de Usuario</span>
              </button>
              
              <button
                onClick={() => handleNavClick('espacios')}
                className="w-full text-left rounded-xl px-4 py-3 hover:bg-zinc-900 transition flex items-center space-x-3 text-white"
              >
                <Activity className="h-4 w-4 text-[#5FA8D3]" />
                <span>Espacios Deportivos</span>
              </button>

              <button
                onClick={() => handleNavClick('turneras')}
                className="w-full text-left rounded-xl px-4 py-3 hover:bg-zinc-900 transition flex items-center space-x-3 text-white"
              >
                <Calendar className="h-4 w-4 text-[#5FA8D3]" />
                <span>Turneras de Reserva</span>
              </button>

              <button
                onClick={() => handleNavClick('registros')}
                className="w-full text-left rounded-xl px-4 py-3 hover:bg-zinc-900 transition flex items-center space-x-3 text-white"
              >
                <Users className="h-4 w-4 text-[#5FA8D3]" />
                <span>Registros de Ingreso</span>
              </button>

              <button
                onClick={() => handleNavClick('eventos')}
                className="w-full text-left rounded-xl px-4 py-3 hover:bg-zinc-900 transition flex items-center space-x-3 text-white"
              >
                <Calendar className="h-4 w-4 text-[#5FA8D3]" />
                <span>Eventos del Parque</span>
              </button>

              <button
                onClick={() => handleNavClick('contacto')}
                className="w-full text-left rounded-xl px-4 py-3 hover:bg-zinc-900 transition flex items-center space-x-3 text-white"
              >
                <MapPin className="h-4 w-4 text-[#5FA8D3]" />
                <span>Contacto y Líneas</span>
              </button>
            </nav>

            <div className="border-t border-zinc-900 pt-4 mt-6 text-center text-[10px] text-zinc-500 font-semibold leading-tight">
              <p>Parque Escolar Deportivo Enrique Berduc</p>
              <p className="mt-1">Paraná, Entre Ríos, Argentina</p>
            </div>
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* VISTA HOME PRINCIPAL */}
      {activeView === 'home' ? (
        <div className="flex-1">
          
          {/* 3. HERO (Imagen de fondo del Arco con overlay optimizado y alineación perfecta) */}
          <section
            id="inicio"
            className="relative bg-zinc-950 text-white min-h-[460px] md:min-h-[540px] flex items-center justify-center text-center px-4 py-16 md:py-24 overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.75)), url(${parqueBerducArcoImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 35%',
            }}
          >
            {/* Efecto de degradado de arriba a abajo y resplandor verde sutil estilo bosque */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#2C5F2D]/20 via-transparent to-zinc-950/40 pointer-events-none"></div>
            
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 relative z-10 drop-shadow-lg">
              <span className="inline-block bg-[#E07A5F] text-white text-[10px] md:text-xs font-black tracking-widest uppercase rounded px-3 py-1 animate-pulse">
                Semillero de Atletas Olímpicos
              </span>
              
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight px-2 drop-shadow-md">
                Un legado deportivo para toda la comunidad
              </h2>
              
              <p className="text-gray-100 text-sm md:text-lg leading-relaxed font-normal max-w-3xl mx-auto px-4 md:px-8 drop-shadow-sm">
                Fundado en 1929 en Paraná. Cuna de figuras legendarias, ofreciendo atletismo de rendimiento, pileta olímpica climatizada, pádel vidriado de primer nivel, gimnasio cerrado polideportivo y playón multideportivo abierto de acceso libre y totalmente gratuito.
              </p>
              
              <div className="pt-2">
                <span className="inline-block text-[#5FA8D3] text-xs md:text-sm font-mono font-bold tracking-wider px-4 py-2 border border-[#5FA8D3]/40 rounded-full bg-zinc-950/75 backdrop-blur-md shadow-lg">
                  ★ ATLETISMO • FÚTBOL • RUGBY • NATACIÓN • VÓLEY • PÁDEL • BÁSQUET • HANDBALL • MUSCULACIÓN ★
                </span>
              </div>
            </div>
          </section>


          {/* 4. ESPACIOS DEPORTIVOS (Grid de cards clickeables) */}
          <section id="espacios" className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <span className="text-xs uppercase font-extrabold text-[#E07A5F] tracking-widest">Nuestras Instalaciones</span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-[#2C5F2D] mt-2 border-none">
                Espacios Deportivos Homologados
              </h3>
              <p className="text-gray-500 text-xs mt-1.5 max-w-xl mx-auto leading-relaxed">
                Haga clic sobre cualquiera de las disciplinas para explorar sus profesores a cargo, horarios por categorías y glorias locales.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SPORTS_DATA.map((sport) => {
                const sportEmojis: { [key: string]: string } = {
                  atletismo: '🏃',
                  futbol: '⚽',
                  natacion: '🏊',
                  voley: '🏐',
                  padel: '🎾',
                  basquet: '🏀',
                  handball: '🤾',
                  musculacion: '🏋️',
                  playon: '🛹'
                };
                const emoji = sportEmojis[sport.id] || '🏟️';

                return (
                  <div
                    key={sport.id}
                    onClick={() => {
                      // Redirige al deporte
                      setActiveView(sport.id);
                      window.location.hash = `#/deportes/${sport.slug}`;
                      const scrollEl = document.getElementById('middle-scrollable-content');
                      if (scrollEl) {
                        scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="relative cursor-pointer group rounded-2xl bg-white p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-205 border border-slate-100 flex flex-col justify-between"
                  >
                    {/* Badge */}
                    {sport.badge && (
                      <span className="absolute top-4 right-4 bg-[#E07A5F] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {sport.badge}
                      </span>
                    )}

                    <div className="space-y-4">
                      {/* Icono de 60x60px centrado visualmente */}
                      <div className="h-15 w-15 rounded-2xl bg-emerald-50 text-[32px] flex items-center justify-center transition group-hover:scale-110 group-hover:bg-[#2C5F2D] shrink-0">
                        <span>{emoji}</span>
                      </div>
                      
                      <div className="leading-tight">
                        <h4 className="font-extrabold text-[#2C5F2D] text-base group-hover:text-amber-800 transition">{sport.name}</h4>
                        <p className="text-xs text-gray-500 mt-2.5 leading-relaxed truncate-3-lines">
                          {sport.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between text-xs font-bold text-[#E07A5F] border-t border-gray-50 pt-3">
                      <span>Conocer profesores y categorías</span>
                      <ChevronRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                );
              })}

              {/* Juegos Infantiles (no redirige, solo información) */}
              <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-4">
                  {/* Icono de 60x60px */}
                  <div className="h-15 w-15 rounded-2xl bg-sky-50 text-[#5FA8D3] flex items-center justify-center font-bold">
                    <Smile className="h-7 w-7" />
                  </div>
                  
                  <div className="leading-tight">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-[#2C5F2D] text-base">Juegos Infantiles</h4>
                      <span className="bg-sky-100 text-[#5FA8D3] text-[8px] font-extrabold uppercase px-1.5 rounded">Recreativo</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                      Área de libre esparcimiento seguro para niños con arenero, hamacas reforzadas, toboganes y espacio verde arbolado de juego libre coordinado por el parque escolar.
                    </p>
                  </div>
                </div>

                <div className="mt-6 text-[10px] text-zinc-400 font-bold border-t border-gray-50 pt-3 flex items-center space-x-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#5FA8D3]" />
                  <span>Espacio libre sin reservas requeridas en 2026.</span>
                </div>
              </div>

            </div>
          </section>


          {/* 5. TURNERAS (Sistema de Reserva) */}
          <section id="turneras" className="bg-[#2C5F2D] text-white py-16">
            <div className="max-w-5xl mx-auto px-6">
              
              <div className="text-center mb-10">
                <span className="text-xs uppercase font-extrabold text-[#E07A5F] tracking-widest bg-emerald-900 px-3 py-1 rounded-full">
                  Reserva tu Espacio en el Acto
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-3.5 border-none">
                  Turnera de Autogestión Deportiva
                </h3>
                <p className="text-emerald-100/80 text-xs mt-1.5 max-w-lg mx-auto">
                  Seleccione el deporte de interés, asigne el día y elija cualquiera de las horas disponibles. Al confirmar, el horario desaparerá instantáneamente.
                </p>
              </div>

              {/* Caja de reserva principal */}
              <div className="bg-white text-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl border border-emerald-900 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Selector de Deporte, Calendario y Horas */}
                <div className="space-y-6">
                  {/* Selector de deportes (por botones con icono) */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">1. Seleccione Deporte/Cancha</span>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {SPORTS_DATA.slice(0, 6).map((sp) => {
                        const btnEmojis: { [key: string]: string } = {
                          atletismo: '🏃',
                          futbol: '⚽',
                          natacion: '🏊',
                          padel: '🎾',
                          voley: '🏐',
                          musculacion: '🏋️'
                        };
                        const emoji = btnEmojis[sp.id] || '🏟️';
                        return (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => {
                              setSelectedSportId(sp.id);
                              setSelectedHourSlot('');
                            }}
                            className={`rounded-xl p-2 text-center text-xs border flex flex-col items-center justify-center space-y-1 transition ${
                              selectedSportId === sp.id
                                ? 'bg-[#2C5F2D] text-white border-[#2C5F2D] font-bold'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-100'
                            }`}
                          >
                            <span className="text-base">{emoji}</span>
                            <span className="font-semibold capitalize text-[10px] truncate max-w-[80px]">{sp.name.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector de fecha */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">2. Seleccione el Día</label>
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        setSelectedHourSlot('');
                      }}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#2C5F2D] focus:outline-none focus:ring-1 focus:ring-[#2C5F2D] font-medium text-gray-700"
                    />
                  </div>
                </div>

                {/* Grid de Selector de Hora e Inicio de Trámite */}
                <div className="space-y-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">3. Horarios Libres Disponibles</span>
                    
                    {activeSlotsDisponibles.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
                        <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                          ¡No quedan turnos libres para esta fecha!
                        </p>
                        <p className="text-[10px] text-amber-700 mt-1">
                          El Parque cierra Domingos (salvo pádel) y sábados después de mediodía. Intente con otra fecha u otra disciplina.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mt-3 max-h-48 overflow-y-auto pr-1">
                        {activeSlotsDisponibles.map((slot) => (
                          <button
                            key={slot.raw}
                            type="button"
                            onClick={() => setSelectedHourSlot(slot.raw)}
                            className={`rounded-xl py-2 px-3 text-xs font-bold border transition text-center ${
                              selectedHourSlot === slot.raw
                                ? 'bg-[#E07A5F] text-white border-[#E07A5F]'
                                : 'bg-gray-50 border-gray-100 text-slate-800 hover:bg-gray-100'
                            }`}
                          >
                            <span>{slot.raw} hs</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inicio del modal de datos */}
                  {selectedHourSlot && (
                    <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100/50 text-xs">
                      <p className="font-semibold text-[#2C5F2D]">Turno Seleccionado:</p>
                      <p className="text-gray-600 font-bold mt-0.5">
                        {getReadableDateTimeString(bookingDate, selectedHourSlot)}
                      </p>
                      
                      {!userPanelLoggedUser ? (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                          <p className="text-amber-900 font-bold text-[11px] leading-relaxed">
                            🔐 Para poder realizar un pedido de turno, es obligatorio registrarse o abrir sesión.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveView('user-panel');
                            }}
                            className="w-full rounded-lg bg-[#E07A5F] hover:bg-[#c96349] text-white py-2 font-bold transition text-center text-[10px]"
                          >
                            Registrate acá / Abrir Sesión
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={abrirModalReserva}
                          type="button"
                          className="mt-3 w-full rounded-xl bg-[#2C5F2D] hover:bg-[#1a381b] text-white py-2.5 font-bold transition shadow-xs cursor-pointer text-center block"
                          id="open-booking-modal-btn"
                        >
                          Continuar para Reservar
                        </button>
                      )}
                    </div>
                  )}

                </div>

              </div>

            </div>
          </section>


          {/* 6. REGISTROS (Dos Botones Gigantes) */}
          <section id="registros" className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <span className="text-xs uppercase font-extrabold text-[#E07A5F] tracking-widest">Procedimiento Seguro</span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-[#2C5F2D] mt-2 border-none">
                Registro Digital de Acceso Ciudadano
              </h3>
              <p className="text-gray-500 text-xs mt-1.5 max-w-xl mx-auto leading-relaxed">
                El Parque Enrique Berduc cuenta con control automatizado. Todo comensal, atleta o acompañante civil o militar debe efectuar su registro individual o de delegación civil para desbloquear el predio escolar.
              </p>
            </div>

            {/* Dos Botones Grandes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              {/* Botón A: Registro Individual */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md hover:shadow-xl transition flex flex-col justify-between text-left space-y-6">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 text-[#2C5F2D] flex items-center justify-center font-bold">
                    <User className="h-6 w-6" />
                  </div>
                  <h4 className="mt-4 font-extrabold text-gray-900 text-base md:text-lg">A. Registro de Visitante Individual</h4>
                  <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                    Efectúe su registro de pase diario de libre recreación. Cuenta con escáner de DNI automático para autocompletar rápida, captura de foto de perfil con webcam y generación instantánea de código QR para celular.
                  </p>
                </div>
                <button
                  onClick={() => setShowIndividualRegister(true)}
                  type="button"
                  className="rounded-xl bg-[#2C5F2D] hover:bg-[#1e421f] text-white py-3.5 text-xs font-bold transition shadow-xs text-center block w-full cursor-pointer"
                  id="start-individual-register-btn"
                >
                  Iniciar Registro Individual
                </button>
              </div>

              {/* Botón B: Registro de Delegación / Contingentes */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md hover:shadow-xl transition flex flex-col justify-between text-left space-y-6">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-sky-50 text-[#5FA8D3] flex items-center justify-center font-bold">
                    <Users className="h-6 w-6" />
                  </div>
                  <h4 className="mt-4 font-extrabold text-gray-900 text-base md:text-lg">B. Registro Grupal (Delegación / Club)</h4>
                  <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                    Exclusivo para clubes provinciales, escuelas primarias/secundarias y contingentes deportivos que asistan a competir en atletismo, vóley o handball. Permite cargar listas dinámicas de competidores y foto del responsable.
                  </p>
                </div>
                <button
                  onClick={() => setShowGroupRegister(true)}
                  type="button"
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-3.5 text-xs font-bold transition shadow-xs text-center block w-full cursor-pointer"
                  id="start-group-register-btn"
                >
                  Iniciar Registro de Delegación
                </button>
              </div>

            </div>
          </section>
           {/* 7. AGENDA Y CALENDARIO DE EVENTOS (Alineado con lo solicitado por el usuario) */}
          <section id="eventos" className="bg-[#FAF9F5] text-gray-950 py-16 px-6 border-t border-b border-gray-150">
            <div className="max-w-6xl mx-auto space-y-10">
              
              {/* Encabezado Principal */}
              <div className="text-center space-y-3">
                <span className="inline-block bg-[#E07A5F] text-white text-[10px] font-bold tracking-widest uppercase rounded px-3 py-1">
                  Agenda del Polideportivo
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2C5F2D] mb-1 border-none">
                  Eventos y Actividades en Directo
                </h2>
                <p className="text-gray-600 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed font-sans">
                  Seguí el pulso del Parque Berduc en tiempo real. Consultá qué deportes y encuentros se están llevando a cabo en este instante y planificá tu semana con nuestras actividades programadas de acceso libre y gratuito.
                </p>
              </div>

              {/* Botones de Control de Filtros */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto pt-2">
                <button
                  type="button"
                  onClick={() => setEventFilter('todos')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition duration-200 cursor-pointer border ${
                    eventFilter === 'todos'
                      ? 'bg-[#2C5F2D] text-white border-[#2C5F2D] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Todos los Eventos ({eventos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEventFilter('activo')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition duration-200 flex items-center gap-1.5 cursor-pointer border ${
                    eventFilter === 'activo'
                      ? 'bg-red-650 text-white border-red-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                  En Este Momento ({eventos.filter(e => e.status === 'activo').length})
                </button>
                <button
                  type="button"
                  onClick={() => setEventFilter('proximo')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition duration-200 flex items-center gap-1.5 cursor-pointer border ${
                    eventFilter === 'proximo'
                      ? 'bg-[#5FA8D3] text-white border-[#5FA8D3] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>📅</span>
                  Por Hacerse ({eventos.filter(e => e.status === 'proximo').length})
                </button>
              </div>

              {/* Mapeo y renderizado de tarjetas de eventos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {eventos.filter(event => eventFilter === 'todos' || event.status === eventFilter).length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-250 shadow-sm">
                    <p className="text-gray-500 text-xs font-medium">No se encontraron actividades registradas con esta selección en el parque.</p>
                  </div>
                ) : (
                  eventos
                    .filter(event => eventFilter === 'todos' || event.status === eventFilter)
                    .map((evt) => {
                      const isActive = evt.status === 'activo';
                      return (
                        <div
                          key={evt.id}
                          className={`relative rounded-2xl bg-white border transition-all duration-300 hover:translate-y-[-4px] overflow-hidden flex flex-col justify-between shadow-xs ${
                            isActive
                              ? 'border-l-4 border-l-red-500 border-t border-r border-b border-gray-200/80 hover:shadow-md'
                              : 'border-l-4 border-l-[#2C5F2D] border-t border-r border-b border-gray-200/80 hover:shadow-md focus:outline-[#2C5F2D]'
                          }`}
                        >
                          <div className="p-5 space-y-4">
                            {/* Tags superiores y Badge de Estado */}
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-[#E07A5F] tracking-wide uppercase">
                                {evt.category}
                              </span>
                              {isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-650"></span>
                                  En Curso
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-bold uppercase tracking-wider">
                                  Próximo
                                </span>
                              )}
                            </div>

                            {/* Título de la actividad */}
                            <h3 className="text-base md:text-[17px] font-extrabold text-gray-900 tracking-tight leading-snug">
                              {evt.title}
                            </h3>

                            {/* Descripción breve */}
                            <p className="text-gray-600 text-xs leading-relaxed font-normal">
                              {evt.description}
                            </p>

                            {/* Detalles de Ubicación y Fecha */}
                            <div className="space-y-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500 leading-relaxed font-sans">
                              
                              {/* SECTOR DEL PARQUE */}
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 shrink-0 text-[#2C5F2D] mt-0.5" />
                                <div>
                                  <p className="font-bold text-gray-700">Sector del Parque:</p>
                                  <p className="text-gray-600 font-medium">{evt.sector}</p>
                                </div>
                              </div>

                              {/* FECHA Y HORA DE INICIO */}
                              <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 shrink-0 text-[#5FA8D3] mt-0.5" />
                                <div>
                                  <p className="font-bold text-gray-700">Fecha y Hora de Inicio:</p>
                                  <p className="text-gray-600 font-medium font-sans">
                                    {evt.fecha} a las <span className="text-[#5FA8D3] font-bold">{evt.horaInicio}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer de la Tarjeta con detalles adicionales */}
                          <div className={`px-5 py-3.5 bg-gray-50 border-t ${
                            isActive ? 'border-red-100' : 'border-gray-150'
                          } flex items-center justify-between text-[11px]`}>
                            <div className="flex items-center gap-2 text-gray-500 font-medium">
                              {getEventIcon(evt.icon)}
                              <span className="font-bold text-gray-700">{evt.duracion}</span>
                            </div>
                            {evt.entryType === 'pago' ? (
                              <span className="text-orange-650 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded font-black tracking-normal text-[10px] uppercase">
                                Arancelado: ${evt.price || '0'}
                              </span>
                            ) : (
                              <span className="text-[#2C5F2D] bg-[#EBF5EC] border border-[#D5EAD8] px-2 py-0.5 rounded font-black tracking-normal text-[10px] uppercase">
                                Acceso Gratuito
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

            </div>
          </section>


          {/* 8. CONTACTO */}
          <section id="contacto" className="bg-gray-150 py-16 text-xs text-gray-700">
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              {/* Información y Colectivo */}
              <div className="space-y-6">
                <div className="leading-tight">
                  <span className="text-[9px] uppercase font-bold text-[#E07A5F] tracking-widest">Vías de Comunicación</span>
                  <h3 className="text-2xl font-extrabold text-[#2C5F2D] mt-1 border-none">¿Cómo encontrarnos en Paraná?</h3>
                </div>

                <div className="space-y-3.5 leading-relaxed">
                  <div className="flex items-start space-x-2.5">
                    <MapPin className="h-5 w-5 shrink-0 text-[#2C5F2D] mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900">Ubicación y Accesibilidad</p>
                      <p className="text-gray-550 mt-1">Calle Salta (entre Nogoyá y Moreno), Paraná, Entre Ríos, Argentina.</p>
                      {/* Colectivos solicitados */}
                      <p className="mt-1.5 text-xs font-semibold text-emerald-800">
                        🚍 Líneas de colectivos directas: Línea 1, Línea 4, Línea 6
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <Phone className="h-5 w-5 shrink-0 text-[#2C5F2D] mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900">Atención Telefónica</p>
                      <p className="text-gray-550 mt-0.5">+54 343 423-4567 • Lunes a viernes 14 a 22hs.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <Mail className="h-5 w-5 shrink-0 text-[#2C5F2D] mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900">Mesa de Entradas Virtual</p>
                      <p className="text-gray-550 mt-0.5">parqueberduc@entrerios.edu.ar</p>
                    </div>
                  </div>
                </div>

                {/* Redes sociales reales solicitadas */}
                <div className="border-t border-gray-200/65 pt-4">
                  <p className="font-bold text-gray-900 mb-2.5">Seguinos en Redes Sociales</p>
                  <div className="flex space-x-3 text-xs font-bold">
                    <a
                      href="https://www.instagram.com/parqueberduc"
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-700 hover:underline hover:text-pink-850"
                    >
                      Instagram (Instagram.com/parqueberduc)
                    </a>
                    <span className="text-gray-300">|</span>
                    <a
                      href="https://www.facebook.com/parqueberduc"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:underline hover:text-blue-850"
                    >
                      Facebook (Facebook.com/parqueberduc)
                    </a>
                    <span className="text-gray-300">|</span>
                    <a
                      href="https://twitter.com/parqueberduc"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 hover:underline hover:text-sky-850"
                    >
                      Twitter
                    </a>
                  </div>
                </div>
              </div>

              {/* Mapa embebido solicitado */}
              <div className="rounded-2xl overflow-hidden border border-gray-200 h-80 shadow-md">
                <iframe
                  title="Parque Berduc Paraná"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3393.5857214736734!2d-60.5222222!3d-31.7305555!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b45284ec6d67a1%3A0xc0fb13a072833075!2sParque%20Escolar%20Deportivo%20Enrique%20Berduc!5e0!3m2!1ses-419!2sar!4v1700000000000!5m2!1ses-419!2sar"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>

            </div>
          </section>

        </div>
      ) : activeView === 'user-panel' ? (
        /* ======================================================== */
        /* VISTA PANEL DE USUARIO */
        <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
          {/* Header del Panel */}
          <div className="rounded-2xl bg-gradient-to-r from-[#2C5F2D] to-[#1e421f] p-6 md:p-8 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none"></div>
            <div className="relative z-10 space-y-2">
              <span className="bg-[#E07A5F] text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider animate-pulse">
                ¡Registrate Acá! • Área de Recreación y Deportes
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Mi Panel de Usuario - ¡Registrate acá!</h2>
              <p className="text-emerald-100 text-xs md:text-sm max-w-2xl font-light">
                ¡Registrate acá para poder realizar reservas de canchas y pedir turnos deportivos! Gestioná tus datos personales, elegí tu deporte preferido para practicar en el parque Berduc, cargá tu foto de perfil y descargá tu credencial digital con código de acceso.
              </p>
            </div>
          </div>

          {/* CONTROL DE SESION / ACCESO CON USUARIO Y CONTRASEÑA */}
          {!userPanelLoggedUser ? (
            <div className="space-y-6">
              {/* Selector de Pestañas */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserPanelTab('login');
                    setUserPanelMessage(null);
                  }}
                  className={`flex-1 py-3 text-center font-extrabold text-xs rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                    userPanelTab === 'login'
                      ? 'bg-white text-[#2C5F2D] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔑 Iniciar Sesión (Acceder)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserPanelTab('register');
                    setUserPanelMessage(null);
                  }}
                  className={`flex-1 py-3 text-center font-extrabold text-xs rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                    userPanelTab === 'register'
                      ? 'bg-white text-[#2C5F2D] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  id="user-panel-register-tab-btn"
                >
                  📝 Registrarse (Crear Cuenta)
                </button>
              </div>

              {userPanelMessage && (
                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  userPanelMessage.type === 'success' 
                    ? 'bg-[#EBF5EC] text-[#2C5F2D] border-[#D5EAD8]' 
                    : 'bg-orange-50 text-orange-850 border-orange-100'
                }`}>
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{userPanelMessage.text}</span>
                </div>
              )}

              {userPanelTab === 'login' && (
                /* PANEL INICIAR SESIÓN */
                <div className="max-w-md mx-auto rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
                  <div className="text-center">
                    <h3 className="font-extrabold text-[#2C5F2D] text-base">Ingresá a tu cuenta</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Colocá tu DNI y tu contraseña personalizada para reservar turnos.</p>
                  </div>

                  <form onSubmit={handleUserPanelLogin} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Número de DNI (Usuario) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 34555888"
                        value={loginDni}
                        onChange={(e) => setLoginDni(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Contraseña Personalizada *</label>
                      <input
                        type="password"
                        required
                        placeholder="Ingresá tu contraseña"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#2C5F2D] hover:bg-[#1e421f] text-white font-extrabold rounded-xl text-xs transition duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Iniciar Sesión</span>
                    </button>
                  </form>

                  <div className="text-center pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      ¿Todavía no tenés cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => setUserPanelTab('register')}
                        className="text-[#E07A5F] hover:underline font-bold"
                      >
                        Registrate acá
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* BANNER DE INICIO DE SESIÓN ACTIVO */
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 md:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  {userPanelLoggedUser.foto ? (
                    <img src={userPanelLoggedUser.foto} alt="Perfil" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-emerald-900 text-sm">Sesión Iniciada</h4>
                  <p className="text-xs text-emerald-700">Usuario: {userPanelLoggedUser.nombre} {userPanelLoggedUser.apellido} (DNI: {userPanelLoggedUser.dni})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserPanelLoggedUser(null);
                  setUserPanelMessage(null);
                  setLoginDni('');
                  setLoginPassword('');
                  setUserPanelForm({
                    nombre: '',
                    apellido: '',
                    dni: '',
                    fechaNacimiento: '',
                    domicilio: '',
                    localidad: 'Paraná',
                    provincia: 'Entre Ríos',
                    telefono: '',
                    email: '',
                    genero: 'Masculino',
                    deporteFavorito: 'atletismo',
                    foto: '',
                    contrasena: ''
                  });
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cerrar Sesión (Salir)
              </button>
            </div>
          )}

          {/* Formulario de Datos y Credencial (Visible solo si está logueado o si está en la pestaña de Registro) */}
          {(userPanelLoggedUser || (!userPanelLoggedUser && userPanelTab === 'register')) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulario Izquierda (2 de 3 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleUserPanelSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3">
                      {userPanelLoggedUser ? 'Actualizar mis Datos Personales' : 'Formulario de Registro - Crear Cuenta'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {userPanelLoggedUser 
                        ? 'Actualizá tus datos de perfil que se guardarán para tus futuras reservas en el parque Berduc.' 
                        : 'Completá tus datos para registrarte por primera vez. ¡Podrás elegir tu deporte favorito y definir tu contraseña personalizada!'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Nombre *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Juan"
                        value={userPanelForm.nombre}
                        onChange={(e) => setUserPanelForm({ ...userPanelForm, nombre: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold"
                      />
                    </div>

                    {/* Apellido */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Apellido *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Pérez"
                        value={userPanelForm.apellido}
                        onChange={(e) => setUserPanelForm({ ...userPanelForm, apellido: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold"
                      />
                    </div>

                    {/* DNI */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Número de DNI *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 34555888"
                        value={userPanelForm.dni}
                        onChange={(e) => setUserPanelForm({ ...userPanelForm, dni: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold font-mono"
                      />
                    </div>

                    {/* Contraseña Personalizada */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Contraseña Personalizada *</label>
                      <input
                        type="password"
                        required
                        placeholder="Creá tu contraseña"
                        value={userPanelForm.contrasena}
                        onChange={(e) => setUserPanelForm({ ...userPanelForm, contrasena: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold"
                      />
                    </div>

                    {/* Fecha de Nacimiento */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Fecha de Nacimiento *</label>
                      <input
                        type="date"
                        required
                        value={userPanelForm.fechaNacimiento}
                        onChange={(e) => setUserPanelForm({ ...userPanelForm, fechaNacimiento: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold font-mono"
                      />
                    </div>

                  {/* Teléfono */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Teléfono de Contacto</label>
                    <input
                      type="text"
                      placeholder="Ej: 3434112233"
                      value={userPanelForm.telefono}
                      onChange={(e) => setUserPanelForm({ ...userPanelForm, telefono: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold font-mono"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="Ej: juan.perez@email.com"
                      value={userPanelForm.email}
                      onChange={(e) => setUserPanelForm({ ...userPanelForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold"
                    />
                  </div>

                  {/* Domicilio */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Domicilio (Calle y Altura)</label>
                    <input
                      type="text"
                      placeholder="Ej: Calle Salta 123"
                      value={userPanelForm.domicilio}
                      onChange={(e) => setUserPanelForm({ ...userPanelForm, domicilio: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold"
                    />
                  </div>

                  {/* Localidad */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Localidad</label>
                    <input
                      type="text"
                      placeholder="Ej: Paraná"
                      value={userPanelForm.localidad}
                      onChange={(e) => setUserPanelForm({ ...userPanelForm, localidad: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold"
                    />
                  </div>

                  {/* Provincia */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Provincia</label>
                    <input
                      type="text"
                      placeholder="Ej: Entre Ríos"
                      value={userPanelForm.provincia}
                      onChange={(e) => setUserPanelForm({ ...userPanelForm, provincia: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold"
                    />
                  </div>

                  {/* Género */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Género</label>
                    <select
                      value={userPanelForm.genero}
                      onChange={(e) => setUserPanelForm({ ...userPanelForm, genero: e.target.value as 'Masculino' | 'Femenino' | 'Otro' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-[#2C5F2D] bg-slate-50/50 text-xs font-semibold"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Selección de Deporte Favorito */}
                <div className="space-y-2 border-t border-slate-100 pt-5">
                  <div>
                    <label className="text-xs font-extrabold uppercase text-[#2C5F2D] tracking-wide block">¿Qué deportes te gusta hacer? (Podés elegir más de uno) *</label>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Seleccioná una o más disciplinas deportivas que practicas o deseás practicar en el parque para vincularlas a tu credencial digital.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2">
                    {SPORTS_DATA.map((sport) => {
                      const sportEmojis: { [key: string]: string } = {
                        atletismo: '🏃',
                        futbol: '⚽',
                        natacion: '🏊',
                        voley: '🏐',
                        padel: '🎾',
                        basquet: '🏀',
                        handball: '🤾',
                        musculacion: '🏋️',
                        playon: '🛹'
                      };
                      const emoji = sportEmojis[sport.id] || '🏟️';
                      const deportesFavoritos = userPanelForm.deportesFavoritos || [];
                      const isSelected = deportesFavoritos.includes(sport.id);
                      
                      const handleSportToggle = () => {
                        let updatedSports = [...deportesFavoritos];
                        if (isSelected) {
                          if (updatedSports.length > 1) {
                            updatedSports = updatedSports.filter(id => id !== sport.id);
                          }
                        } else {
                          updatedSports.push(sport.id);
                        }
                        setUserPanelForm({
                          ...userPanelForm,
                          deporteFavorito: updatedSports[0] || 'atletismo',
                          deportesFavoritos: updatedSports
                        });
                      };
                      
                      return (
                        <button
                          key={sport.id}
                          type="button"
                          onClick={handleSportToggle}
                          className={`rounded-xl p-3 border text-left transition flex flex-col justify-between h-20 relative overflow-hidden ${
                            isSelected
                              ? 'bg-emerald-50 border-[#2C5F2D] text-[#2C5F2D] shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <span className="text-xl">{emoji}</span>
                            {isSelected && (
                              <span className="bg-[#2C5F2D] text-white rounded-full p-0.5 text-[8px] font-bold w-4 h-4 flex items-center justify-center">✓</span>
                            )}
                          </div>
                          <span className="font-extrabold text-[10px] tracking-wide block truncate w-full capitalize mt-1">
                            {sport.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Carga de Foto de Perfil */}
                <div className="space-y-2 border-t border-slate-100 pt-5">
                  <div>
                    <label className="text-xs font-extrabold uppercase text-[#2C5F2D] tracking-wide block">Foto de Perfil del Usuario *</label>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Subí una foto de perfil clara (formato JPG/PNG). Esto es necesario para validar tu identidad en el control de acceso del parque.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center mt-3">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {userPanelForm.foto ? (
                        <img
                          src={userPanelForm.foto}
                          alt="Foto de Perfil"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                      <div className="relative inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          id="user-panel-file-upload"
                          onChange={handleUserPanelPhotoChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="user-panel-file-upload"
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs border border-slate-200 cursor-pointer flex items-center justify-center gap-2 transition duration-150"
                        >
                          <Upload className="h-3.5 w-3.5 text-slate-600" />
                          <span>Elegir archivo de imagen</span>
                        </label>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono">Permite archivos .png, .jpg, .jpeg menores a 2MB.</p>
                    </div>
                  </div>
                </div>

                {/* Botón de Guardado */}
                <div className="border-t border-slate-100 pt-5 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-[#2C5F2D] hover:bg-[#1e421f] text-white font-extrabold text-xs px-6 py-3.5 transition duration-150 shadow-sm flex items-center gap-2 cursor-pointer"
                    id="save-user-panel-profile-btn"
                  >
                    <Check className="h-4 w-4" />
                    <span>Guardar y Confirmar Mis Datos</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Credencial Digital Derecha (1 de 3 cols) */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-sm mb-1">
                  Tu Credencial Digital de Socio
                </h3>
                <p className="text-[10px] text-slate-500 mb-5 leading-relaxed">
                  Esta es tu credencial interactiva para ingresar a las instalaciones del Parque Enrique Berduc de Paraná.
                </p>

                {/* Tarjeta Visual de Credencial */}
                {userPanelLoggedUser ? (() => {
                  const sportObj = SPORTS_DATA.find(s => s.id === userPanelLoggedUser.deporteFavorito);
                  const sportEmojis: { [key: string]: string } = {
                    atletismo: '🏃',
                    futbol: '⚽',
                    natacion: '🏊',
                    voley: '🏐',
                    padel: '🎾',
                    basquet: '🏀',
                    handball: '🤾',
                    musculacion: '🏋️',
                    playon: '🛹'
                  };
                  const currentEmoji = sportEmojis[userPanelLoggedUser.deporteFavorito || ''] || '🏟️';

                  return (
                    <div className="rounded-3xl bg-[#2C5F2D] text-white overflow-hidden shadow-lg border border-emerald-800 relative flex flex-col justify-between h-96">
                      {/* Fondo estético */}
                      <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none"></div>
                      <div className="absolute left-0 top-1/4 w-32 h-32 rounded-full bg-black/5 pointer-events-none"></div>

                      {/* Header de la Credencial */}
                      <div className="p-5 bg-black/10 border-b border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[8px] uppercase font-bold tracking-widest text-emerald-250 block">Credencial Digital</span>
                          <span className="font-black text-xs tracking-tight uppercase">Parque Berduc</span>
                        </div>
                        <div className="text-xl bg-white/10 w-9 h-9 rounded-xl flex items-center justify-center">
                          {currentEmoji}
                        </div>
                      </div>

                      {/* Cuerpo de la Credencial */}
                      <div className="p-5 flex flex-col items-center text-center space-y-4 flex-1 justify-center">
                        {/* Foto circular con borde */}
                        <div className="w-24 h-24 rounded-full border-4 border-white/25 overflow-hidden shadow-inner bg-emerald-900/60 flex items-center justify-center shrink-0">
                          {userPanelLoggedUser.foto ? (
                            <img
                              src={userPanelLoggedUser.foto}
                              alt="Foto de Socio"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User className="h-10 w-10 text-emerald-300" />
                          )}
                        </div>

                        {/* Nombre y Deporte */}
                        <div className="leading-tight space-y-1.5 w-full">
                          <h4 className="font-extrabold text-base tracking-tight capitalize leading-tight">
                            {userPanelLoggedUser.nombre} {userPanelLoggedUser.apellido}
                          </h4>
                          <div className="flex flex-wrap gap-1 justify-center max-w-full px-2">
                            {(userPanelLoggedUser.deportesFavoritos && userPanelLoggedUser.deportesFavoritos.length > 0
                              ? userPanelLoggedUser.deportesFavoritos
                              : [userPanelLoggedUser.deporteFavorito || 'atletismo']
                            ).map(sportId => {
                              const sObj = SPORTS_DATA.find(s => s.id === sportId);
                              return (
                                <span key={sportId} className="inline-block bg-[#E07A5F] text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                                  {sObj?.name || sportId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Footer de la Credencial */}
                      <div className="p-5 bg-zinc-950/20 border-t border-white/10 flex items-center justify-between text-left font-mono">
                        <div>
                          <span className="text-[8px] uppercase text-emerald-250 block">Código Socio</span>
                          <span className="text-xs font-bold font-sans">{userPanelLoggedUser.codigo}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] uppercase text-emerald-250 block">DNI</span>
                          <span className="text-xs font-bold font-sans">{userPanelLoggedUser.dni}</span>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  /* Credencial Desconectada / Estado Vacío */
                  <div className="rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 overflow-hidden flex flex-col items-center justify-center text-center p-8 h-96 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <User className="h-7 w-7 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 text-xs leading-normal">Sin Perfil Cargado</h4>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-relaxed mx-auto">
                        Ingresá tu DNI en el buscador de arriba para cargar tus datos actuales o registrarte.
                      </p>
                    </div>
                  </div>
                )}

                {/* Acciones de Credencial */}
                {userPanelLoggedUser && (
                  <div className="mt-5 space-y-2.5">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
                      <Check className="h-4 w-4 text-[#2C5F2D] shrink-0 mt-0.5" />
                      <span>
                        ¡Esta credencial se encuentra activa! Es válida para ingresar a tus deportes seleccionados.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setUserPanelLoggedUser(null);
                        setUserPanelMessage(null);
                        setUserPanelDniSearch('');
                        setUserPanelForm({
                          nombre: '',
                          apellido: '',
                          dni: '',
                          fechaNacimiento: '',
                          domicilio: '',
                          localidad: 'Paraná',
                          provincia: 'Entre Ríos',
                          telefono: '',
                          email: '',
                          genero: 'Masculino',
                          deporteFavorito: 'atletismo',
                          deportesFavoritos: ['atletismo'],
                          foto: ''
                        });
                      }}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Salir de mi Perfil</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleEliminarMiCuenta}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 hover:text-rose-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      <span>Eliminar mi Cuenta Permanentemente</span>
                    </button>
                  </div>
                )}

                {/* Registrar Entrada Hoy */}
                {userPanelLoggedUser && (
                  <div className="rounded-2xl border border-emerald-150 bg-emerald-50/20 p-5 mt-4 space-y-3 shadow-2xs">
                    <h4 className="font-extrabold text-[#2C5F2D] text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      📍 Registrar mi Ingreso de Hoy
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      ¿Vas a ingresar al parque hoy? Seleccioná el sector al que te dirigís para registrar tu visita.
                    </p>
                    <div className="space-y-2">
                      <select
                        id="user-panel-ingreso-sector"
                        defaultValue="recreativo"
                        className="w-full rounded-xl border border-emerald-250 bg-white px-2.5 py-2 text-xs focus:border-[#2C5F2D] focus:outline-none font-semibold text-gray-750"
                      >
                        <option value="recreativo">🍀 Acceso Libre Recreativo</option>
                        {SPORTS_DATA.map(sport => (
                          <option key={sport.id} value={sport.id}>
                            {sport.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const selectEl = document.getElementById('user-panel-ingreso-sector') as HTMLSelectElement | null;
                          const selectedSectorId = selectEl?.value || 'recreativo';
                          const selectedSectorName = selectedSectorId === 'recreativo' 
                            ? 'Acceso Libre Recreativo' 
                            : (SPORTS_DATA.find(s => s.id === selectedSectorId)?.name || selectedSectorId);
                          
                          const guardado = registrarVisitante({
                            nombre: userPanelForm.nombre,
                            apellido: userPanelForm.apellido,
                            dni: userPanelForm.dni,
                            fechaNacimiento: userPanelForm.fechaNacimiento,
                            domicilio: userPanelForm.domicilio,
                            localidad: userPanelForm.localidad,
                            provincia: userPanelForm.provincia,
                            telefono: userPanelForm.telefono,
                            email: userPanelForm.email,
                            genero: userPanelForm.genero,
                            deporteFavorito: userPanelForm.deporteFavorito,
                            deportesFavoritos: userPanelForm.deportesFavoritos || [userPanelForm.deporteFavorito],
                            foto: userPanelForm.foto,
                            contrasena: userPanelForm.contrasena,
                            sectorIngresoId: selectedSectorId,
                            sectorIngresoName: selectedSectorName
                          });
                          
                          setUserPanelLoggedUser(guardado);
                          setUserPanelMessage({ type: 'success', text: `¡Ingreso registrado con éxito en el sector: ${selectedSectorName}! Se guardó la visita en tu historial.` });
                        }}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Confirmar Mi Ingreso</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Historial de mis Visitas */}
                {userPanelLoggedUser && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 mt-4 space-y-3 shadow-xs">
                    <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      📋 Mi Historial de Visitas ({userPanelLoggedUser.historialVisitas?.length || 0})
                    </h4>
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {!userPanelLoggedUser.historialVisitas || userPanelLoggedUser.historialVisitas.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic py-2 text-center">Aún no registraste ingresos hoy.</p>
                      ) : (
                        [...userPanelLoggedUser.historialVisitas].reverse().map((vis, vIdx) => (
                          <div key={vis.id || vIdx} className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex justify-between items-center text-[10px] gap-2">
                            <div>
                              <p className="font-extrabold text-slate-800">{vis.sectorName}</p>
                              <p className="text-[9px] text-slate-400 font-medium">{new Date(vis.fecha).toLocaleString('es-AR')}</p>
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                              INGRESADO
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      ) : (

        /* ======================================================== */
        /* VISTA DETALLE DE DEPORTE (Equivalente dynamic a deportes/*.html) */
        (() => {
          const sport = SPORTS_DATA.find(s => s.id === activeView);
          if (!sport) return null;
          
          const sportEmojis: { [key: string]: string } = {
            atletismo: '🏃',
            futbol: '⚽',
            natacion: '🏊',
            voley: '🏐',
            padel: '🎾',
            basquet: '🏀',
            handball: '🤾',
            musculacion: '🏋️',
            playon: '🛹'
          };
          const emoji = sportEmojis[sport.id] || '🏟️';

          // Filtrar profesores y de la db local correspondientes a este deporte
          const profsDeporte = profesores.filter(p => p.deporte === sport.id);

          return (
            <div className="flex-1 bg-white">
              {/* Banner visual del Deporte */}
              <div
                className="relative bg-zinc-950 text-white min-h-[280px] flex flex-col justify-end p-8"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('${sport.bannerImage}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="max-w-4xl space-y-2">
                  <button
                    onClick={() => { setActiveView('home'); window.location.hash = '#/'; }}
                    className="flex items-center space-x-1 border border-white/40 hover:bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition duration-150 mb-4 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Volver al inicio</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl md:text-4xl font-extrabold text-white flex items-center gap-2">
                      <span className="text-[28px] md:text-[38px]">{emoji}</span>
                      <span>{sport.name}</span>
                    </h2>
                    {sport.badge && (
                      <span className="bg-[#E07A5F] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        {sport.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-xs md:text-sm max-w-xl">{sport.description}</p>
                </div>
              </div>

              <div className="max-w-5xl mx-auto px-6 py-12 text-xs md:text-sm text-gray-700 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Panel Centralizado de Información y Reseña */}
                <div className="md:col-span-2 space-y-8">
                  {/* Historia y Reseña */}
                  <div>
                    <h3 className="text-[#2C5F2D] text-sm font-extrabold uppercase tracking-wider mb-3">Historia y Reseña en Entre Ríos</h3>
                    <p className="leading-relaxed text-justify text-gray-650">{sport.historiaProvincial}</p>
                  </div>

                  {/* Deportistas Destacados */}
                  <div>
                    <h3 className="text-[#2C5F2D] text-sm font-extrabold uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <span>Deportistas Destacados del Berduc</span>
                    </h3>
                    <div className="space-y-4">
                      {sport.destacados.map((dest, i) => (
                        <div key={i} className="rounded-xl border border-gray-150 bg-gray-50/55 p-4 flex items-start space-x-3 leading-relaxed">
                          <span className="text-xl">⭐</span>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-tight">{dest.nombre}</h4>
                            <p className="text-xs text-gray-600 mt-1">{dest.logro}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar del Deporte: Profesores y Horarios */}
                <div className="md:col-span-1 space-y-6 md:border-l md:border-gray-100 md:pl-8">
                  
                  {/* Profesores en Cargo */}
                  <div>
                    <h3 className="text-[#2C5F2D] text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-3">Staff de Profesores</h3>
                    {profsDeporte.length === 0 ? (
                      <p className="text-xs text-gray-400">Sin profesor asignado temporalmente.</p>
                    ) : (
                      <div className="space-y-3.5 text-xs text-gray-700">
                        {profsDeporte.map((prof, idx) => (
                          <div key={idx} className="rounded-xl border border-gray-100 p-3 bg-white space-y-1 shadow-2xs">
                            <p className="font-bold text-gray-900">{prof.nombre}</p>
                            <p className="text-gray-500 font-semibold text-[10px] uppercase">{prof.categoria}</p>
                            <p className="text-emerald-800 font-bold font-mono text-[10px]">{prof.contacto}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Horarios por Categoría */}
                  <div>
                    <h3 className="text-[#2C5F2D] text-xs font-extrabold uppercase tracking-widest text-[#E07A5F] mb-3">Horarios por Categoría</h3>
                    <div className="space-y-3.5 text-xs text-gray-700">
                      {sport.horarios.map((hor, idx) => (
                        <div key={idx} className="rounded-xl border border-gray-100 p-3 bg-white space-y-1.5 shadow-2xs leading-tight">
                          <p className="font-bold text-[#2C5F2D] text-xs">{hor.categoria}</p>
                          <div className="flex items-center space-x-1.5 text-gray-500 text-[11px] font-semibold">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{hor.dias}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-orange-700 text-[11px] font-bold">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{hor.horario}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Atajo rápido para reservar */}
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100/70 p-4 font-xs leading-relaxed text-emerald-900">
                    <h5 className="font-bold text-[#2C5F2D] text-xs">¿Desea reservar espacio?</h5>
                    <p className="mt-1 font-medium text-gray-600">
                      Diríjase a la turnera central para reservar turnos disponibles para {sport.name} en este año 2026.
                    </p>
                    <button
                      onClick={() => handleNavClick('turneras')}
                      className="mt-3 w-full rounded-xl bg-[#2C5F2D] text-white py-2 text-xs font-bold hover:bg-[#1a381b] block text-center cursor-pointer"
                    >
                      Reservar Cancha
                    </button>
                  </div>

                </div>

              </div>
            </div>
          );
        })()
      )}


      {/* ======================================================== */}
      {/* 4. MODAL: FORMULARIO DE RESERVA DE TURNERA */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-[#2C5F2D] p-5 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-250">Finalizar Reserva Cancha</span>
                <h3 className="font-bold text-sm tracking-wide mt-0.5">Ingresar Datos Personales</h3>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="rounded-full bg-black/10 p-1 text-white hover:bg-black/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 text-xs space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={bookingForm.nombreCompleto}
                  onChange={(e) => setBookingForm({ ...bookingForm, nombreCompleto: e.target.value })}
                  placeholder="Ej: Germán Lauro"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#2C5F2D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">DNI (sin puntos)</label>
                <input
                  type="text"
                  required
                  pattern="\d{7,10}"
                  value={bookingForm.dni}
                  onChange={(e) => setBookingForm({ ...bookingForm, dni: e.target.value.replace(/\D/g, '') })}
                  placeholder="Ej: 43123456"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#2C5F2D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Celular de Contacto</label>
                <input
                  type="tel"
                  required
                  value={bookingForm.telefono}
                  onChange={(e) => setBookingForm({ ...bookingForm, telefono: e.target.value })}
                  placeholder="Ej: +54 343 154-123456"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#2C5F2D] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="rounded-lg bg-gray-105 hover:bg-gray-200 px-3.5 py-2 font-bold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2C5F2D] hover:bg-[#1f4220] px-4 py-2 font-bold text-white cursor-pointer"
                  id="confirm-booking-submit-btn"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* 5. MODAL: REGISTRO INDIVIDUAL FORM */}
      {showIndividualRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-[#2C5F2D] p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm tracking-wide">Registro de Visitante Individual</h3>
                <p className="text-[10px] text-emerald-100">Generador de Auto-Pase QR para Paraná</p>
              </div>
              <button
                onClick={() => { setShowIndividualRegister(false); stopCamera(); }}
                className="rounded-full bg-black/10 p-1 text-white hover:bg-black/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleIndividualSubmit} className="p-6 text-xs space-y-4 max-h-[480px] overflow-y-auto">
              
              {/* Botón de Escáner de DNI con html5-qrcode */}
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">💳</span>
                  <div>
                    <h5 className="font-bold text-[#2C5F2D] text-xs">Escáner de Tarjeta DNI</h5>
                    <p className="text-[10px] text-gray-500">¿Desea autocompletar leyendo el código de barras?</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDniScanner(true)}
                  className="rounded-lg bg-[#2C5F2D] hover:bg-[#1b3a1c] text-white px-3 py-1.5 text-[10px] font-bold transition flex items-center space-x-1"
                  id="individual-dni-scanner-launch-btn"
                >
                  <Camera className="h-3 w-3" />
                  <span>Escanear DNI</span>
                </button>
              </div>

              {/* Grid Nombre y Apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={individualForm.nombre}
                    onChange={(e) => setIndividualForm({ ...individualForm, nombre: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#2C5F2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={individualForm.apellido}
                    onChange={(e) => setIndividualForm({ ...individualForm, apellido: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#2C5F2D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">DNI (sin puntos) *</label>
                  <input
                    type="text"
                    required
                    pattern="\d{7,10}"
                    value={individualForm.dni}
                    onChange={(e) => setIndividualForm({ ...individualForm, dni: e.target.value.replace(/\D/g, '') })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#2C5F2D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    required
                    value={individualForm.fechaNacimiento}
                    onChange={(e) => setIndividualForm({ ...individualForm, fechaNacimiento: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#2C5F2D] focus:outline-none text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Celular de Contacto *</label>
                  <input
                    type="tel"
                    required
                    value={individualForm.telefono}
                    onChange={(e) => setIndividualForm({ ...individualForm, telefono: e.target.value })}
                    placeholder="Ej: +54343154121212"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#2C5F2D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Email de Contacto</label>
                  <input
                    type="email"
                    value={individualForm.email}
                    onChange={(e) => setIndividualForm({ ...individualForm, email: e.target.value })}
                    placeholder="Ej: correo@parana.com"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#2C5F2D] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Domicilio *</label>
                  <input
                    type="text"
                    required
                    value={individualForm.domicilio}
                    placeholder="Calle y Nro de Residencia"
                    onChange={(e) => setIndividualForm({ ...individualForm, domicilio: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#2C5F2D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Género (* para Estadísticas)</label>
                  <select
                    value={individualForm.genero}
                    onChange={(e) => setIndividualForm({ ...individualForm, genero: e.target.value as any })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-1.8 text-xs focus:border-[#2C5F2D] focus:outline-none font-semibold text-gray-700"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro / X</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-emerald-700 mb-1">Sector del Parque a Visitar *</label>
                  <select
                    value={individualForm.sectorIngresoId}
                    onChange={(e) => setIndividualForm({ ...individualForm, sectorIngresoId: e.target.value })}
                    className="w-full rounded-xl border border-emerald-250 bg-emerald-50/30 px-2.5 py-1.8 text-xs focus:border-[#2C5F2D] focus:outline-none font-semibold text-gray-750"
                  >
                    <option value="recreativo">🍀 Acceso Libre Recreativo</option>
                    {SPORTS_DATA.map(sport => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Captura de Foto selfie select */}
              <div className="border border-gray-25px bg-gray-50 rounded-xl p-4 space-y-3.5">
                <span className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider">Fotografía de Perfil (Opcional)</span>
                
                <div className="flex items-center gap-4">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Selfie Cropped"
                      referrerPolicy="no-referrer"
                      className="h-16 w-16 rounded-full object-cover border-2 border-[#2C5F2D] shadow-sm"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 shrink-0 text-sm">
                      S/F
                    </div>
                  )}

                  <div className="flex-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera(false)}
                      className="flex-1 flex items-center justify-center space-x-1 rounded-lg border border-[#2C5F2D] text-[#2C5F2D] py-2 hover:bg-[#2C5F2D]/5 transition text-[11px] font-bold cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Tomar con Webcam</span>
                    </button>
                    <label className="flex-1 flex items-center justify-center space-x-1 rounded-lg border border-gray-200 text-gray-700 bg-white py-2 hover:bg-gray-100 transition text-[11px] font-bold cursor-pointer">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Subir Imagen</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Video del stream en vivo para tomar snapshot */}
                {photoMode === 'camera' && (
                  <div className="flex flex-col items-center bg-black p-3 rounded-xl border">
                    <video ref={videoRef} autoPlay playsInline className="h-44 w-44 rounded-lg bg-zinc-900 object-cover"></video>
                    <div className="flex gap-2.5 mt-3 w-full max-w-[200px]">
                      <button
                        type="button"
                        onClick={() => { stopCamera(); setPhotoMode('upload'); }}
                        className="flex-1 rounded bg-zinc-75 px-2 py-1 text-white hover:bg-zinc-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => captureSnapshot(false)}
                        className="flex-1 rounded bg-[#E07A5F] px-2 py-1 text-white font-bold"
                      >
                        Capturar Selfie
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Aceptar Términos */}
              <div className="flex items-start space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="acepta-term-indiv"
                  required
                  checked={individualForm.aceptaTerminos}
                  onChange={(e) => setIndividualForm({ ...individualForm, aceptaTerminos: e.target.checked })}
                  className="rounded border-gray-300 mt-1 focus:ring-[#2C5F2D]"
                />
                <label htmlFor="acepta-term-indiv" className="text-[10px] leading-tight text-gray-500 font-medium">
                  Declaro bajo juramento médico y civil poseer buena salud en este año 2026, y acepto cumplir los códigos de urbanismo del Parque Deportivo Enrique Berduc Paraná.
                </label>
              </div>

              {/* Botón enviar */}
              <div className="pt-4 flex justify-end gap-3.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowIndividualRegister(false); stopCamera(); }}
                  className="rounded-lg bg-gray-105 hover:bg-gray-200 px-4 py-2 font-bold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!individualForm.aceptaTerminos}
                  className="rounded-lg bg-[#2C5F2D] hover:bg-[#1e421f] text-white font-extrabold px-6 py-2 shadow disabled:bg-gray-200 disabled:cursor-not-allowed cursor-pointer"
                  id="individual-register-submit-btn"
                >
                  Registrar y Generar QR
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* 6. MODAL: REGISTRO GRUPAL / DELEGACIONES */}
      {showGroupRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Registro de Contingentes y Equipos</h3>
                <p className="text-[10px] text-orange-200">Alta de clubes de Entre Ríos e instituciones</p>
              </div>
              <button
                onClick={() => { setShowGroupRegister(false); stopCamera(); }}
                className="rounded-full bg-black/10 p-1 text-white hover:bg-black/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGroupSubmit} className="p-6 text-xs space-y-4 max-h-[480px] overflow-y-auto">
              
              {/* Sección A: Datos de la delegación */}
              <div className="space-y-3.5 border-b border-gray-100 pb-4">
                <h4 className="font-bold text-orange-700 text-xs uppercase tracking-wide">1. Datos del Contingente</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Nombre el Equipo o Escuela *</label>
                    <input
                      type="text"
                      required
                      value={delegacionForm.nombreEquipo}
                      onChange={(e) => setDelegacionForm({ ...delegacionForm, nombreEquipo: e.target.value })}
                      placeholder="Ej: Club Talleres de Victoria"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Lugar de Origen *</label>
                    <input
                      type="text"
                      required
                      value={delegacionForm.origen}
                      onChange={(e) => setDelegacionForm({ ...delegacionForm, origen: e.target.value })}
                      placeholder="Ej: Crespo, Entre Ríos"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Competencia / Actividad *</label>
                    <input
                      type="text"
                      required
                      value={delegacionForm.competencia}
                      onChange={(e) => setDelegacionForm({ ...delegacionForm, competencia: e.target.value })}
                      placeholder="Ej: Campus de Atletismo sub-16"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Días de Visita *</label>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        required
                        value={delegacionForm.diasVisita}
                        onChange={(e) => setDelegacionForm({ ...delegacionForm, diasVisita: Number(e.target.value) || 1 })}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Deporte Principal</label>
                      <select
                        value={delegacionForm.deportePrincipal}
                        onChange={(e) => setDelegacionForm({ ...delegacionForm, deportePrincipal: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-white px-2 py-1.8 text-gray-700"
                      >
                        <option value="basquet">Básquet</option>
                        <option value="atletismo">Atletismo</option>
                        <option value="voley">Vóley</option>
                        <option value="futbol">Fútbol</option>
                        <option value="handball">Handball</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección B: Datos del responsable */}
              <div className="space-y-4 border-b border-gray-100 pb-4">
                <h4 className="font-bold text-orange-700 text-xs uppercase tracking-wide">2. Datos de la Persona Responsable</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={responsableForm.nombre}
                      onChange={(e) => setResponsableForm({ ...responsableForm, nombre: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={responsableForm.apellido}
                      onChange={(e) => setResponsableForm({ ...responsableForm, apellido: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">DNI del Responsable *</label>
                    <input
                      type="text"
                      required
                      pattern="\d{7,10}"
                      value={responsableForm.dni}
                      onChange={(e) => setResponsableForm({ ...responsableForm, dni: e.target.value.replace(/\D/g, '') })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Teléfono de Enlace *</label>
                    <input
                      type="tel"
                      required
                      value={responsableForm.telefono}
                      onChange={(e) => setResponsableForm({ ...responsableForm, telefono: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">E-mail *</label>
                    <input
                      type="email"
                      required
                      value={responsableForm.email}
                      onChange={(e) => setResponsableForm({ ...responsableForm, email: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2"
                    />
                  </div>
                </div>

                {/* Foto selfie responsable */}
                <div className="border border-gray-205 bg-gray-50 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <span className="block text-[9px] font-bold uppercase text-gray-450 block mb-1">Foto Selfie Oficial del Responsable</span>
                    <p className="text-[10px] text-gray-450 leading-tight">Obligatorio por normativas departamentales de acreditación física.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera(true)}
                      className="flex-1 flex items-center justify-center space-x-1 rounded-lg border border-orange-600 text-orange-600 py-1.8 hover:bg-orange-600/5 transition text-[10px] font-bold cursor-pointer"
                    >
                      <Camera className="h-3 w-3" />
                      <span>Cámara</span>
                    </button>
                    <label className="flex-1 flex items-center justify-center space-x-1 rounded-lg border border-gray-200 bg-white text-gray-700 py-1.8 hover:bg-gray-100 transition text-[10px] font-bold cursor-pointer">
                      <Upload className="h-3 w-3" />
                      <span>Subir</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {responsablePhotoMode === 'camera' && (
                    <div className="sm:col-span-2 flex flex-col items-center bg-black p-3.5 rounded-lg">
                      <video ref={videoRef} autoPlay playsInline className="h-40 w-40 rounded bg-zinc-90 w-full object-cover"></video>
                      <button
                        type="button"
                        onClick={() => captureSnapshot(true)}
                        className="mt-2.5 rounded bg-orange-600 hover:bg-orange-700 px-4 py-1.5 font-bold text-white text-[10px]"
                      >
                        Tomar Foto del Líder
                      </button>
                    </div>
                  )}

                  {responsablePhoto && (
                    <div className="sm:col-span-2 flex items-center space-x-3.5 border-t border-gray-200 pt-2 text-[10px] font-bold text-emerald-800">
                      <img src={responsablePhoto} alt="R" className="h-10 w-10 rounded-full object-cover border" />
                      <span>✓ Captura guardada de manera local.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección C: Integrantes dinámicos */}
              <div className="space-y-4">
                <h4 className="font-bold text-orange-700 text-xs uppercase tracking-wide flex justify-between">
                  <span>3. Carga de Lista de Atletas / Contingente</span>
                  <span className="text-zinc-500 font-bold bg-gray-105 rounded px-2 text-[11px]">{integrantes.length} Cargados</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end bg-gray-50 border p-3 rounded-xl">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Nombre</label>
                    <input
                      type="text"
                      value={nuevoIntegrante.nombre}
                      onChange={(e) => setNuevoIntegrante({ ...nuevoIntegrante, nombre: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Apellido</label>
                    <input
                      type="text"
                      value={nuevoIntegrante.apellido}
                      onChange={(e) => setNuevoIntegrante({ ...nuevoIntegrante, apellido: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">DNI (sin puntos)</label>
                    <input
                      type="text"
                      value={nuevoIntegrante.dni}
                      onChange={(e) => setNuevoIntegrante({ ...nuevoIntegrante, dni: e.target.value.replace(/\D/g, '') })}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={nuevoIntegrante.tipo}
                      onChange={(e) => setNuevoIntegrante({ ...nuevoIntegrante, tipo: e.target.value as any })}
                      className="rounded-lg border border-gray-200 bg-white px-1 py-1.5 text-slate-800 flex-1"
                    >
                      <option value="Deportista">Deportista</option>
                      <option value="Acompañante">Acompañante</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAgregarIntegrante}
                      className="rounded-lg bg-orange-650 hover:bg-orange-750 text-white font-extrabold px-3 py-1.5 text-xs transition shrink-0"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Grilla visual integrante list */}
                {integrantes.length > 0 && (
                  <div className="rounded-xl border max-h-40 overflow-y-auto divide-y divide-gray-100 p-1">
                    {integrantes.map((int, index) => (
                      <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 text-[11px]">
                        <div>
                          <span className="font-extrabold text-zinc-900">{int.nombre} {int.apellido}</span>
                          <span className="text-[10px] text-gray-400 ml-2">DNI {int.dni}</span>
                          <span className="text-[9px] text-[#2C5F2D] font-extrabold uppercase border border-emerald-100 rounded px-1.5 py-0.5 ml-2.5">
                            {int.tipo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoverIntegrante(index)}
                          className="text-red-650 hover:text-red-800 rounded font-semibold text-[10px]"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Aceptar Términos */}
              <div className="flex items-start space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="acepta-term-group"
                  required
                  checked={delegacionForm.aceptaTerminos}
                  onChange={(e) => setDelegacionForm({ ...delegacionForm, aceptaTerminos: e.target.checked })}
                  className="rounded border-gray-300 mt-1 focus:ring-orange-550"
                />
                <label htmlFor="acepta-term-group" className="text-[10px] leading-tight text-gray-500 font-semibold">
                  Como Responsable Deportivo civil acreditado, declaro que la lista de atletas posee aptitud física certificada 2026 para prácticas intensas en el centro atlético Paraná Enrique Berduc.
                </label>
              </div>

              {/* Botón enviar delegación */}
              <div className="pt-4 flex justify-end gap-3.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowGroupRegister(false); stopCamera(); }}
                  className="rounded-lg bg-gray-105 hover:bg-gray-200 px-4 py-2 font-bold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!delegacionForm.aceptaTerminos}
                  className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-6 py-2 shadow disabled:bg-gray-205 cursor-pointer"
                  id="group-register-submit-btn"
                >
                  Registrar Delegación Completa
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* SECCIÓN INTEGRADORA DE ESCANER DNI */}
      {showDniScanner && (
        <DniScanner
          onScanSuccess={handleDniScanSuccess}
          onClose={() => setShowDniScanner(false)}
        />
      )}

      {/* SECCIÓN PASE RESULTANTE QR MODAL */}
      {generatedVisitor && (
        <QrModal
          visitante={generatedVisitor}
          onClose={() => setGeneratedVisitor(null)}
        />
      )}


      {/* ======================================================== */}
      {/* PIE DE PÁGINA (COPYRIGHTS) */}
      <footer className="bg-zinc-950 text-gray-400 text-center py-6 border-t border-zinc-905 text-[11px] leading-relaxed">
        <p>© 2026 Parque Escolar Deportivo Enrique Berduc • Paraná, Entre Ríos, Argentina.</p>
        <p className="text-zinc-650 mt-1 uppercase font-semibold">Ministerio de Educación y Deportes de Entre Ríos</p>
      </footer>

        </div> {/* fin de middle-scrollable-content */}
      </div> {/* fin de CONTENEDOR CENTRAL */}

      {/* ==================== PANEL DETALLE TURNERA COLUMNA DERECHA (Sleek Interface Turnera) ==================== */}
      <aside className="w-80 bg-white border-l border-slate-200 flex-col p-6 hidden lg:flex shrink-0 h-full overflow-y-auto justify-between">
        <div className="space-y-6">
          <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="h-4.5 w-4.5 text-[#5FA8D3]" />
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-800">Reserva de Turnos</span>
          </h4>

          {/* Deporte */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Seleccionar Deporte</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SPORTS_DATA.slice(0, 6).map((sp) => {
                const iconMapping: { [key: string]: string } = {
                  atletismo: '🏃',
                  futbol: '⚽',
                  natacion: '🏊',
                  padel: '🎾',
                  voley: '🏐',
                  musculacion: '🏋️'
                };
                return (
                  <button
                    key={sp.id}
                    onClick={() => {
                      setSelectedSportId(sp.id);
                      setSelectedHourSlot('');
                    }}
                    title={sp.name}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-lg border transition-all duration-150 relative cursor-pointer ${
                      selectedSportId === sp.id
                        ? 'bg-[#2C5F2D] text-white border-[#2C5F2D] shadow-md scale-95 font-bold'
                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 hover:text-[#2C5F2D]'
                    }`}
                  >
                    <span className="text-[15px]">{iconMapping[sp.id] || '🏟️'}</span>
                    <span className="text-[8px] font-bold tracking-tight mt-1 capitalize truncate max-w-[50px]">
                      {sp.name.split(' ')[0]}
                    </span>
                    {selectedSportId === sp.id && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#E07A5F] rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Disponibilidad</label>
            <input
              type="date"
              value={bookingDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setBookingDate(e.target.value);
                setSelectedHourSlot('');
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-[#2C5F2D]"
            />
            <p className="text-[10px] font-bold text-slate-500 text-right">
              {formatDateReadable(bookingDate)}
            </p>
          </div>

          {/* Horas */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Elegir Horario</label>
            {activeSlotsDisponibles.length === 0 ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-center">
                <p className="text-[11px] font-bold text-amber-900 leading-tight">No quedan turnos libres</p>
                <p className="text-[8px] text-amber-700 mt-0.5 leading-tight">Domingos cerrado. Sábados cerrado de tarde.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {activeSlotsDisponibles.map((slot) => (
                  <button
                    key={slot.raw}
                    type="button"
                    onClick={() => setSelectedHourSlot(slot.raw)}
                    className={`rounded-lg py-1.8 text-[11px] font-bold border transition text-center cursor-pointer ${
                      selectedHourSlot === slot.raw
                        ? 'bg-[#E07A5F] text-white border-[#E07A5F]'
                        : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-350'
                    }`}
                  >
                    {slot.raw}hs
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Slot de recordatorio */}
          <div className="p-4 bg-[#5FA8D3]/10 rounded-xl border border-[#5FA8D3]/20 text-[11px]">
            <p className="text-[10px] text-[#5FA8D3] font-bold uppercase mb-1">Destino de Reserva</p>
            <p className="font-extrabold text-slate-705">
              {SPORTS_DATA.find(s => s.id === selectedSportId)?.name || 'Cancha General'}
            </p>
            <p className="text-[9px] text-slate-500 mt-0.5">Gestión de Turnera • Año 2026</p>
          </div>
        </div>

        {/* Botón */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          {!userPanelLoggedUser && selectedHourSlot && (
            <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 p-2 rounded-lg font-semibold leading-normal">
              ⚠️ Abrí sesión o registrate para reservar.
            </p>
          )}
          <button
            onClick={() => {
              if (!selectedHourSlot) {
                alert('Por favor, elija primero una hora disponible.');
                return;
              }
              abrirModalReserva();
            }}
            className={`w-full py-2.5 bg-[#2C5F2D] hover:bg-[#1f4220] text-white rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer ${
              !selectedHourSlot ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {!userPanelLoggedUser ? 'Iniciar Sesión / Registrate acá' : 'Confirmar Reserva'}
            </span>
          </button>
        </div>
      </aside>

      {/* Custom Delete Account Confirmation Modal */}
      {deleteAccountConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 rounded-full text-rose-600 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  Eliminar mi Cuenta Permanentemente
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ⚠️ <strong>ADVERTENCIA:</strong> ¿Estás seguro de que deseas eliminar tu cuenta permanentemente? Se borrarán todos tus datos personales, credenciales de acceso y ya no podrás reservar turnos. Esta acción no se puede deshacer de ninguna manera.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteAccountConfirmOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminarMiCuenta}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition duration-150 shadow-sm hover:shadow-md cursor-pointer"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT BUBBLE FLOTANTE */}
      <div 
        onClick={() => {
          setIsSidebarOpen(true);
          alert('¡Soporte del Parque Enrique Berduc!\nPóngase en contacto virtual por mesa de entrada: parqueberduc@entrerios.edu.ar');
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#2C5F2D] rounded-full flex items-center justify-center text-white shadow-xl cursor-pointer hover:scale-105 transition-transform z-40"
      >
        <span className="text-2xl">💬</span>
      </div>

    </div>
  );
}

// FORMATO DE REGLA TURNERA LEIBLE COMPLETO REQUERIDO: "Lunes 8 de Junio 15:30hs"
function getReadableDateTimeString(diaString: string, horaString: string): string {
  if (!diaString) return '';
  const [año, mes, dia] = diaString.split('-').map(Number);
  const f = new Date(año, mes - 1, dia);

  const diasTrad: { [key: number]: string } = {
    0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado'
  };
  const mesesTrad: { [key: number]: string } = {
    0: 'Enero', 1: 'Febrero', 2: 'Marzo', 3: 'Abril', 4: 'Mayo', 5: 'Junio', 
    6: 'Julio', 7: 'Agosto', 8: 'Septiembre', 9: 'Octubre', 10: 'Noviembre', 11: 'Diciembre'
  };

  const nombreDia = diasTrad[f.getDay()] || 'Lunes';
  const nombreMes = mesesTrad[f.getMonth()] || 'Junio';

  return `${nombreDia} ${dia} de ${nombreMes} ${horaString}hs`;
}

// FORMATO DE REGISTRO RÁPIDO DÍA-MES
function formatDateReadable(fechaString: string): string {
  if (!fechaString) return '';
  const [año, mes, dia] = fechaString.split('-').map(Number);
  const f = new Date(año, mes - 1, dia);
  const diasS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const mesesS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${diasS[f.getDay()]} ${dia} de ${mesesS[f.getMonth()]}`;
}
