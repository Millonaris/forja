/*
 * FORJA · Plan de dieta por fases (plan del entrenador, ago-2026).
 *
 * La dieta se REGISTRA en Fitia, no aquí: la app solo enseña el objetivo de
 * la fase en la que estás (kcal, macros y el reparto por comidas con horario)
 * y los hitos de medidas. El progreso se valora con la media de 7 días del
 * peso (pesarse cada mañana, tras el baño y antes de desayunar), la cintura
 * y las fotos — nunca con el peso de un día suelto.
 *
 * Estructura del día (sin preentreno por obligación):
 * 09:00 desayuno → 12:00 pesas → 13:00-13:30 comida → merienda → 21:00 cena.
 *
 * Reglas que valen para todas las fases: creatina 5 g diarios (no se quita
 * para pesar menos), agua y sal normales (nada de deshidratación ni saunas),
 * fibra 25-35 g, alcohol 0 durante el mini-cut.
 */

/** La estructura horaria del día, igual en todas las fases. */
export const ESTRUCTURA_DIA =
  "09:00 desayuno → 12:00 pesas → 13:00-13:30 comida → 17:00-18:00 merienda → 21:00 cena";

/**
 * Fases con fechas reales. `hasta` es inclusivo; la última fase no tiene fin.
 * `comidasDetalle` son las tablas exactas del entrenador: proteína / hidratos /
 * grasas por comida. Los hidratos van a propósito al desayuno y al post-entreno.
 */
export const FASES_DIETA = [
  {
    desde: "2026-08-26",
    hasta: "2026-09-01",
    nombre: "MINI-CUT · SEMANA 1",
    kcal: "~1 700",
    macros: { proteina: "195 g", grasa: "55 g", carbos: "105 g" },
    comidasDetalle: [
      { nombre: "Desayuno", hora: "09:00", p: 45, h: 40, g: 15 },
      { nombre: "Comida (post-entreno)", hora: "13:00-13:30", p: 55, h: 45, g: 10 },
      { nombre: "Merienda", hora: "17:00-18:00", p: 40, h: 10, g: 10 },
      { nombre: "Cena", hora: "21:00", p: 55, h: 10, g: 20 },
    ],
    notaComidas:
      "Desayuno tipo: avena + whey, queso fresco batido o yogur proteico. De los 105 g de hidratos, ~85 van entre desayuno y post-entreno: justo donde interesan con 1 700 kcal.",
    nota: "Corto y agresivo para quitar el exceso de vacaciones (el 25 es solo el regreso; se empieza el 26). Si hay mareo, el hambre no se controla o duermes peor: sube ya a 1 800-1 900.",
  },
  {
    desde: "2026-09-02",
    hasta: "2026-09-08",
    nombre: "MINI-CUT · SEMANA 2",
    kcal: "~1 850",
    macros: { proteina: "195 g", grasa: "60 g", carbos: "130 g" },
    comidasDetalle: [
      { nombre: "Desayuno", hora: "09:00", p: 45, h: 45, g: 15 },
      { nombre: "Comida (post-entreno)", hora: "13:00-13:30", p: 55, h: 60, g: 10 },
      { nombre: "Merienda", hora: "17:00-18:00", p: 40, h: 10, g: 10 },
      { nombre: "Cena", hora: "21:00", p: 55, h: 15, g: 25 },
    ],
    notaComidas: "Los hidratos que se suman respecto a la semana 1 van al desayuno y al post-entreno.",
    nota: "Se afloja el déficit para rendir en el gym. El viernes 4 (día visual), parte de los hidratos antes de entrenar.",
  },
  {
    desde: "2026-09-09",
    hasta: "2026-09-15",
    nombre: "MANTENIMIENTO · COMPROBACIÓN",
    kcal: "~2 400",
    macros: { proteina: "185 g", grasa: "70 g", carbos: "258 g" },
    comidasDetalle: [
      { nombre: "Desayuno", hora: "09:00", p: 45, h: 70, g: 15 },
      { nombre: "Comida (post-entreno)", hora: "13:00-13:30", p: 55, h: 100, g: 15 },
      { nombre: "Merienda", hora: "17:00-18:00", p: 40, h: 35, g: 10 },
      { nombre: "Cena", hora: "21:00", p: 45, h: 53, g: 30 },
    ],
    notaComidas: "Ya hay combustible: 170 de los 258 g de hidratos van entre desayuno y post-entreno.",
    nota: "Semana para comprobar el mantenimiento real con la media de 7 días: si el peso aguanta estable, 2 400 es tu número; si sigue bajando, tu gasto es mayor.",
  },
  {
    desde: "2026-09-16",
    hasta: null,
    nombre: "VOLUMEN LIMPIO",
    kcal: "~2 500",
    macros: { proteina: "185 g", grasa: "70 g", carbos: "283 g" },
    comidasDetalle: [
      { nombre: "Desayuno", hora: "09:00", p: 45, h: 75, g: 15 },
      { nombre: "Comida (post-entreno)", hora: "13:00-13:30", p: 55, h: 110, g: 15 },
      { nombre: "Merienda", hora: "17:00-18:00", p: 40, h: 40, g: 10 },
      { nombre: "Cena", hora: "21:00", p: 45, h: 58, g: 30 },
    ],
    notaComidas:
      "La distribución favorita del entrenador para ganar: mucho combustible alrededor de las pesas sin comer constantemente. Si toca subir a 2 550, los +50 van a hidratos (desayuno ~80, comida ~115, cena ~60).",
    nota: "Superávit mínimo (+100-150 kcal): ganar +100-200 g/semana como mucho. Peso estable 2-3 sem pero el gym progresa → no tocar. Nada progresa → +100 kcal. Subes >300 g/sem y crece la cintura → −100 kcal.",
  },
];

/** Fase de dieta que toca en una fecha, o null antes del plan (vacaciones). */
export function faseDietaDe(iso) {
  return FASES_DIETA.find((f) => iso >= f.desde && (!f.hasta || iso <= f.hasta)) ?? null;
}

/**
 * Rampa de vuelta al gimnasio (26-ago a 1-sep): misma rutina definitiva pero
 * al 75-80 % del volumen (la app baja las series sola) y RIR ~3 — dos semanas
 * sin pesas + 1 700 kcal. La semana del 2 al 8 ya se hace el volumen completo
 * a RIR ~2, y desde el 9, el 100 % a RIR 1-2.
 */
export function enRampaSuave(iso) {
  return iso >= "2026-08-26" && iso <= "2026-09-01";
}

/**
 * Hitos de medidas y fechas estéticas del plan. La cintura y las fotos
 * cuentan más que la báscula para juzgar el mini-cut.
 */
export const HITOS_DIETA = [
  { fecha: "2026-08-26", texto: "Cintura y foto: punto de partida del mini-cut" },
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
  { fecha: "2026-08-26", kcal: "1 700", nota: "Día 1 del mini-cut" },
  { fecha: "2026-08-27", kcal: "1 700" },
  { fecha: "2026-08-28", kcal: "1 700", nota: "Cena normal, sin atracón: mañana es día visual" },
  { fecha: "2026-08-29", kcal: "1 700", nota: "DÍA VISUAL: sigue el protocolo detallado (tarjeta de arriba)" },
  { fecha: "2026-08-30", kcal: "1 700" },
  { fecha: "2026-08-31", kcal: "1 700" },
  { fecha: "2026-09-01", kcal: "1 700", nota: "Último día de la semana fuerte" },
  { fecha: "2026-09-02", kcal: "1 850", nota: "Empieza la fase moderada: sube de 1 700 a 1 850" },
  { fecha: "2026-09-03", kcal: "1 850", nota: "Sin cena exagerada y evita lo que te hinche: mañana es el día visual grande" },
  { fecha: "2026-09-04", kcal: "1 850-1 900", nota: "Día visual (día 10): hidratos concentrados en desayuno y post-entreno" },
  { fecha: "2026-09-05", kcal: "1 850" },
  { fecha: "2026-09-06", kcal: "1 850" },
  { fecha: "2026-09-07", kcal: "1 850" },
  { fecha: "2026-09-08", kcal: "1 850", nota: "Último día del mini-cut: desde mañana, ~2 400 de mantenimiento" },
];

/**
 * Protocolo del primer día visual (sábado 29-ago), palabra por palabra del
 * entrenador: verse menos hinchado y con congestión SIN tocar las 1 700 kcal
 * ni deshidratarse. Desaparece de la pantalla cuando pasa el día. El del
 * 4-sep llegará aparte: ese día hay Torso A y más margen de hidratos.
 */
export const PROTOCOLO_VISUAL = {
  titulo: "PROTOCOLO · DÍA VISUAL (SÁB 29)",
  hasta: "2026-08-29",
  bloques: [
    {
      dia: "Viernes 28 · preparación",
      lineas: [
        "Nutrición: 1 700 kcal y macros normales (195 P / 105 H / 55 G). Comida predecible y fácil de digerir.",
        "Evitar por la tarde-noche: atracón, alcohol, comida basura, salsas, fibra exagerada y lo que sepas que te hincha.",
        "Cena moderada dentro de macros: proteína magra + pocos hidratos (sin quitarlos del todo) + verdura que toleres + grasa controlada. Nada de cenar enorme ni de cenar nada \"para pesar menos\".",
        "Agua y sal: normales. Ni más ni menos.",
        "Gym: Pierna A al 75-80 % del volumen, RIR ~3, sin fallo ni técnicas. Salir pensando \"podría haber hecho bastante más\".",
      ],
    },
    {
      dia: "Sábado 29 · día visual",
      lineas: [
        "Mismas 1 700 kcal y macros: ni cheat day, ni recarga, ni ayuno. Nada de deshidratar ni quitar sal — beber poco te deja peor y el músculo más plano.",
        "Desayuno habitual (45 P / 40 H / 15 G). La avena vale si no te hincha; si te hincha, cambia la fuente de hidratos ese día por comodidad digestiva.",
        "Para verte mejor a una hora concreta: reserva 20-30 g de hidratos DEL PROPIO día (plátano, pan, tortitas de arroz, arroz) para 60-120 min antes del pump, restándolos de otra comida.",
        "Pump opcional 1-3 h antes del momento, 10-15 min y a RIR 2-3 (congestionar, no fatigar; descansos 45-60 s): laterales 3×15-20 · pullover o jalón ligero 2×12-15 · press ligero o flexiones 2×12-15 · bíceps 2×12-15 · tríceps 2×12-15.",
        "CaCo: mejor moverlo al domingo 30 (así está ya en el plan). Si corres sí o sí, que sea después del momento importante y muy fácil.",
        "Objetivo real: menos hinchazón, abdomen más plano y hombros/espalda congestionados. En 4 días no cambia la grasa: cambia el aspecto.",
      ],
    },
  ],
};
