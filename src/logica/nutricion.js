/*
 * FORJA · Nutrición: peso, kcal y mantenimiento real.
 *
 * La idea: no usar una fórmula de internet para calcular cuánto gastas, sino
 * deducirlo de TUS datos. Si comiendo una media de 2 350 kcal pierdes 0,06 kg
 * al día, esos 0,06 kg salen de tu propio cuerpo (≈7 700 kcal por kilo de
 * grasa), así que tu gasto real es 2 350 + 0,06 × 7 700 ≈ 2 812 kcal.
 *
 *   mantenimiento = kcal media − (Δpeso por día × 7 700)
 *
 * El Δpeso es negativo cuando bajas, por eso el signo menos suma calorías.
 * La pendiente se saca por regresión lineal y no restando el primer y el
 * último peso: así una retención de líquidos un día suelto no descuadra nada.
 */

import { diasEntre, hoyISO, sumarDias } from "./fechas.js";

/** Calorías por kilo de tejido perdido/ganado. */
export const KCAL_POR_KG = 7700;

/** Mínimos para que el cálculo sea fiable. */
export const DIAS_MINIMOS = 10;
export const SEMANAS_MINIMAS = 2;

/** Ventana de análisis por defecto: 4 semanas. */
export const VENTANA_DIAS = 28;

/**
 * Media móvil de N días del peso. Suaviza el ruido diario (sal, agua, tránsito).
 * Devuelve [{ date, kg, media }] solo para los días con peso registrado.
 */
export function mediaMovil(registros, dias = 7) {
  const conPeso = registros.filter((r) => r.kg != null).sort((a, b) => a.date.localeCompare(b.date));
  return conPeso.map((r, i) => {
    const desde = Math.max(0, i - dias + 1);
    const ventana = conPeso.slice(desde, i + 1);
    return {
      date: r.date,
      kg: r.kg,
      media: ventana.reduce((t, x) => t + x.kg, 0) / ventana.length,
    };
  });
}

/**
 * Pendiente del peso en kg/día por mínimos cuadrados.
 * Devuelve null si no hay al menos 2 puntos separados en el tiempo.
 */
export function pendientePeso(registros) {
  const puntos = registros
    .filter((r) => r.kg != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ x: diasEntre(registros[0].date, r.date), y: r.kg }));

  if (puntos.length < 2) return null;

  const n = puntos.length;
  const sx = puntos.reduce((t, p) => t + p.x, 0);
  const sy = puntos.reduce((t, p) => t + p.y, 0);
  const sxy = puntos.reduce((t, p) => t + p.x * p.y, 0);
  const sxx = puntos.reduce((t, p) => t + p.x * p.x, 0);
  const denominador = n * sxx - sx * sx;
  if (denominador === 0) return null;

  return (n * sxy - sx * sy) / denominador;
}

/** Cambio de peso en kg por semana (negativo = estás bajando). */
export function tendenciaSemanal(registros) {
  const p = pendientePeso(registros);
  return p == null ? null : p * 7;
}

/**
 * Calcula el mantenimiento real con los datos de la ventana indicada.
 * Devuelve siempre un objeto con `fiable` para poder explicar en pantalla
 * qué falta cuando todavía no se puede calcular.
 */
export function calcularMantenimiento(registrosTodos, ventanaDias = VENTANA_DIAS, hasta = hoyISO()) {
  const desde = sumarDias(hasta, -(ventanaDias - 1));
  const ventana = registrosTodos
    .filter((r) => r.date >= desde && r.date <= hasta)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Solo cuentan los días con AMBOS datos: sin kcal no se puede cerrar el balance.
  const completos = ventana.filter((r) => r.kg != null && r.kcal != null);
  const conPeso = ventana.filter((r) => r.kg != null);

  const diasCubiertos = completos.length
    ? diasEntre(completos[0].date, completos[completos.length - 1].date) + 1
    : 0;
  const semanasCubiertas = diasCubiertos / 7;

  const fiable = completos.length >= DIAS_MINIMOS && semanasCubiertas >= SEMANAS_MINIMAS;

  if (!fiable) {
    return {
      fiable: false,
      kcal: null,
      dias: completos.length,
      faltanDias: Math.max(0, DIAS_MINIMOS - completos.length),
      semanas: semanasCubiertas,
      motivo:
        completos.length < DIAS_MINIMOS
          ? `Faltan ${Math.max(0, DIAS_MINIMOS - completos.length)} días con peso y kcal apuntados.`
          : "Hacen falta al menos 2 semanas de datos seguidos.",
    };
  }

  const kcalMedia = completos.reduce((t, r) => t + r.kcal, 0) / completos.length;
  const pendiente = pendientePeso(conPeso); // kg/día, negativo si bajas
  const mantenimiento = kcalMedia - pendiente * KCAL_POR_KG;

  return {
    fiable: true,
    kcal: Math.round(mantenimiento),
    kcalMedia: Math.round(kcalMedia),
    pendienteDia: pendiente,
    pendienteSemana: pendiente * 7,
    dias: completos.length,
    semanas: semanasCubiertas,
    desde: completos[0].date,
    hasta: completos[completos.length - 1].date,
  };
}

/** Objetivo diario = mantenimiento − déficit. */
export function objetivoKcal(mantenimiento, deficit = 250) {
  if (!mantenimiento) return null;
  return Math.round(mantenimiento - deficit);
}

/** Extra sugerido los días de tirada larga. */
export function extraTiradaLarga(km) {
  if (!km) return null;
  // 200 kcal para largas cortas, hasta 400 en las de 15 km o más.
  const extra = km >= 15 ? 400 : km >= 10 ? 300 : 200;
  return { extra, texto: `Hoy tocas tirada larga: come ${extra} kcal más de lo normal.` };
}

/**
 * Alertas de ritmo de pérdida. Devuelve como mucho una alerta, la más urgente.
 * - Bajar más de 0,5 kg/semana quema músculo y rendimiento → subir kcal.
 * - Tres semanas sin bajar → el mantenimiento ha cambiado, bajar kcal.
 * - Cada 3-4 semanas conviene recalcular el mantenimiento.
 */
export function alertaNutricion(registros, ultimoRecalculo = null) {
  const tendencia = tendenciaSemanal(
    registros.filter((r) => r.date >= sumarDias(hoyISO(), -20)),
  );

  if (tendencia != null && tendencia < -0.5) {
    return {
      nivel: "aviso",
      titulo: "Estás bajando demasiado rápido.",
      texto: `Llevas ${Math.abs(tendencia).toFixed(1).replace(".", ",")} kg/semana. Sube 150 kcal al objetivo diario para no perder fuerza.`,
      accion: { tipo: "subir", kcal: 150 },
    };
  }

  // Tres semanas sin bajar: se compara la media de cada semana.
  const semanas = mediasSemanales(registros).slice(-3);
  if (semanas.length === 3 && semanas.every((s) => s.kg != null)) {
    const bajada = semanas[0].kg - semanas[2].kg;
    if (bajada <= 0.15) {
      return {
        nivel: "aviso",
        titulo: "Tres semanas sin bajar.",
        texto: "El peso lleva tres semanas plano: baja 150 kcal al objetivo diario y revisa en dos semanas.",
        accion: { tipo: "bajar", kcal: 150 },
      };
    }
  }

  if (ultimoRecalculo && diasEntre(ultimoRecalculo, hoyISO()) >= 28) {
    return {
      nivel: "info",
      titulo: "Toca recalcular el mantenimiento.",
      texto: "Han pasado más de 4 semanas desde el último cálculo. Tu gasto cambia con el peso y el entrenamiento.",
      accion: { tipo: "recalcular" },
    };
  }

  if (tendencia != null && tendencia < 0) {
    return {
      nivel: "ok",
      titulo: "Ritmo correcto.",
      texto: `${Math.abs(tendencia).toFixed(2).replace(".", ",")} kg/semana está en el rango bueno. Sigue igual.`,
      accion: null,
    };
  }

  return null;
}

/** Media de peso y kcal por semana natural, para las gráficas y las alertas. */
export function mediasSemanales(registros) {
  const porSemana = new Map();
  for (const r of registros) {
    // Clave = lunes de esa semana.
    const dow = new Date(r.date.replace(/-/g, "/")).getDay();
    const offset = dow === 0 ? 6 : dow - 1;
    const lunes = sumarDias(r.date, -offset);
    if (!porSemana.has(lunes)) porSemana.set(lunes, { lunes, pesos: [], kcals: [] });
    if (r.kg != null) porSemana.get(lunes).pesos.push(r.kg);
    if (r.kcal != null) porSemana.get(lunes).kcals.push(r.kcal);
  }

  return [...porSemana.values()]
    .sort((a, b) => a.lunes.localeCompare(b.lunes))
    .map((s) => ({
      lunes: s.lunes,
      kg: s.pesos.length ? s.pesos.reduce((t, x) => t + x, 0) / s.pesos.length : null,
      kcal: s.kcals.length ? s.kcals.reduce((t, x) => t + x, 0) / s.kcals.length : null,
      dias: s.pesos.length,
    }));
}
