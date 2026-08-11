/*
 * FORJA · Informe de entrenamiento.
 *
 * Comprime todo lo que la app sabe de ti en un texto corto que se puede pegar
 * en Claude para pedir revisión. Es deliberadamente compacto: interesa que
 * quepan las CONCLUSIONES (veredictos, volumen, tendencias) y no el registro
 * serie a serie, que ocuparía diez veces más y no aporta nada al análisis.
 *
 * El mismo texto alimenta la consulta directa a la API (ver utiles/claude.js),
 * así que cualquier mejora aquí se nota en las dos vías.
 */

import { db } from "../datos/db.js";
import { EJERCICIOS } from "../datos/ejercicios.js";
import { OBJETIVO_SERIES, RANGO_SERIES, nombreMusculo } from "../datos/musculos.js";
import { SEMANAS_PLAN, planDelDia } from "../logica/calendario.js";
import { formatoCorto, hoyISO, semanaDelPlan } from "../logica/fechas.js";
import { num } from "../logica/formato.js";
import { interferenciaEnHistorial } from "../logica/interferencia.js";
import { calcularMantenimiento, tendenciaSemanal } from "../logica/nutricion.js";
import { agruparPorSesion, semaforoGlobal, veredictoEjercicio } from "../logica/veredictos.js";
import { veredictosCarrera } from "../logica/veredictosCarrera.js";
import { estadoVolumen, seriesPorMusculo } from "../logica/volumen.js";

/** Genera el informe completo en texto plano (markdown ligero). */
export async function generarInforme() {
  const hoy = hoyISO();
  const [ajustes, sesiones, sets, carreras, cuerpo] = await Promise.all([
    db.settings.get(1),
    db.gymSessions.toArray(),
    db.gymSets.toArray(),
    db.runs.toArray(),
    db.bodyLog.toArray(),
  ]);

  const inicio = ajustes?.startDate ?? hoy;
  const desfase = ajustes?.desfaseCarrera || 0;
  const semana = semanaDelPlan(inicio, hoy) + desfase;
  const mapaSesiones = new Map(sesiones.map((s) => [s.id, s]));

  const l = [];
  l.push("# Informe de entrenamiento · FORJA");
  l.push("");
  l.push(`Fecha: ${formatoCorto(hoy)} · Semana ${Math.min(semana, SEMANAS_PLAN)} de ${SEMANAS_PLAN} del plan.`);
  l.push(
    "Plan: híbrido. Gimnasio 3 días (L-X-V) en rotación Torso A / Pierna A / Torso B / Pierna B, " +
      "doble progresión y 1-2 RIR (fallo total solo en la última serie de laterales y curls). " +
      "Carrera 0→20K en 26 semanas. Objetivo: hipertrofia + capacidad aeróbica.",
  );
  l.push("");

  // Sin esto, cualquier lectura del informe recomendaría subir el pecho a
  // 10-20 series, que es justo lo contrario de lo que este plan ha decidido.
  l.push("### Decisiones del plan que no hay que revertir");
  for (const [musculo, o] of Object.entries(OBJETIVO_SERIES)) {
    l.push(`- ${nombreMusculo(musculo)}: objetivo ${o.min}-${o.max} series/semana. ${o.nota}`);
  }
  l.push(
    "- Ratio tirón/empuje: no se cuenta. Lo que no se salta nunca son remos, face pull y hombro posterior.",
  );
  l.push("");

  // ---------- Gimnasio ----------
  l.push("## Gimnasio");
  if (!sets.length) {
    l.push("Sin series registradas todavía.");
  } else {
    const porEjercicio = new Map();
    for (const s of sets) {
      if (!porEjercicio.has(s.exerciseId)) porEjercicio.set(s.exerciseId, []);
      porEjercicio.get(s.exerciseId).push(s);
    }

    const veredictos = EJERCICIOS.map((ejercicio) => {
      const historial = agruparPorSesion(porEjercicio.get(ejercicio.id) || [], mapaSesiones, ejercicio);
      const interferencia = interferenciaEnHistorial(ejercicio, historial, carreras, Math.min(historial.length, 4));
      return { ejercicio, historial, veredicto: veredictoEjercicio(ejercicio, historial, { interferencia }) };
    }).filter((v) => v.historial.length > 0);

    const cuenta = (estado) => veredictos.filter((v) => v.veredicto.estado === estado).length;
    l.push(
      `${sesiones.length} sesiones registradas. Progresan ${cuenta("progresa")}, ` +
        `manteniendo ${cuenta("mantiene")}, estancados ${cuenta("estancado")}, bajando ${cuenta("baja")}.`,
    );
    l.push("");

    // Solo lo que necesita decisión: lo que va bien no hace falta analizarlo.
    const problemas = semaforoGlobal(veredictos).filter((v) =>
      ["estancado", "baja"].includes(v.veredicto.estado),
    );
    if (problemas.length) {
      l.push("### Necesitan decisión");
      for (const { ejercicio, veredicto, historial } of problemas) {
        const ult = historial[historial.length - 1];
        const rir = ult?.rirMedio != null ? `, RIR medio ${ult.rirMedio.toFixed(1)}` : ", sin RIR anotado";
        l.push(
          `- **${ejercicio.name}** (${ejercicio.sessionName}): ${veredicto.titular}. ` +
            `Última: ${num(ult?.mejorKg ?? 0, 1)} kg × ${ult?.mejorReps ?? 0}${rir}. ` +
            `Diagnóstico de la app: ${veredicto.detalle} Sugerencia: ${veredicto.sugerencia}`,
        );
      }
      l.push("");
    }

    // Lo que va bien se resume, no se enumera: treinta nombres se comerían el
    // informe y no cambian ninguna decisión. Solo se citan los que más suben,
    // que sí dicen algo sobre dónde está funcionando el estímulo.
    const bien = veredictos
      .filter((v) => v.veredicto.estado === "progresa")
      .sort((a, b) => (b.historial.length || 0) - (a.historial.length || 0));
    if (bien.length) {
      l.push("### Progresando");
      const destacados = bien.slice(0, 5).map((v) => `${v.ejercicio.name} (${v.veredicto.titular})`);
      l.push(
        `${bien.length} ejercicios subiendo. Los de racha más larga: ${destacados.join(", ")}.` +
          (bien.length > destacados.length ? ` El resto (${bien.length - destacados.length}) también sube.` : ""),
      );
      l.push("");
    }

    // Series sin RIR: sin ese dato el diagnóstico de estancamiento es a ciegas.
    const trabajo = sets.filter((s) => !s.isWarmup);
    const conRir = trabajo.filter((s) => s.rir != null).length;
    l.push(
      conRir === 0
        ? "Nota: todavía no hay RIR anotado en ninguna serie, así que no se puede distinguir fatiga de falta de intensidad."
        : `RIR anotado en ${Math.round((conRir / trabajo.length) * 100)} % de las series de trabajo.`,
    );
    l.push("");

    // ---------- Volumen ----------
    const volumen = seriesPorMusculo(sets, mapaSesiones, hoy, 4);
    if (volumen.length) {
      l.push(`### Series semanales por músculo (media de semanas completas; objetivo por defecto ${RANGO_SERIES.min}-${RANGO_SERIES.max}, salvo los de arriba)`);
      for (const m of volumen) {
        const est = estadoVolumen(m.media, m.musculo);
        l.push(`- ${m.nombre}: ${m.media == null ? "sin semana completa" : num(m.media, 1)} — ${est.texto}`);
      }
      l.push("");
    }
  }

  // ---------- Carrera ----------
  l.push("## Carrera");
  if (!carreras.length) {
    l.push("Sin carreras registradas todavía.");
  } else {
    const v = veredictosCarrera(carreras, hoy);
    l.push(`${carreras.length} carreras registradas.`);
    l.push(`- Ritmo (${v.ritmo.tipo}): ${v.ritmo.titular}. ${v.ritmo.detalle}`);
    l.push(`- Volumen: ${v.volumen.titular}. ${v.volumen.detalle}${v.volumen.accion ? ` ${v.volumen.accion}` : ""}`);
    l.push(`- Base aeróbica: ${v.base.titular}. ${v.base.detalle}`);
  }
  l.push("");

  // ---------- Cuerpo ----------
  l.push("## Peso y nutrición");
  if (!cuerpo.length) {
    l.push("Sin registros de peso.");
  } else {
    const calculo = calcularMantenimiento(cuerpo, 28, hoy);
    const tendencia = tendenciaSemanal(cuerpo.slice(-21));
    const ultimo = [...cuerpo].sort((a, b) => b.date.localeCompare(a.date)).find((r) => r.kg != null);
    l.push(`- Peso actual: ${ultimo ? `${num(ultimo.kg, 1)} kg` : "sin dato"}.`);
    l.push(`- Tendencia: ${tendencia != null ? `${num(tendencia, 2)} kg/semana` : "sin datos suficientes"}.`);
    l.push(
      `- Mantenimiento real: ${
        calculo.fiable ? `${calculo.kcal} kcal (calculado con ${calculo.dias} días)` : `sin calcular (${calculo.motivo})`
      }.`,
    );
    l.push(`- Objetivo: mantenimiento −${ajustes?.deficitKcal ?? 250} kcal, proteína ${ajustes?.proteinTarget ?? 180} g.`);
  }
  l.push("");

  // ---------- Contexto del día ----------
  const plan = planDelDia(inicio, hoy, desfase);
  if (plan) {
    const que = plan.gym
      ? `gimnasio (${plan.gym.sessionName})`
      : plan.carrera
        ? `carrera (${plan.carrera.detalle})`
        : "descanso";
    l.push(`Hoy toca: ${que}.`);
    l.push("");
  }

  l.push("---");
  l.push(
    "Pregunta: revisa esto como entrenador de híbrido (hipertrofia + carrera). " +
      "Dime qué cambiarías esta semana y por qué, priorizando lo que más me frena.",
  );

  return l.join("\n");
}

/** Copia el informe al portapapeles. Devuelve el texto por si hace falta. */
export async function copiarInforme() {
  const texto = await generarInforme();
  try {
    await navigator.clipboard.writeText(texto);
    return { texto, copiado: true };
  } catch {
    // Sin permiso de portapapeles (o contexto no seguro): se devuelve igual
    // para poder enseñarlo en pantalla y que se copie a mano.
    return { texto, copiado: false };
  }
}
