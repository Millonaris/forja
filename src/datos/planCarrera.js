/*
 * FORJA · Plan de carrera 0 → 20K en 26 semanas.
 *
 * Fase 1 (sem 1-8):  2 días/semana. Intervalos corre/camina progresivos.
 * Fase 2 (sem 9-16): 3 días/semana. Dos cortas + una tirada larga que crece.
 * Fase 3 (sem 17-26): 3 días/semana. Cortas más largas + larga hasta 18 km,
 *                     y la semana 26 es descarga (tapering) + el 20K.
 *
 * Todas las sesiones de fase 1 llevan 5' de calentamiento andando y
 * 5' de enfriamiento andando; no se cuentan como "corre".
 */

const MIN = 60; // segundos por minuto, para que los bloques se lean solos

/**
 * Protocolo de intervalos de cada semana de la fase 1.
 * repeticiones × (segundos corriendo + segundos caminando)
 */
export const INTERVALOS_F1 = {
  1: { reps: 8, corre: 1 * MIN, camina: 2 * MIN, texto: "8×(1′ corre + 2′ camina)" },
  2: { reps: 7, corre: 2 * MIN, camina: 2 * MIN, texto: "7×(2′ corre + 2′ camina)" },
  3: { reps: 6, corre: 3 * MIN, camina: 2 * MIN, texto: "6×(3′ corre + 2′ camina)" },
  4: { reps: 5, corre: 4 * MIN, camina: 90, texto: "5×(4′ corre + 90″ camina)" },
  5: { reps: 4, corre: 6 * MIN, camina: 90, texto: "4×(6′ corre + 90″ camina)" },
  6: { reps: 3, corre: 8 * MIN, camina: 90, texto: "3×(8′ corre + 90″ camina)" },
  7: { reps: 2, corre: 12 * MIN, camina: 2 * MIN, texto: "2×(12′ corre + 2′ camina)" },
  8: { reps: 1, corre: 30 * MIN, camina: 0, texto: "30′ seguidos" },
};

export const CALENTAMIENTO = 5 * MIN;
export const ENFRIAMIENTO = 5 * MIN;

/**
 * Tirada larga por semana en fases 2 y 3, en km.
 * `descarga: true` marca las semanas en las que la larga BAJA a propósito
 * para asimilar carga; no es un fallo del plan.
 */
export const LARGAS = {
  // Fase 2
  9: { km: 5 },
  10: { km: 6 },
  11: { km: 7 },
  12: { km: 5, descarga: true },
  13: { km: 8 },
  14: { km: 9 },
  15: { km: 10 },
  16: { km: 6, descarga: true },
  // Fase 3
  17: { km: 11 },
  18: { km: 12 },
  19: { km: 13 },
  20: { km: 8, descarga: true },
  21: { km: 14 },
  22: { km: 15.5 },
  23: { km: 17 },
  24: { km: 10, descarga: true },
  25: { km: 18 },
  26: { km: 20, carrera: true }, // el día del 20K
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

/** Duración objetivo de las carreras cortas según la fase. */
export function minutosCorta(semana) {
  const fase = faseDeSemana(semana);
  if (fase === 2) return { min: 30, max: 35, texto: "30-35 min suaves" };
  return { min: 35, max: 40, texto: "35-40 min suaves" };
}

/**
 * Construye la lista de bloques del temporizador para una sesión de intervalos.
 * Devuelve [{ tipo, segundos, etiqueta }] con calentamiento y enfriamiento incluidos.
 */
export function bloquesIntervalos(semana) {
  const p = INTERVALOS_F1[Math.min(Math.max(semana, 1), 8)];
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
export function minutosIntervalos(semana) {
  return Math.round(bloquesIntervalos(semana).reduce((t, b) => t + b.segundos, 0) / 60);
}
