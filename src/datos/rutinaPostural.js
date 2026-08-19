/*
 * FORJA · Rutina postural diaria — versión definitiva del entrenador (ago-2026).
 *
 * Todos los días, 8-10 minutos, en orden de arriba abajo. Cada ejercicio tiene
 * su temporizador (los de tiempo cuentan atrás; los de repeticiones marcan el
 * ritmo de pausa). Ya no hay extras de martes/viernes: el trabajo de espalda
 * alta vive ahora en el gimnasio (reverse pec deck, remos) y el core va al
 * final de los días de pierna.
 *
 * "Día completo" = todos los ejercicios del bloque aplicables ese día. El de
 * pelvis solo cuenta las 4 primeras semanas; después desaparece del bloque.
 *
 * Además de la rutina: mini-reset 3-5 veces al día, 10-20 segundos —
 * rodillas suaves, costillas sobre pelvis, cuello largo. Sin apretar nada.
 */

/**
 * segundos: duración de cada serie cuando es un ejercicio de tiempo.
 * porLado: la serie se repite a cada lado.
 * pausa: segundos de pausa mantenida dentro de cada repetición.
 */
export const RUTINA_POSTURAL = [
  {
    id: "p1",
    orden: 1,
    nombre: "Basculación pélvica tumbado",
    dosis: "1×8",
    series: 1,
    reps: 8,
    tipo: "reps",
    soloHastaSemana: 4, // solo las 4 primeras semanas; después ya controlas la posición
    nota: "Tumbado, pega la lumbar al suelo sin empujar con los pies.",
  },
  {
    id: "p3",
    orden: 2,
    nombre: "Extensión torácica sobre foam roller",
    dosis: "1×8 · pausa 2 s",
    series: 1,
    reps: 8,
    pausa: 2,
    tipo: "reps",
    nota: "Movimiento de espalda alta. No arquees la lumbar.",
  },
  {
    id: "p4",
    orden: 3,
    nombre: "Chin tuck",
    dosis: "2×8 · 5 s",
    series: 2,
    reps: 8,
    pausa: 5,
    tipo: "reps",
    nota: "Cabeza hacia atrás, no barbilla hacia abajo.",
  },
  {
    id: "p8",
    orden: 4,
    nombre: "Wall slide",
    dosis: "2×8-10",
    series: 2,
    reps: 9,
    tipo: "reps",
    nota: "Costillas controladas, cuello largo. No hace falta pegar las manos del todo a la pared.",
  },
  {
    id: "p5",
    orden: 5,
    nombre: "Cobra baja",
    dosis: "2×20-30 s",
    series: 2,
    segundos: 25,
    tipo: "tiempo",
    nota: "El pecho sube MUY poco, mirada al suelo. Nada de hiperextender la lumbar.",
  },
  {
    id: "p2",
    orden: 6,
    nombre: "Colocación de pie",
    dosis: "3×20 s",
    series: 3,
    segundos: 20,
    tipo: "tiempo",
    nota: "Rodillas suaves → costillas sobre pelvis → cuello largo. Practicar la posición, no forzarla.",
  },
];

/** Ya no hay extras de martes/viernes: la espalda alta se trabaja en el gym. */
export const EXTRAS_POSTURALES = [];

/** Días de la semana (ISO: 1 = lunes) en los que tocan los extras. */
export const DIAS_EXTRAS = [];

/**
 * Rutina aplicable a una semana concreta del plan.
 * Aplica la caducidad del ejercicio de pelvis.
 */
export function rutinaDeSemana(semana, conExtras = false) {
  const principal = RUTINA_POSTURAL.filter((e) => !e.soloHastaSemana || semana <= e.soloHastaSemana);
  return conExtras ? [...principal, ...EXTRAS_POSTURALES] : principal;
}

/** Ids del bloque principal de esa semana: los que hacen falta para el día completo. */
export function idsPrincipales(semana) {
  return rutinaDeSemana(semana).map((e) => e.id);
}

/**
 * Test de la pared: se hace el día 0 y cada 6 semanas.
 * Tres resultados posibles, cada uno con su lectura y qué hacer.
 */
export const TEST_PARED = {
  descripcion:
    "De espaldas a la pared: talones, glúteo, dorsal y nuca tocando a la vez, con la lumbar dejando pasar solo una mano.",
  opciones: [
    {
      id: "easy",
      etiqueta: "Sale fácil",
      color: "ok",
      lectura: "Postura de partida buena. La rutina pasa a ser mantenimiento.",
      accion: "Mantén la rutina diaria y los mini-resets. No hace falta más.",
    },
    {
      id: "hard",
      etiqueta: "Cuesta mantenerlo",
      color: "aviso",
      lectura: "Llegas, pero tirando de compensación: te cansas antes de 20 s.",
      accion: "Insiste en cobra baja y colocación de pie, y suma mini-resets durante el día.",
    },
    {
      id: "none",
      etiqueta: "No llego",
      color: "alerta",
      lectura: "La nuca o el dorsal no tocan sin arquear la lumbar.",
      accion: "Prioriza extensión torácica y chin tuck. No fuerces el rango.",
    },
  ],
};

/** Cada cuántas semanas toca repetir el test. */
export const CADA_SEMANAS_TEST = 6;

/**
 * Semanas en las que el plan pide el test sí o sí: día 0, semana 6 y semana 12.
 * A partir de ahí se sigue con la cadencia de 6 semanas.
 */
export const SEMANAS_TEST = [1, 6, 12];

/** La foto de perfil se hace los lunes (y como mínimo cada 4 semanas). */
export const DIA_FOTO = 1;
export const SEMANAS_MAX_SIN_FOTO = 4;
