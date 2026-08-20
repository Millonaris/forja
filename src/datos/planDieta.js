/*
 * FORJA · Plan de dieta por fases (plan del entrenador, ago-2026).
 *
 * La dieta se REGISTRA en Fitia, no aquí: la app solo enseña el objetivo de
 * la fase en la que estás (kcal y macros) y los hitos de medidas, para no
 * tener que recordar fechas ni números. El progreso se valora con la media
 * de 7 días del peso (pesarse cada mañana, tras el baño y antes de desayunar),
 * la cintura y las fotos — nunca con el peso de un día suelto.
 *
 * Reglas que valen para todas las fases: creatina 5 g diarios (no se quita
 * para pesar menos), agua y sal normales (nada de deshidratación ni saunas),
 * fibra 25-35 g, alcohol 0 durante el mini-cut.
 */

/**
 * Fases con fechas reales. `hasta` es inclusivo; la última fase no tiene fin.
 * kcal y macros son texto porque son rangos objetivo, no números exactos:
 * el plan pide cumplir aproximadamente calorías y proteína, sin obsesionarse.
 */
export const FASES_DIETA = [
  {
    desde: "2026-08-24",
    hasta: "2026-08-31",
    nombre: "MINI-CUT · SEMANA 1",
    kcal: "1 700",
    macros: { proteina: "190-200 g", grasa: "50-60 g", carbos: "~100 g" },
    ejemplo: "195 P · 55 G · ~105 C ≈ 1 695 kcal",
    comidas: "4 comidas · 45-50 g de proteína cada una · los hidratos, antes y/o después del gym",
    nota: "Corto y agresivo para quitar el exceso de vacaciones. Carbohidratos alrededor del gym. Si el rendimiento cae mucho, el hambre no se controla o duermes peor: sube ya a 1 800-1 900.",
  },
  {
    desde: "2026-09-01",
    hasta: "2026-09-08",
    nombre: "MINI-CUT · SEMANA 2",
    kcal: "1 800-1 900",
    macros: { proteina: "190-200 g", grasa: "55-65 g", carbos: "~125-150 g" },
    ejemplo: "195 P · 60 G · ~120-145 C",
    comidas: "4 comidas · 45-50 g de proteína cada una · la subida de kcal va a hidratos alrededor del gym",
    nota: "Punto de partida razonable: 1 850. Se afloja el déficit y la subida va a carbohidratos, para rendir en el gym. El viernes 4 (día visual), parte de los hidratos antes de entrenar.",
  },
  {
    desde: "2026-09-09",
    hasta: "2026-09-15",
    nombre: "MANTENIMIENTO · COMPROBACIÓN",
    kcal: "~2 400",
    macros: { proteina: "180-190 g", grasa: "65-75 g", carbos: "~255 g" },
    ejemplo: "185 P · 70 G · ~255-260 C ≈ 2 400 kcal",
    comidas: "3-4 comidas · ~45-50 g de proteína cada una · hidratos repartidos, con parte alrededor del entreno",
    nota: "Semana para comprobar el mantenimiento real con la media de 7 días: si el peso aguanta estable, 2 400 es tu número; si sigue bajando, tu gasto es mayor.",
  },
  {
    desde: "2026-09-16",
    hasta: null,
    nombre: "VOLUMEN LIMPIO",
    kcal: "2 500-2 550",
    macros: { proteina: "180-190 g", grasa: "65-75 g", carbos: "~280-295 g" },
    ejemplo: "185 P · 70 G · ~280-295 C",
    comidas: "3-4 comidas · ~45-50 g de proteína cada una · las kcal extra sobre mantenimiento, a hidratos",
    nota: "Superávit mínimo (+100-150 kcal): ganar +100-200 g/semana como mucho. Peso estable 2-3 sem pero el gym progresa → no tocar. Nada progresa → +100 kcal. Subes >300 g/sem y crece la cintura → −100 kcal. Cuando la carrera se alargue, estas kcal pueden pasar a ser mantenimiento: se ajusta con los datos.",
  },
];

/** Fase de dieta que toca en una fecha, o null antes del plan (vacaciones). */
export function faseDietaDe(iso) {
  return FASES_DIETA.find((f) => iso >= f.desde && (!f.hasta || iso <= f.hasta)) ?? null;
}

/**
 * ¿La fecha cae dentro del mini-cut (24-ago a 8-sep)? Durante ese tramo el
 * gimnasio se hace en versión Light: menos series en varios ejercicios, RIR 2
 * y nada de fallo — recuperar rendimiento con 1 700-1 900 kcal, no récords.
 */
export function enMiniCut(iso) {
  return iso >= "2026-08-24" && iso <= "2026-09-08";
}

/**
 * Hitos de medidas y fechas estéticas del plan. La cintura y las fotos
 * cuentan más que la báscula para juzgar el mini-cut.
 */
export const HITOS_DIETA = [
  { fecha: "2026-08-24", texto: "Cintura y foto: punto de partida del mini-cut" },
  { fecha: "2026-08-29", texto: "Fecha estética · cintura y foto (pump suave de torso antes, sin fallo)" },
  { fecha: "2026-09-04", texto: "Fecha estética · cintura y foto (pump suave de torso antes, sin fallo)" },
  { fecha: "2026-09-08", texto: "Cintura y foto: cierre del mini-cut" },
  { fecha: "2026-09-15", texto: "Cintura y foto: fin de la semana de mantenimiento" },
];

/** El próximo hito a partir de una fecha (incluida), o null si ya pasaron todos. */
export function proximoHitoDieta(iso) {
  return HITOS_DIETA.find((h) => h.fecha >= iso) ?? null;
}

/**
 * Kcal día a día del mini-cut — SOLO comida: las notas de alimentación que
 * dio el entrenador para días concretos (vísperas y días visuales). Los
 * entrenos de cada día ya los enseñan las pestañas Hoy, Gym y Carrera.
 */
export const KCAL_DIA_A_DIA = [
  { fecha: "2026-08-24", kcal: "1 700" },
  { fecha: "2026-08-25", kcal: "1 700" },
  { fecha: "2026-08-26", kcal: "1 700" },
  { fecha: "2026-08-27", kcal: "1 700" },
  { fecha: "2026-08-28", kcal: "1 700", nota: "Cena normal, sin atracón: mañana es día visual" },
  { fecha: "2026-08-29", kcal: "1 700", nota: "Día visual: comida normal del plan, nada raro ni deshidratación" },
  { fecha: "2026-08-30", kcal: "1 700" },
  { fecha: "2026-08-31", kcal: "1 700" },
  { fecha: "2026-09-01", kcal: "1 850", nota: "Empieza la semana 2: sube de 1 700 a 1 850" },
  { fecha: "2026-09-02", kcal: "1 850" },
  { fecha: "2026-09-03", kcal: "1 850", nota: "Sin cena exagerada y evita lo que te hinche: mañana es el día visual grande" },
  { fecha: "2026-09-04", kcal: "1 850-1 900", nota: "Día visual: parte de los hidratos antes del entreno de la tarde" },
  { fecha: "2026-09-05", kcal: "1 850" },
  { fecha: "2026-09-06", kcal: "1 850" },
  { fecha: "2026-09-07", kcal: "1 850" },
  { fecha: "2026-09-08", kcal: "1 850", nota: "Último día del mini-cut: desde mañana, ~2 400 de mantenimiento" },
];
