/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SportInfo {
  id: string;
  name: string;
  slug: string;
  icon: string; // FontAwesome class or Lucide icon name
  badge?: string;
  bannerImage: string;
  description: string;
  historiaProvincial: string;
  destacados: { nombre: string; logro: string }[];
  horarios: { categoria: string; dias: string; horario: string }[];
}

export const SPORTS_DATA: SportInfo[] = [
  {
    id: 'atletismo',
    name: 'Pista de Atletismo',
    slug: 'atletismo',
    icon: 'Flame',
    badge: 'En construcción 2026',
    bannerImage: 'https://images.unsplash.com/photo-1508612761958-e931d843bdd5?q=80&w=800&auto=format&fit=crop',
    description: 'La pista de atletismo del Parque Berduc, actualmente en remodelación para convertirse en una pista olímpica de alto nivel con 6 carriles reglamentarios, es histórica en Entre Ríos.',
    historiaProvincial: 'Entre Ríos es cuna de enormes saltadores, lanzadores y velocistas en Argentina. El Parque Berduc ha sido desde 1929 el núcleo central del atletismo de la provincia, hospedando campeonatos intercolegiales y provinciales que impulsaron a atletas a representar a la Selección Nacional. El atletismo entrerriano destaca por su compromiso social, sirviendo como deporte de integración e inclusión en Paraná.',
    destacados: [
      { nombre: 'Germán Lauro', logro: 'Finalista histórico en lanzamiento de bala en los Juegos Olímpicos de Londres 2012. Entrenó recurrentemente y compitió en la pista del Berduc.' },
      { nombre: 'Nazareno Sasia', logro: 'Medallista de Oro en Lanzamiento de Bala en los Juegos Olímpicos de la Juventud Buenos Aires 2018. Oriundo de Cerrito, Entre Ríos, tiene al Berduc como su centro de referencia provincial.' },
      { nombre: 'Joaquín Gómez', logro: 'Especialista en lanzamiento de martillo, múltiple campeón argentino y sudamericano participante en torneos homenaje en Paraná.' }
    ],
    horarios: [
      { categoria: 'Iniciación Atlética (6-12 años)', dias: 'Lunes, Miércoles y Viernes', horario: '14:30 a 16:00 hs' },
      { categoria: 'Desarrollo Juveniles U16-U18', dias: 'Lunes a Viernes', horario: '16:00 a 18:00 hs' },
      { categoria: 'Alto Rendimiento y Elite', dias: 'Lunes a Sábado', horario: '18:00 a 20:30 hs' },
      { categoria: 'Adultos / Corredores Recreativos', dias: 'Lunes a Viernes', horario: '19:00 a 21:30 hs' }
    ]
  },
  {
    id: 'futbol',
    name: 'Campo Fútbol/Rugby',
    slug: 'futbol',
    icon: 'Trophy',
    bannerImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop',
    description: 'Imponente predio de césped natural adaptado para el desarrollo técnico del fútbol escolar, fútbol amateur y entrenamientos tácticos de rugby en el centro de Paraná.',
    historiaProvincial: 'La provincia de Entre Ríos respira fútbol en cada rincón, habiendo aportado grandes figuras a los clubes de primera división y a la Selección Nacional, como los subcampeones mundiales Roberto Ayala y Gabriel Heinze. El campo del Berduc ha servido como cancha escolar primaria de la ciudad, uniendo la educación pública con la formación física y semilleros de la liga local.',
    destacados: [
      { nombre: 'Lautaro Geminiani', logro: 'Histórico defensor y capitán del Club Atlético Patronato (campeón de Copa Argentina) que realizó pruebas físicas infantiles en este predio.' },
      { nombre: 'Marcos Gelabert', logro: 'Destacadísimo mediocampista entrerriano con amplia trayectoria nacional e internacional surgido del fútbol departamental de Paraná.' }
    ],
    horarios: [
      { categoria: 'Fútbol Infantil Escolar (Categorías 2015-2020)', dias: 'Lunes y Miércoles', horario: '15:00 a 16:30 hs' },
      { categoria: 'Fútbol Juvenil (Sub-15 y Sub-17)', dias: 'Lunes, Miércoles y Viernes', horario: '17:00 a 19:00 hs' },
      { categoria: 'Rugby Juvenil Paraná (Formación)', dias: 'Martes y Jueves', horario: '16:30 a 18:30 hs' },
      { categoria: 'Fútbol Femenino Recreativo', dias: 'Martes y Jueves', horario: '18:30 a 20:00 hs' }
    ]
  },
  {
    id: 'natacion',
    name: 'Pileta Natación',
    slug: 'natacion',
    icon: 'Droplets',
    bannerImage: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=800&auto=format&fit=crop',
    description: 'La pileta olímpica del Parque Berduc es una de las joyas de Paraná. Excelente temperatura, climatización e infraestructura para natación recreativa, formativa y federada.',
    historiaProvincial: 'Con los imponentes ríos Paraná y Uruguay bordeando el territorio entrerriano, la natación es un deporte de supervivencia y competencia sumamente destacado en la provincia, reflejado en la icónica maratón internacional Hernandarias-Paraná. El vaso olímpico del Berduc ha sido la incubadora de nadadores que perdieron el miedo al agua y completaron travesías fluviales emblemáticas.',
    destacados: [
      { nombre: 'Federico Grabich', logro: 'Medallista de bronce en el mundial de Kazan 2015 y campeón panamericano. Frecuentó la ciudad en torneos de invierno.' },
      { nombre: 'Julia Sebastián', logro: 'Nadadora olímpica en Río 2016 y Tokio 2020, múltiple recordista sudamericana que entrenó en las piletas de la región mesopotámica.' }
    ],
    horarios: [
      { categoria: 'Ambientación y Matronatación', dias: 'Lunes y Miércoles', horario: '14:00 a 15:00 hs' },
      { categoria: 'Escuela Infantil de Natación', dias: 'Lunes a Viernes', horario: '15:00 a 17:00 hs' },
      { categoria: 'Adultos Libre y Recreativo', dias: 'Lunes a Viernes', horario: '12:00 a 14:00 y 19:00 a 21:00 hs' },
      { categoria: 'Plantel de Competición / Federados', dias: 'Lunes a Sábado', horario: '17:00 a 19:30 hs' }
    ]
  },
  {
    id: 'voley',
    name: 'Vóley (techado)',
    slug: 'voley',
    icon: 'Sparkles',
    bannerImage: 'https://images.unsplash.com/photo-1547347298-4074fc302d51?q=80&w=800&auto=format&fit=crop',
    description: 'Gimnasio cerrado con superficie de parquet de madera flotante, excelente iluminación y medidas oficiales para disputar encuentros profesionales de vóley de primera división.',
    historiaProvincial: 'Vóley entrerriano es sinónimo de elite nacional. Escuelas municipales y clubes de la provincia han aportado estrellas internacionales. El gimnasio del Berduc alberga finales de la Asociación Paranaense de Vóleibol (APV) y constantes campus enfocados en jóvenes promesas locales.',
    destacados: [
      { nombre: 'Selección Entrerriana', logro: 'Múltiple campeona de los torneos nacionales de selecciones provinciales sub-16 y sub-18, con base de jugadoras entrenadas en Paraná.' },
      { nombre: 'Lucas Ocampo', logro: 'Destacadísimo receptor punta de Liga Nacional y Selección Argentina con participación regular en clínicas del Parque Berduc.' }
    ],
    horarios: [
      { categoria: 'Mini Vóley (Niños de 8 a 12 años)', dias: 'Martes y Jueves', horario: '14:30 a 16:00 hs' },
      { categoria: 'Sub-14 y Sub-16 Masculino/Femenino', dias: 'Lunes, Miércoles y Viernes', horario: '16:00 a 18:00 hs' },
      { categoria: 'Mayores APV y Competición', dias: 'Lunes, Miércoles y Viernes', horario: '18:30 a 20:30 hs' },
      { categoria: 'Maxivóley Recreativo Mixto', dias: 'Sábados', horario: '10:00 a 13:00 hs' }
    ]
  },
  {
    id: 'padel',
    name: 'Pádel profesional',
    slug: 'padel',
    icon: 'Activity',
    badge: 'Profesores disponibles',
    bannerImage: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop',
    description: 'Dos flamantes canchas profesionales de pádel de césped sintético y paredes de vidrio templado. El deporte rey del parque con amplios horarios y turnos nocturnos.',
    historiaProvincial: 'El pádel experimenta un resurgimiento masivo en Entre Ríos, y Paraná es una plaza estratégica con cientos de practicantes semanales. Las pistas del Berduc ofrecen la mejor alternativa pública-cooperativa, garantizando canchas de nivel profesional a tarifas accesibles para toda la comunidad entrerriana.',
    destacados: [
      { nombre: 'Federico Chingotto', logro: 'Jugador top mundial de Premier Padel que ha impulsado clínicas de exhibición formativas en el interior entrerriano.' },
      { nombre: 'Ramiro Moyano', logro: 'Elite argentina del pádel internacional, disertante de charlas sobre preparación técnica que visitó el predio del Berduc.' }
    ],
    horarios: [
      { categoria: 'Escuelita de Menores / Iniciación', dias: 'Martes y Jueves', horario: '14:00 a 16:00 hs' },
      { categoria: 'Clases Particulares Gruperas', dias: 'Lunes a Viernes', horario: '16:00 a 18:00 hs' },
      { categoria: 'Turnos Libres Alquilados', dias: 'Lunes a Domingo', horario: '14:00 a 00:00 hs (turnos cada 1.5 horas)' }
    ]
  },
  {
    id: 'basquet',
    name: 'Básquetbol',
    slug: 'basquet',
    icon: 'Target',
    bannerImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
    description: 'Equipado con tableros de cristal templado, aros rebatibles profesionales y una espectacular cancha de madera flotante homologada por la liga nacional.',
    historiaProvincial: 'Entre Ríos es tierra de básquet, con una rica historia liderada por Centro Juventud Sionista, Echagüe y Estudiantes de Concordia. En el Berduc se fomenta el juego limpio escolar, funcionando como puente formativo donde los estudiantes de Paraná descubren el amor por el balón naranja y el trabajo en equipo bajo la tutela de entrenadores históricos.',
    destacados: [
      { nombre: 'Marcos Delía', logro: 'Pivote titular de la Generación Plateada subcampeona del mundo en China 2019, participante en entrenamientos en Entre Ríos.' },
      { nombre: 'Selem Safar', logro: 'Destacadísimo escolta goleador de la Selección Nacional, quien impartió clínicas de tiro específicas en Paraná.' }
    ],
    horarios: [
      { categoria: 'Cebollitas y Pre-Mini (6-10 años)', dias: 'Lunes, Miércoles y Viernes', horario: '14:00 a 15:30 hs' },
      { categoria: 'Cachorros y Sub-13 Formativo', dias: 'Lunes y Miércoles', horario: '15:30 a 17:00 hs' },
      { categoria: 'Sub-15 y Sub-17 Competitivo APB', dias: 'Martes y Jueves', horario: '17:00 a 19:00 hs' },
      { categoria: 'Básquet Recreativo Adultos', dias: 'Lunes y Miércoles', horario: '20:30 a 22:00 hs' }
    ]
  },
  {
    id: 'handball',
    name: 'Balonmano (Handball)',
    slug: 'handball',
    icon: 'Shield',
    bannerImage: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop',
    description: 'Cancha con trazado oficial y arcos reglamentarios de handball metálicos, óptima fricción y excelente espacio perimetral de seguridad para la práctica de balonmano de alta velocidad.',
    historiaProvincial: 'La Federación Entrerriana de Handball (FEH) organiza periódicamente sus finales anuales de copa en las instalaciones del gimnasio cubierto del Berduc. Este espacio promueve el desarrollo de este deporte táctico, con fuerte arraigo escolar en las escuelas secundarias de Paraná, convocando cientos de jóvenes en competencias intercolegiales anuales.',
    destacados: [
      { nombre: 'Selección Entrerriana Femenina', logro: 'Reconocida actuación nacional sumando múltiples medallas en torneos de provincias afiliadas a la CAH.' },
      { nombre: 'Lucas Moscariello', logro: 'Gladiador olímpico argentino, pivote internacional que auspició de referente técnico para la FEH en clínicas en Paraná.' }
    ],
    horarios: [
      { categoria: 'Pre-Infantiles e Infantiles Handball', dias: 'Martes y Jueves', horario: '14:00 a 15:30 hs' },
      { categoria: 'Cadetes y Juveniles Competitivo', dias: 'Martes y Jueves', horario: '15:30 a 17:30 hs' },
      { categoria: 'Primera Femenina y Masculina (FEH)', dias: 'Lunes, Miércoles y Viernes', horario: '19:30 a 21:30 hs' }
    ]
  },
  {
    id: 'musculacion',
    name: 'Gimnasio Musculación',
    slug: 'musculacion',
    icon: 'Gauge',
    bannerImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
    description: 'Sala de pesas moderna equipada con mancuernas de alta densidad, bancos de press olímpicos, jaulas de sentadillas, poleas dobles regulables y asesoramiento personalizado.',
    historiaProvincial: 'La preparación física de la fuerza ha evolucionado en Entre Ríos, pasando de ser exclusiva de culturistas a ser un componente preventivo indispensable para toda la población. El gimnasio de musculación del Berduc brinda una alternativa de salud pública de calidad, permitiendo recuperar lesiones y mejorar la condición de los deportistas locales.',
    destacados: [
      { nombre: 'Daniela Martínez', logro: 'Coordinadora de preparación física del Berduc, entrenadora certificada en entrenamientos olímpicos de potencia y fuerza.' }
    ],
    horarios: [
      { categoria: 'Turno Mañana Salud y Recreación', dias: 'Lunes a Viernes', horario: '08:00 a 12:00 hs' },
      { categoria: 'Turno Tarde Musculación Deportiva', dias: 'Lunes a Viernes', horario: '14:00 a 22:00 hs' },
      { categoria: 'Entrenamiento Olímpico de Fuerza', dias: 'Sábados', horario: '09:00 a 13:00 hs' }
    ]
  },
  {
    id: 'playon',
    name: 'Playón Polideportivo',
    slug: 'playon',
    icon: 'Layers',
    bannerImage: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?q=80&w=800&auto=format&fit=crop',
    description: 'Área abierta multiuso al aire libre con múltiples aros y arcos integrados. Espacio ideal para calentamientos, patín recreativo, gimnasia para adultos mayores y actividades libres.',
    historiaProvincial: 'Los playones compartidos son el alma integradora de los clubes comunitarios de Entre Ríos. En el Parque Berduc, el playón representa el espacio donde la recreación libre es 100% democrática. Familias paranaenses se reúnen semanalmente para actividades integradoras, ejercicio saludable y recreación sana en un entorno seguro.',
    destacados: [
      { nombre: 'Comunidad Senior Paranaense', logro: 'Referente del programa Berduc Activo, con más de 150 abuelos y abuelas participando mensualmente de clases de gimnasia funcional.' }
    ],
    horarios: [
      { categoria: 'Gimnasia Integral Adultos Mayores', dias: 'Lunes, Miércoles y Viernes', horario: '08:30 a 10:00 hs' },
      { categoria: 'Patín Recreativo y Artístico Iniciador', dias: 'Martes y Jueves', horario: '16:00 a 18:00 hs' },
      { categoria: 'Recreación Libre Familiar', dias: 'Sábados y Domingos', horario: '14:00 a 20:00 hs' }
    ]
  }
];
