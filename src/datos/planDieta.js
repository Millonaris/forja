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
    nota: "Corto y agresivo para quitar el exceso de vacaciones. Carbohidratos alrededor del gym. Si el rendimiento cae mucho, el hambre no se controla o duermes peor: sube ya a 1 800-1 900.",
  },
  {
    desde: "2026-09-01",
    hasta: "2026-09-08",
    nombre: "MINI-CUT · SEMANA 2",
    kcal: "1 800-1 900",
    macros: { proteina: "190-200 g", grasa: "55-65 g", carbos: "~125-150 g" },
    nota: "Se afloja un poco el déficit y la subida va a carbohidratos, para rendir en el gym.",
  },
  {
    desde: "2026-09-09",
    hasta: "2026-09-15",
    nombre: "MANTENIMIENTO · COMPROBACIÓN",
    kcal: "~2 400",
    macros: { proteina: "180-190 g", grasa: "65-75 g", carbos: "~255 g" },
    nota: "Semana para comprobar el mantenimiento real con la media de 7 días: si el peso aguanta estable, 2 400 es tu número; si sigue bajando, tu gasto es mayor.",
  },
  {
    desde: "2026-09-16",
    hasta: null,
    nombre: "VOLUMEN LIMPIO",
    kcal: "2 500-2 550",
    macros: { proteina: "180-190 g", grasa: "65-75 g", carbos: "~280-295 g" },
    nota: "Superávit mínimo (+100-150 kcal): ganar +100-200 g/semana como mucho. Peso estable 2-3 sem pero el gym progresa → no tocar. Nada progresa → +100 kcal. Subes >300 g/sem y crece la cintura → −100 kcal. Cuando la carrera se alargue, estas kcal pueden pasar a ser mantenimiento: se ajusta con los datos.",
  },
];

/** Fase de dieta que toca en una fecha, o null antes del plan (vacaciones). */
export function faseDietaDe(iso) {
  return FASES_DIETA.find((f) => iso >= f.desde && (!f.hasta || iso <= f.hasta)) ?? null;
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
