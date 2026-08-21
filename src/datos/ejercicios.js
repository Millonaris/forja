/*
 * FORJA · Catálogo de ejercicios del plan de gimnasio.
 *
 * Plan de especialización (12 semanas, revisión del entrenador ago-2026):
 * la prioridad estética es DELTOIDE LATERAL + DORSAL + ESPALDA ALTA. Por eso
 * las elevaciones laterales van en las CUATRO sesiones (y pronto en el orden),
 * hay pullover en los días de pierna para sumar dorsal sin otro remo pesado,
 * y el pecho se queda en volumen de mantenimiento. Todo en máquina o polea:
 * la evidencia no premia los pesos libres y aquí se progresa más cómodo.
 *
 * 4 sesiones en rotación continua T-P-T-P sobre 3 días por semana (L-X-V),
 * así que la misma sesión NO cae siempre en el mismo día de la semana.
 *
 * Sóleo y tibial se mantienen en los días de pierna AUNQUE el plan nuevo no
 * los lista: son la fuerza protectora que pide el plan de carrera (espinillas)
 * y cuestan poco. El core va al final de los días de pierna, como pide el plan.
 *
 * Es UNA sola rutina (no hay versión "Light" aparte): durante la rampa de
 * vuelta (26-ago a 1-sep) solo baja la dosis — seriesLight (4→3, 3→2) y
 * RIR ~3 — y desde el 2-sep se hace el volumen completo.
 *
 * tipo:
 *   "reps"      → series de repeticiones normales
 *   "reps_lado" → repeticiones por lado (se anota el total de un lado)
 *   "tiempo"    → series medidas en segundos (plancha, sujeciones…)
 *
 * aislado: descanso corto (90-120 s). Sin él, descanso de grande (2-3 min).
 * musculos / secundarios: para el recuento de series semanales por músculo.
 * Los principales cuentan una serie entera; los secundarios, media.
 */

/** Los 4 nombres de sesión, en el orden exacto de la rotación. */
export const NOMBRES_SESION = ["TORSO A", "PIERNA A", "TORSO B", "PIERNA B"];

/** Devuelve true si la sesión es de tren inferior (para avisos de interferencia). */
export const esSesionPierna = (nombre) => nombre.startsWith("PIERNA");

// Atajo para no repetir la forma del objeto en cada ejercicio.
const ej = (id, sessionName, order, name, dosis, opciones = {}) => ({
  id,
  sessionName,
  order,
  name,
  doseText: dosis,
  superset: opciones.ss ?? null,
  series: opciones.series,
  repMin: opciones.min,
  repMax: opciones.max,
  tipo: opciones.tipo ?? "reps",
  // Series durante la rampa de vuelta (26-ago a 1-sep): 75-80 % del volumen.
  seriesLight: opciones.light ?? opciones.series,
  musculos: opciones.mus ?? [],
  secundarios: opciones.sec ?? [],
  // ⭐ del plan: la especialización (laterales, pullover, hombro posterior) y
  // la protección de la carrera (sóleo, tibial). Si se salta uno, la app lo dice.
  prioritario: opciones.estrella ?? false,
  // Aislado = descanso corto. Los grandes descansan 2-3 min sin prisa.
  aislado: opciones.aislado ?? false,
  // Cómo se hace, no solo cuánto. Se enseña durante el entreno.
  tecnica: opciones.tecnica ?? null,
  // Indicación para la última serie (RIR 0-1, parciales…).
  ultimaSerie: opciones.ultima ?? null,
});

/** Recordatorio de técnica que vale para toda la sesión. */
export const TECNICA_GENERAL =
  "Cuello largo en todo. No saques barriga para mover más peso: si hay que arquearse, sobra peso.";

const ULTIMA_AISLADO = "Última serie: RIR 0-1. Puedes llegar al fallo técnico, no siempre.";

export const EJERCICIOS = [
  // ---------------- TORSO A · anchura (dorsal + hombro lateral) ----------------
  ej("a1", "TORSO A", 1, "Jalón al pecho (máquina o polea)", "3×8-12", { series: 3, light: 2, min: 8, max: 12, tecnica: "Agarre cómodo, medio o neutro: baja bien los codos. El ultraancho no ensancha más.", mus: ["dorsal"], sec: ["biceps"] }),
  ej("a2", "TORSO A", 2, "Elevación lateral en máquina", "4×12-20", { series: 4, light: 3, min: 12, max: 20, estrella: true, aislado: true, tecnica: "Va la segunda a propósito: es tu prioridad nº1 y aquí progresas más.", ultima: ULTIMA_AISLADO, mus: ["hombroLateral"] }),
  ej("a3", "TORSO A", 3, "Press inclinado en máquina", "3×8-12", { series: 3, light: 2, min: 8, max: 12, mus: ["pecho"], sec: ["hombroAnterior", "triceps"] }),
  ej("a4", "TORSO A", 4, "Remo con pecho apoyado", "3×8-12", { series: 3, light: 2, min: 8, max: 12, tecnica: "Pecho pegado al apoyo y pausa de 1-2 s arriba.", mus: ["dorsal", "trapecio"], sec: ["biceps", "hombroPosterior"] }),
  ej("a5", "TORSO A", 5, "Press de hombro en máquina", "2×8-12", { series: 2, min: 8, max: 12, tecnica: "Solo 2 series: el hombro anterior ya cobra bastante de los presses de pecho.", mus: ["hombroAnterior"], sec: ["triceps"] }),
  ej("a6", "TORSO A", 6, "Reverse pec deck", "2×12-20", { series: 2, min: 12, max: 20, estrella: true, aislado: true, ultima: ULTIMA_AISLADO, mus: ["hombroPosterior"], sec: ["trapecio"] }),
  ej("a7", "TORSO A", 7, "Curl de bíceps (máquina o polea)", "2×10-15", { series: 2, min: 10, max: 15, aislado: true, ultima: ULTIMA_AISLADO, mus: ["biceps"] }),
  ej("a8", "TORSO A", 8, "Tríceps en polea", "2×10-15", { series: 2, min: 10, max: 15, aislado: true, ultima: ULTIMA_AISLADO, mus: ["triceps"] }),

  // ---------------- PIERNA A ----------------
  ej("c1", "PIERNA A", 1, "Hack squat en máquina", "3×8-12", { series: 3, light: 2, min: 8, max: 12, mus: ["cuadriceps", "gluteo"] }),
  ej("c2", "PIERNA A", 2, "Prensa", "2×10-15", { series: 2, min: 10, max: 15, mus: ["cuadriceps"], sec: ["gluteo"] }),
  ej("c3", "PIERNA A", 3, "Curl femoral sentado", "3×10-15", { series: 3, light: 2, min: 10, max: 15, mus: ["isquios"] }),
  ej("c4", "PIERNA A", 4, "Extensión de cuádriceps", "2×10-15", { series: 2, min: 10, max: 15, aislado: true, mus: ["cuadriceps"] }),
  ej("c5", "PIERNA A", 5, "Hip thrust en máquina", "2×8-12", { series: 2, min: 8, max: 12, mus: ["gluteo"], sec: ["isquios"] }),
  ej("c6", "PIERNA A", 6, "Gemelos en máquina", "3×10-20", { series: 3, light: 2, min: 10, max: 20, aislado: true, tecnica: "Rodilla recta: trabaja el gemelo.", mus: ["gemelo"] }),
  // Fuerza protectora del plan de carrera: sóleo y tibial blindan la espinilla.
  ej("c7", "PIERNA A", 7, "Sóleo (gemelo sentado)", "3×12-15", { series: 3, light: 2, min: 12, max: 15, estrella: true, aislado: true, tecnica: "Rodilla flexionada: el sóleo absorbe el impacto de correr.", mus: ["gemelo"] }),
  ej("c8", "PIERNA A", 8, "Tibial anterior", "2×15-20", { series: 2, min: 15, max: 20, estrella: true, aislado: true, tecnica: "Talones en el suelo y sube las puntas. El seguro contra la periostitis.", mus: ["tibial"] }),
  // Mini-bloque de especialización: reparte el volumen prioritario sin inflar los torsos.
  ej("c9", "PIERNA A", 9, "Elevación lateral en máquina", "3×12-20", { series: 3, light: 2, min: 12, max: 20, estrella: true, aislado: true, ultima: ULTIMA_AISLADO, mus: ["hombroLateral"] }),
  ej("c10", "PIERNA A", 10, "Pullover (máquina o polea)", "2×10-15", { series: 2, min: 10, max: 15, estrella: true, aislado: true, tecnica: "Estable y poco fatigante: dorsal directo sin meter otro remo pesado.", mus: ["dorsal"] }),
  // Core al final, como pide el plan: pequeño, no otro entrenamiento.
  ej("c11", "PIERNA A", 11, "Dead bug", "2×8/lado", { series: 2, min: 8, max: 8, tipo: "reps_lado", aislado: true, mus: ["core"] }),
  ej("c12", "PIERNA A", 12, "Plancha lateral", "2×20-30 s/lado", { series: 2, min: 20, max: 30, tipo: "tiempo", aislado: true, tecnica: "Cada serie son los dos lados: 20-30 s por lado.", mus: ["core"] }),

  // ---------------- TORSO B · la V + espalda gruesa ----------------
  ej("b1", "TORSO B", 1, "Press plano en máquina", "3×8-12", { series: 3, light: 2, min: 8, max: 12, mus: ["pecho"], sec: ["hombroAnterior", "triceps"] }),
  ej("b2", "TORSO B", 2, "Elevación lateral en máquina", "4×12-20", { series: 4, light: 3, min: 12, max: 20, estrella: true, aislado: true, tecnica: "Va la segunda a propósito: es tu prioridad nº1 y aquí progresas más.", ultima: ULTIMA_AISLADO, mus: ["hombroLateral"] }),
  ej("b3", "TORSO B", 3, "Jalón agarre neutro o medio", "3×8-12", { series: 3, light: 2, min: 8, max: 12, tecnica: "Agarre cómodo que deje bajar los codos y dar recorrido.", mus: ["dorsal"], sec: ["biceps"] }),
  ej("b4", "TORSO B", 4, "High row / remo con pecho apoyado", "3×8-12", { series: 3, light: 2, min: 8, max: 12, tecnica: "Pausa de 1-2 s con las escápulas juntas.", mus: ["dorsal", "trapecio"], sec: ["hombroPosterior", "biceps"] }),
  ej("b5", "TORSO B", 5, "Pec deck", "2×10-15", { series: 2, min: 10, max: 15, aislado: true, mus: ["pecho"] }),
  ej("b6", "TORSO B", 6, "Reverse pec deck", "2×12-20", { series: 2, min: 12, max: 20, estrella: true, aislado: true, ultima: ULTIMA_AISLADO, mus: ["hombroPosterior"], sec: ["trapecio"] }),
  ej("b7", "TORSO B", 7, "Curl de bíceps", "2×10-15", { series: 2, min: 10, max: 15, aislado: true, ultima: ULTIMA_AISLADO, mus: ["biceps"] }),
  ej("b8", "TORSO B", 8, "Tríceps sobre cabeza en polea", "2×10-15", { series: 2, min: 10, max: 15, aislado: true, ultima: ULTIMA_AISLADO, mus: ["triceps"] }),

  // ---------------- PIERNA B ----------------
  ej("d1", "PIERNA B", 1, "Hip thrust en máquina", "3×8-12", { series: 3, light: 2, min: 8, max: 12, tecnica: "Primero del día, en fresco.", mus: ["gluteo"], sec: ["isquios"] }),
  ej("d2", "PIERNA B", 2, "Prensa", "3×8-12", { series: 3, light: 2, min: 8, max: 12, mus: ["cuadriceps"], sec: ["gluteo"] }),
  ej("d3", "PIERNA B", 3, "Curl femoral (sentado o tumbado)", "3×10-15", { series: 3, light: 2, min: 10, max: 15, mus: ["isquios"] }),
  ej("d4", "PIERNA B", 4, "Extensión de cuádriceps", "2×10-15", { series: 2, min: 10, max: 15, aislado: true, mus: ["cuadriceps"] }),
  ej("d5", "PIERNA B", 5, "Extensión 45° controlada", "2×10-15", { series: 2, min: 10, max: 15, aislado: true, tecnica: "Para al quedar alineado: no pases de ahí.", mus: ["lumbar"], sec: ["gluteo", "isquios"] }),
  ej("d6", "PIERNA B", 6, "Gemelos en máquina", "3×10-20", { series: 3, light: 2, min: 10, max: 20, aislado: true, tecnica: "Rodilla recta: trabaja el gemelo.", mus: ["gemelo"] }),
  // Fuerza protectora del plan de carrera: sóleo y tibial blindan la espinilla.
  ej("d7", "PIERNA B", 7, "Sóleo (gemelo sentado)", "3×12-15", { series: 3, light: 2, min: 12, max: 15, estrella: true, aislado: true, tecnica: "Rodilla flexionada: el sóleo absorbe el impacto de correr.", mus: ["gemelo"] }),
  ej("d8", "PIERNA B", 8, "Tibial anterior", "2×15-20", { series: 2, min: 15, max: 20, estrella: true, aislado: true, tecnica: "Talones en el suelo y sube las puntas. El seguro contra la periostitis.", mus: ["tibial"] }),
  // Mini-bloque de especialización, igual que en Pierna A.
  ej("d9", "PIERNA B", 9, "Elevación lateral en máquina", "3×12-20", { series: 3, light: 2, min: 12, max: 20, estrella: true, aislado: true, ultima: ULTIMA_AISLADO, mus: ["hombroLateral"] }),
  ej("d10", "PIERNA B", 10, "Pullover (máquina o polea)", "2×10-15", { series: 2, min: 10, max: 15, estrella: true, aislado: true, tecnica: "Estable y poco fatigante: dorsal directo sin meter otro remo pesado.", mus: ["dorsal"] }),
  // Core al final, como pide el plan.
  ej("d11", "PIERNA B", 11, "Pallof press", "2×10/lado", { series: 2, min: 10, max: 10, tipo: "reps_lado", aislado: true, mus: ["core"] }),
  ej("d12", "PIERNA B", 12, "Plancha lateral", "2×20-30 s/lado", { series: 2, min: 20, max: 30, tipo: "tiempo", aislado: true, tecnica: "Cada serie son los dos lados: 20-30 s por lado.", mus: ["core"] }),
];

/** Ejercicios de una sesión, ya ordenados. */
export function ejerciciosDe(sessionName) {
  return EJERCICIOS.filter((e) => e.sessionName === sessionName).sort((a, b) => a.order - b.order);
}

/** Búsqueda rápida por id, que se usa en todos los cálculos. */
export const EJERCICIOS_POR_ID = new Map(EJERCICIOS.map((e) => [e.id, e]));

/** Reglas de entreno que se recuerdan en pantalla. */
export const REGLAS_GYM = {
  rir: "Grandes: RIR 1-2 en todas las series. Aislados: última serie RIR 0-1.",
  descansoGrande: 150, // 2-3 min en los grandes: sin prisa entre series
  descansoAislado: 105, // 90-120 s en aislados
  descansoSuperserie: 90, // sin uso en el plan actual; queda por si vuelve
  incremento: 2.5, // kg que se sugieren al completar la doble progresión
  avisoPierna: "Antes de empezar: bisagra de cadera 2×8 para activar.",
  // Cuánto se baja la carga en una semana de descarga.
  descargaPorcentaje: 0.1,
};

/**
 * Repeticiones en recámara: lo que te quedaba al acabar la serie.
 * Es el dato que distingue "me he estancado porque estoy quemado" de
 * "me he estancado porque necesito otro estímulo" — sin él, el motor de
 * veredictos tiene que adivinar y se equivoca en la mitad de los casos.
 */
export const OPCIONES_RIR = [
  { valor: 0, etiqueta: "0-1", ayuda: "Al fallo o casi", color: "alerta" },
  { valor: 2, etiqueta: "2", ayuda: "En el punto", color: "ok" },
  { valor: 3, etiqueta: "3+", ayuda: "Me sobraba", color: "aviso" },
];
