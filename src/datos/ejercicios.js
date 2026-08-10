/*
 * FORJA · Catálogo de ejercicios del plan de gimnasio.
 *
 * 4 sesiones en rotación continua T-P-T-P sobre 3 días por semana (L-X-V),
 * así que la misma sesión NO cae siempre en el mismo día de la semana:
 *   L: Torso A · X: Pierna A · V: Torso B · L: Pierna B · X: Torso A · ...
 *
 * `dosis` es el texto que se enseña en pantalla; `series`, `repMin` y `repMax`
 * son la versión estructurada que usa el motor de doble progresión.
 *
 * tipo:
 *   "reps"      → series de repeticiones normales
 *   "reps_lado" → repeticiones por lado (se anota el total de un lado)
 *   "tiempo"    → series medidas en segundos (plancha, farmer carry, cobra…)
 *
 * superserie: los ejercicios con la misma letra dentro de una sesión se
 * alternan sin descanso entre ellos (60-90 s al terminar la ronda).
 *
 * musculos / secundarios: para el recuento de series semanales por músculo.
 * Los principales cuentan una serie entera; los secundarios, media.
 */

/** Los 4 nombres de sesión, en el orden exacto de la rotación. */
export const NOMBRES_SESION = ["TORSO A", "PIERNA A", "TORSO B", "PIERNA B"];

/** Devuelve true si la sesión es de tren inferior (para la regla de la tirada larga). */
export const esSesionPierna = (nombre) => nombre.startsWith("PIERNA");

// Atajo para no repetir la forma del objeto 8 veces por sesión.
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
  musculos: opciones.mus ?? [],
  secundarios: opciones.sec ?? [],
  // ⭐ del plan: los que sostienen la salud del hombro y la espalda. Si se
  // salta uno, la app lo dice — no son accesorios negociables.
  prioritario: opciones.estrella ?? false,
  // Cómo se hace, no solo cuánto. Se enseña durante el entreno.
  tecnica: opciones.tecnica ?? null,
  // Indicación para la última serie (parciales, fallo total…).
  ultimaSerie: opciones.ultima ?? null,
});

/** Recordatorio de técnica que vale para toda la sesión. */
export const TECNICA_GENERAL =
  "Cuello largo en todo. No saques barriga para mover más peso: si hay que arquearse, sobra peso.";

export const EJERCICIOS = [
  // ---------------- TORSO A ----------------
  ej("ta1", "TORSO A", 1, "Remo pecho apoyado agarre NEUTRO", "3×8-12", { series: 3, min: 8, max: 12, estrella: true, tecnica: "Pecho pegado al apoyo y pausa de 1-2 s arriba. Cada agarre lleva su propio registro.", mus: ["dorsal", "trapecio"], sec: ["biceps", "hombroPosterior"] }),
  ej("ta2", "TORSO A", 2, "Jalón neutro", "3×8-12", { series: 3, min: 8, max: 12, mus: ["dorsal"], sec: ["biceps"] }),
  ej("ta3", "TORSO A", 3, "Press inclinado", "3×6-10", { series: 3, min: 6, max: 10, tecnica: "Volumen moderado a propósito: no se sube el pecho por el tema del pezón.", mus: ["pecho"], sec: ["hombroAnterior", "triceps"] }),
  ej("ta4", "TORSO A", 4, "Laterales mancuerna", "4×12-20", { series: 4, min: 12, max: 20, ss: "A", ultima: "Última serie: parciales hasta quemar.", mus: ["hombroLateral"] }),
  ej("ta5", "TORSO A", 5, "Reverse pec deck", "3×12-20", { series: 3, min: 12, max: 20, ss: "A", estrella: true, mus: ["hombroPosterior"], sec: ["trapecio"] }),
  ej("ta6", "TORSO A", 6, "Face pull", "2×15-20", { series: 2, min: 15, max: 20, ss: "B", estrella: true, mus: ["hombroPosterior"], sec: ["trapecio"] }),
  ej("ta7", "TORSO A", 7, "Curl inclinado", "2×8-12", { series: 2, min: 8, max: 12, ss: "B", ultima: "Última serie: al fallo.", mus: ["biceps"] }),
  ej("ta8", "TORSO A", 8, "Extensión tríceps sobre cabeza", "2×10-15", { series: 2, min: 10, max: 15, mus: ["triceps"] }),

  // ---------------- PIERNA A ----------------
  ej("pa1", "PIERNA A", 1, "Prensa pies altos y anchos", "3×8-12", { series: 3, min: 8, max: 12, mus: ["gluteo", "cuadriceps"], sec: ["isquios"] }),
  ej("pa2", "PIERNA A", 2, "Peso muerto rumano", "3×8-10", { series: 3, min: 8, max: 10, mus: ["isquios", "gluteo"], sec: ["lumbar"] }),
  ej("pa3", "PIERNA A", 3, "Abducción de cadera", "3×12-15", { series: 3, min: 12, max: 15, mus: ["gluteo"] }),
  ej("pa4", "PIERNA A", 4, "Curl femoral", "2×10-15", { series: 2, min: 10, max: 15, mus: ["isquios"] }),
  ej("pa5", "PIERNA A", 5, "Gemelos", "3×10-20", { series: 3, min: 10, max: 20, mus: ["gemelo"] }),
  ej("pa6", "PIERNA A", 6, "Extensión lumbar 45°", "2×10-15", { series: 2, min: 10, max: 15, ss: "A", estrella: true, tecnica: "Para al quedar alineado: no pases de ahí.", mus: ["lumbar"], sec: ["gluteo", "isquios"] }),
  ej("pa7", "PIERNA A", 7, "Dead bug", "2×6-8/lado", { series: 2, min: 6, max: 8, ss: "A", tipo: "reps_lado", mus: ["core"] }),
  ej("pa8", "PIERNA A", 8, "Laterales ligeras (al final)", "2×15-20", { series: 2, min: 15, max: 20, mus: ["hombroLateral"], tecnica: "Cinco minutos al final: suman a las 12-16 series semanales de deltoides lateral.", ultima: "Última serie: parciales hasta quemar." }),

  // ---------------- TORSO B ----------------
  ej("tb1", "TORSO B", 1, "Remo pecho apoyado agarre ALTO", "3×8-12", { series: 3, min: 8, max: 12, estrella: true, tecnica: "Pecho pegado al apoyo y pausa de 1-2 s. Registro propio, separado del agarre neutro.", mus: ["dorsal", "trapecio"], sec: ["hombroPosterior", "biceps"] }),
  ej("tb2", "TORSO B", 2, "Press de hombro en máquina", "3×8-12", { series: 3, min: 8, max: 12, tecnica: "Nuca apoyada en el respaldo todo el recorrido.", mus: ["hombroAnterior"], sec: ["triceps"] }),
  ej("tb3", "TORSO B", 3, "Press inclinado convergente", "3×8-12", { series: 3, min: 8, max: 12, mus: ["pecho"], sec: ["hombroAnterior", "triceps"] }),
  ej("tb4", "TORSO B", 4, "Laterales polea", "4×12-15", { series: 4, min: 12, max: 15, ss: "A", ultima: "Última serie: parciales hasta quemar.", mus: ["hombroLateral"] }),
  ej("tb5", "TORSO B", 5, "Reverse fly", "3×15-20", { series: 3, min: 15, max: 20, ss: "A", estrella: true, mus: ["hombroPosterior"], sec: ["trapecio"] }),
  ej("tb6", "TORSO B", 6, "Pushdown", "2×12-15", { series: 2, min: 12, max: 15, ss: "B", mus: ["triceps"] }),
  ej("tb7", "TORSO B", 7, "Curl martillo", "2×10-15", { series: 2, min: 10, max: 15, ss: "B", ultima: "Última serie: al fallo.", mus: ["biceps"], sec: ["antebrazo"] }),
  ej("tb8", "TORSO B", 8, "Farmer carry", "2×30-40 s", { series: 2, min: 30, max: 40, tipo: "tiempo", estrella: true, mus: ["trapecio", "antebrazo"], sec: ["core"] }),

  // ---------------- PIERNA B ----------------
  ej("pb1", "PIERNA B", 1, "Hip thrust", "3×8-12", { series: 3, min: 8, max: 12, tecnica: "Primero del día, en fresco. Para al quedar alineado, sin pasarte de rango.", mus: ["gluteo"], sec: ["isquios"] }),
  ej("pb2", "PIERNA B", 2, "Zancada búlgara torso inclinado ~30°", "3×8-12/pierna", { series: 3, min: 8, max: 12, tipo: "reps_lado", tecnica: "Torso inclinado unos 30°: así se lleva el trabajo el glúteo.", mus: ["gluteo", "cuadriceps"] }),
  ej("pb3", "PIERNA B", 3, "Prensa", "2×10-15", { series: 2, min: 10, max: 15, mus: ["cuadriceps"], sec: ["gluteo"] }),
  ej("pb4", "PIERNA B", 4, "Curl femoral", "2×10-15", { series: 2, min: 10, max: 15, mus: ["isquios"] }),
  ej("pb5", "PIERNA B", 5, "Gemelos", "3×10-20", { series: 3, min: 10, max: 20, mus: ["gemelo"] }),
  ej("pb6", "PIERNA B", 6, "Plancha", "2×20-35 s", { series: 2, min: 20, max: 35, ss: "A", tipo: "tiempo", mus: ["core"] }),
  ej("pb7", "PIERNA B", 7, "Pallof press", "2×10-12/lado", { series: 2, min: 10, max: 12, ss: "A", tipo: "reps_lado", mus: ["core"] }),
  ej("pb8", "PIERNA B", 8, "Laterales ligeras (al final)", "2×15-20", { series: 2, min: 15, max: 20, mus: ["hombroLateral"], tecnica: "Cinco minutos al final: suman a las 12-16 series semanales de deltoides lateral.", ultima: "Última serie: parciales hasta quemar." }),
];

/** Ejercicios de una sesión, ya ordenados. */
export function ejerciciosDe(sessionName) {
  return EJERCICIOS.filter((e) => e.sessionName === sessionName).sort((a, b) => a.order - b.order);
}

/** Búsqueda rápida por id, que se usa en todos los cálculos. */
export const EJERCICIOS_POR_ID = new Map(EJERCICIOS.map((e) => [e.id, e]));

/** Reglas de entreno que se recuerdan en pantalla. */
export const REGLAS_GYM = {
  rir: "1-2 RIR en todas las series de trabajo.",
  descansoGrande: 120, // segundos entre series de básicos
  descansoSuperserie: 75, // segundos al cerrar la ronda de superserie
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
