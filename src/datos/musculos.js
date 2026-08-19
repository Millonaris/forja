/*
 * FORJA · Grupos musculares.
 *
 * Sirven para contar las SERIES SEMANALES POR MÚSCULO, que es la métrica que
 * de verdad manda en hipertrofia: el rango útil está en 10-20 series duras por
 * músculo y semana. Por debajo no crece, por encima solo acumulas fatiga.
 *
 * Se cuentan enteras las series del músculo que hace el trabajo principal y a
 * media las del que ayuda: el bíceps trabaja en un jalón, pero no igual que en
 * un curl, y sumarlo entero inflaría el recuento hasta hacerlo inútil.
 */

export const MUSCULOS = {
  pecho: "Pecho",
  dorsal: "Dorsal",
  trapecio: "Trapecio medio",
  hombroAnterior: "Hombro anterior",
  hombroLateral: "Hombro lateral",
  hombroPosterior: "Hombro posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  cuadriceps: "Cuádriceps",
  isquios: "Isquiotibiales",
  gluteo: "Glúteo",
  gemelo: "Gemelo",
  tibial: "Tibial anterior",
  lumbar: "Lumbar",
  core: "Core",
  antebrazo: "Antebrazo",
};

/** Series semanales recomendadas por defecto para hipertrofia. */
export const RANGO_SERIES = { min: 10, max: 20 };

/**
 * Objetivos que se apartan del rango general, por decisión del plan.
 *
 * Esto no es teoría: son decisiones tomadas para ESTE cuerpo y este objetivo,
 * y la app tiene que respetarlas en vez de empujar a todo el mundo hacia el
 * mismo número. Sin esta tabla, la pantalla de volumen pediría subir el pecho,
 * que es justo lo contrario de lo que toca.
 */
export const OBJETIVO_SERIES = {
  hombroLateral: {
    min: 9,
    max: 14,
    nota: "Especialización nº1 (anchura): laterales en las cuatro sesiones, ≈10,5 series directas de media más lo indirecto de los presses.",
  },
  dorsal: {
    min: 8,
    max: 12,
    nota: "Especialización nº2 (la V): jalones + pullover + lo que aportan los remos, ≈10 series efectivas.",
  },
  hombroPosterior: {
    min: 4,
    max: 8,
    nota: "Hombro 3D y postura: reverse pec deck en los dos torsos más lo que cae de los remos.",
  },
  pecho: {
    min: 5,
    max: 8,
    mantener: true,
    nota: "Mantenimiento a propósito: la recuperación extra va a hombro y espalda. El tema del pezón no se arregla con más press.",
  },
  cuadriceps: {
    min: 7,
    max: 12,
    nota: "Suficiente para crecer sin destrozar las piernas ahora que estás empezando a correr.",
  },
  gemelo: {
    min: 6,
    max: 12,
    nota: "Gemelos + sóleo en cada día de pierna: fuerza protectora del plan de carrera, no hipertrofia.",
  },
  tibial: {
    min: 2,
    max: 6,
    mantener: true,
    nota: "Trabajo protector contra la periostitis: con las 2 series de cada día de pierna vale.",
  },
};

/** Objetivo de series de un músculo, con el rango general como respaldo. */
export const objetivoDe = (musculo) => OBJETIVO_SERIES[musculo] ?? RANGO_SERIES;

/**
 * Músculos que se llevan casi todo el trabajo de correr. Cuando la carrera
 * pisa a la pierna, el aviso de interferencia mira estos.
 */
export const MUSCULOS_DE_CORRER = ["cuadriceps", "isquios", "gluteo", "gemelo"];

/** Etiqueta legible de un músculo. */
export const nombreMusculo = (id) => MUSCULOS[id] ?? id;
