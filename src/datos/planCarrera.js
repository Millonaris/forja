/*
 * FORJA · Plan de carrera 0 → 20K en 26 semanas — versión revisada por el
 * entrenador (agosto 2026).
 *
 * Fase 1 (sem 1-8):  2 días/semana (martes y sábado). Intervalos corre/camina.
 *                    La semana 8 tiene dos sesiones DISTINTAS: martes 20-25′
 *                    seguidos y sábado 30′ seguidos.
 * Fase 2 (sem 9-16): 3 días/semana. Martes 30′, jueves 30-35′ y una tirada
 *                    larga que crece de 5 a 10 km, con descargas en 12 y 16.
 * Fase 3 (sem 17-26): 3 días/semana. Martes 40-45′, jueves 45-50′ y larga
 *                    hasta 16 km (larga máxima, sem 23-24). Las semanas 25-26
 *                    son taper: se descansa PARA la carrera. Domingo 26: 20K.
 *
 * Todo se corre SUAVE: poder hablar frases enteras. El crono no importa en
 * ninguna semana de este ciclo. Nada de series ni cuestas (única excepción:
 * 2-3 aceleraciones de 15″ el jueves de la semana 26).
 *
 * Todas las sesiones llevan 5' de calentamiento andando y 5' de enfriamiento
 * andando; no se cuentan como "corre".
 */

const MIN = 60; // segundos por minuto, para que los bloques se lean solos

/**
 * Protocolo de intervalos de cada sesión de la fase 1.
 * repeticiones × (segundos corriendo + segundos caminando)
 *
 * Las claves 1-7 valen para las dos sesiones de la semana; la semana 8 se
 * divide en "8m" (martes, 20-25′ seguidos) y "8s" (sábado, 30′ seguidos).
 */
export const INTERVALOS_F1 = {
  1: { reps: 8, corre: 1 * MIN, camina: 2 * MIN, texto: "8×(1′ corre + 2′ camina)" },
  2: { reps: 7, corre: 2 * MIN, camina: 2 * MIN, texto: "7×(2′ corre + 2′ camina)" },
  3: { reps: 6, corre: 3 * MIN, camina: 2 * MIN, texto: "6×(3′ corre + 2′ camina)" },
  4: { reps: 5, corre: 4 * MIN, camina: 2 * MIN, texto: "5×(4′ corre + 2′ camina)" },
  5: { reps: 4, corre: 6 * MIN, camina: 2 * MIN, texto: "4×(6′ corre + 2′ camina)" },
  6: { reps: 3, corre: 8 * MIN, camina: 2 * MIN, texto: "3×(8′ corre + 2′ camina)" },
  7: { reps: 2, corre: 12 * MIN, camina: 3 * MIN, texto: "2×(12′ corre + 3′ camina)" },
  "8m": { reps: 1, corre: 25 * MIN, camina: 0, texto: "20-25′ seguidos" },
  "8s": { reps: 1, corre: 30 * MIN, camina: 0, texto: "30′ seguidos" },
};

/**
 * Clave de INTERVALOS_F1 que toca según la semana y el día (2 = martes).
 * Es lo que viaja en la URL del temporizador.
 */
export function claveIntervalos(semana, dow) {
  const s = Math.min(Math.max(semana, 1), 8);
  if (s < 8) return s;
  return dow === 2 ? "8m" : "8s";
}

export const CALENTAMIENTO = 5 * MIN;
export const ENFRIAMIENTO = 5 * MIN;

/**
 * Tirada larga por semana en fases 2 y 3, en km.
 * `descarga: true` marca las semanas en las que la larga BAJA a propósito
 * para asimilar carga; no es un fallo del plan. `rango` es el texto que se
 * enseña cuando el entrenador dio una horquilla en vez de un número.
 */
export const LARGAS = {
  // Fase 2
  9: { km: 5 },
  10: { km: 6 },
  11: { km: 7 },
  12: { km: 5, descarga: true },
  13: { km: 8 },
  14: { km: 9 },
  15: { km: 10, nota: "mitad del objetivo" },
  16: { km: 7, rango: "6-7", descarga: true },
  // Fase 3
  17: { km: 11 },
  18: { km: 12 },
  19: { km: 13 },
  20: { km: 9, descarga: true },
  21: { km: 14 },
  22: { km: 15 },
  23: { km: 16, nota: "larga máxima: de aquí no se pasa" },
  24: { km: 16, nota: "última larga grande" },
  25: { km: 11, rango: "10-12", descarga: true, nota: "taper: descansar es entrenar" },
  26: { km: 20, carrera: true }, // el día del 20K, en domingo
};

/** Fase (1, 2 o 3) a la que pertenece una semana del plan. */
export function faseDeSemana(semana) {
  if (semana <= 8) return 1;
  if (semana <= 16) return 2;
  return 3;
}

/** Etiqueta de la fase para la barra de progreso de HOY. */
export const FASES = [
  { n: 1, nombre: "F1 BASE", desde: 1, hasta: 8 },
  { n: 2, nombre: "F2 CARGA", desde: 9, hasta: 16 },
  { n: 3, nombre: "F3 20K", desde: 17, hasta: 26 },
];

/**
 * Duración objetivo de las carreras cortas según la semana y el día.
 * El entrenador diferencia martes (2) y jueves (4): el jueves es algo más largo.
 */
export function minutosCorta(semana, dow = 4) {
  const fase = faseDeSemana(semana);
  const esMartes = dow === 2;
  if (fase === 2) {
    return esMartes
      ? { min: 30, max: 30, texto: "30 min suaves" }
      : { min: 30, max: 35, texto: "30-35 min suaves" };
  }
  return esMartes
    ? { min: 40, max: 45, texto: "40-45 min suaves" }
    : { min: 45, max: 50, texto: "45-50 min suaves" };
}

/**
 * Construye la lista de bloques del temporizador para una sesión de intervalos.
 * `clave` es una clave de INTERVALOS_F1 (1-7, "8m" o "8s").
 * Devuelve [{ tipo, segundos, etiqueta }] con calentamiento y enfriamiento incluidos.
 */
export function bloquesIntervalos(clave) {
  const p = INTERVALOS_F1[clave] ?? INTERVALOS_F1[1];
  const bloques = [{ tipo: "calienta", segundos: CALENTAMIENTO, etiqueta: "CALIENTA" }];
  for (let i = 0; i < p.reps; i++) {
    bloques.push({ tipo: "corre", segundos: p.corre, etiqueta: "CORRE", ronda: i + 1, rondas: p.reps });
    // La última repetición encadena directamente con el enfriamiento.
    if (p.camina > 0 && i < p.reps - 1) {
      bloques.push({ tipo: "camina", segundos: p.camina, etiqueta: "CAMINA", ronda: i + 1, rondas: p.reps });
    }
  }
  bloques.push({ tipo: "enfria", segundos: ENFRIAMIENTO, etiqueta: "ENFRÍA" });
  return bloques;
}

/** Minutos totales de una sesión de intervalos (con calentamiento y enfriamiento). */
export function minutosIntervalos(clave) {
  return Math.round(bloquesIntervalos(clave).reduce((t, b) => t + b.segundos, 0) / 60);
}
