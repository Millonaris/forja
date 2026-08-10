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
    min: 12,
    max: 16,
    nota: "Es el punto que más quieres empujar: por eso las laterales van en las cuatro sesiones.",
  },
  pecho: {
    min: 4,
    max: 10,
    mantener: true,
    nota: "Volumen moderado a propósito. El tema del pezón no se arregla con más press: eso son la ecografía y perder grasa.",
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
