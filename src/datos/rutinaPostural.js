/*
 * FORJA · Rutina postural diaria.
 *
 * Orden fijo: se hace de arriba abajo. Cada ejercicio tiene su temporizador
 * (los de tiempo cuentan atrás; los de repeticiones marcan el ritmo de pausa).
 *
 * "Día completo" = todos los ejercicios del BLOQUE PRINCIPAL aplicables ese día.
 * El de pelvis solo cuenta las 4 primeras semanas; a partir de ahí desaparece
 * del bloque y el día completo pasa a ser 6 ejercicios en vez de 7.
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
    nombre: "Control de pelvis (retroversión)",
    dosis: "1×8",
    series: 1,
    reps: 8,
    tipo: "reps",
    soloHastaSemana: 4, // solo las 4 primeras semanas
    nota: "Tumbado, pega la lumbar al suelo sin empujar con los pies.",
  },
  {
    id: "p2",
    orden: 2,
    nombre: "Postura contra pared",
    dosis: "5×20 s",
    series: 5,
    segundos: 20,
    tipo: "tiempo",
    nota: "Talones, glúteo, dorsal y nuca en la pared. Barbilla metida.",
  },
  {
    id: "p3",
    orden: 3,
    nombre: "Extensión torácica con toalla",
    dosis: "2×8 · pausa 3 s",
    series: 2,
    reps: 8,
    pausa: 3,
    tipo: "reps",
    nota: "Toalla enrollada bajo las escápulas. Abre pecho, no lumbar.",
  },
  {
    id: "p4",
    orden: 4,
    nombre: "Chin tuck tumbado",
    dosis: "2×8-10 · 5 s",
    series: 2,
    reps: 9,
    pausa: 5,
    tipo: "reps",
    nota: "Doble mentón sin levantar la cabeza del suelo.",
  },
  {
    id: "p5",
    orden: 5,
    nombre: "Cobra prona",
    dosis: "3×20-30 s",
    series: 3,
    segundos: 25,
    tipo: "tiempo",
    // La cobra progresa con las semanas: es el ejercicio que más gana con el tiempo.
    progresion: [
      { desdeSemana: 1, segundos: 25, dosis: "3×20-30 s" },
      { desdeSemana: 5, segundos: 30, dosis: "3×25-30 s" },
      { desdeSemana: 9, segundos: 40, dosis: "3×40 s" },
    ],
    nota: "Boca abajo, pulgares al techo, despega pecho sin tirar del cuello.",
  },
  {
    id: "p6",
    orden: 6,
    nombre: "Floor angels",
    dosis: "2×8-10",
    series: 2,
    reps: 9,
    tipo: "reps",
    nota: "Brazos pegados al suelo todo el recorrido. Si despegan, menos rango.",
  },
  {
    id: "p7",
    orden: 7,
    nombre: "Couch stretch",
    dosis: "45 s/lado",
    series: 2,
    segundos: 45,
    tipo: "tiempo",
    porLado: true,
    nota: "Glúteo apretado para no arquear la lumbar.",
  },
];

/** Extras: 2 días por semana, después del bloque principal. */
export const EXTRAS_POSTURALES = [
  {
    id: "x1",
    orden: 8,
    nombre: "Y-W-T",
    dosis: "1-2 rondas · 10 s/letra",
    series: 3,
    segundos: 10,
    tipo: "tiempo",
    extra: true,
    nota: "Boca abajo. Una ronda son las tres letras seguidas.",
  },
  {
    id: "x2",
    orden: 9,
    nombre: "Apertura en banco con botellas",
    dosis: "2-3 min",
    series: 1,
    segundos: 150,
    tipo: "tiempo",
    extra: true,
    nota: "Tumbado en el banco, brazos en cruz, peso ligero. Respira largo.",
  },
];

/** Días de la semana (ISO: 1 = lunes) en los que tocan los extras. */
export const DIAS_EXTRAS = [2, 5]; // martes y viernes

/**
 * Rutina aplicable a una semana concreta del plan.
 * Aplica la caducidad del ejercicio de pelvis y la progresión de la cobra.
 */
export function rutinaDeSemana(semana, conExtras = false) {
  const principal = RUTINA_POSTURAL.filter(
    (e) => !e.soloHastaSemana || semana <= e.soloHastaSemana,
  ).map((e) => {
    if (!e.progresion) return e;
    // Se coge el último tramo de progresión cuya semana de inicio ya hemos pasado.
    const tramo = [...e.progresion].reverse().find((p) => semana >= p.desdeSemana);
    return { ...e, segundos: tramo.segundos, dosis: tramo.dosis };
  });
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
      accion: "Mantén los 7 ejercicios y sube la cobra a 40 s.",
    },
    {
      id: "hard",
      etiqueta: "Cuesta mantenerlo",
      color: "aviso",
      lectura: "Llegas, pero tirando de compensación: te cansas antes de 20 s.",
      accion: "Insiste en pared y cobra. Añade los extras un día más por semana.",
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
