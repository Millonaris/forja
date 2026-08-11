/*
 * FORJA · Peso y calorías.
 *
 * El número que manda no es el peso de la báscula de hoy, es la media de 7
 * días: el peso diario sube y baja 800 g por sal, agua y tránsito, y mirarlo
 * en crudo lleva a tomar decisiones equivocadas.
 *
 * El mantenimiento no viene de una fórmula: se deduce de tus propios datos
 * (ver logica/nutricion.js). Hasta que no hay 10 días con peso Y kcal en al
 * menos 2 semanas, la app dice claramente qué le falta en vez de inventarse
 * un número.
 */

import { useMemo, useState } from "react";

import Cabecera from "../componentes/Cabecera.jsx";
import DialogoPeso from "../componentes/DialogoPeso.jsx";
import Grafica from "../componentes/Grafica.jsx";
import { useAjustes, useCuerpo } from "../ganchos/useDatos.js";
import { guardarAjustes } from "../datos/db.js";
import { planDelDia } from "../logica/calendario.js";
import { formatoCorto, hoyISO } from "../logica/fechas.js";
import { conSigno, entero, num, peso as fmtPeso } from "../logica/formato.js";
import {
  alertaNutricion,
  calcularMantenimiento,
  extraTiradaLarga,
  mediaMovil,
  objetivoKcal,
  tendenciaSemanal,
} from "../logica/nutricion.js";

export default function Nutricion() {
  const { ajustes } = useAjustes();
  const registros = useCuerpo(120);
  const [dialogo, setDialogo] = useState(false);

  const hoy = hoyISO();
  const plan = planDelDia(ajustes.startDate, hoy, ajustes.desfaseCarrera || 0);

  const calculo = useMemo(() => calcularMantenimiento(registros), [registros]);
  const medias = useMemo(() => mediaMovil(registros, 7), [registros]);
  const tendencia = useMemo(() => tendenciaSemanal(registros.slice(-21)), [registros]);
  const alerta = useMemo(
    () => alertaNutricion(registros, ajustes.ultimoCalculoKcal),
    [registros, ajustes.ultimoCalculoKcal],
  );

  const hoyRegistro = registros.find((r) => r.date === hoy);
  const mantenimiento = calculo.fiable ? calculo.kcal : ajustes.maintenanceKcal;
  const objetivoBase = objetivoKcal(mantenimiento, ajustes.deficitKcal ?? 250);

  // Los días de tirada larga el objetivo sube: correr 15 km no se compensa solo.
  const extra = plan?.carrera?.tipo === "larga" ? extraTiradaLarga(plan.carrera.km) : null;
  const objetivo = objetivoBase ? objetivoBase + (extra?.extra || 0) : null;

  const mediaActual = medias.length ? medias[medias.length - 1].media : null;
  const primeraMedia = medias.length ? medias[0].media : null;

  const guardarMantenimiento = async () => {
    await guardarAjustes({
      maintenanceKcal: calculo.kcal,
      targetKcal: objetivoKcal(calculo.kcal, ajustes.deficitKcal ?? 250),
      ultimoCalculoKcal: hoy,
    });
  };

  return (
    <div className="f-pantalla">
      <Cabecera titulo="Peso y kcal" atras />

      <div className="f-scroll">
        {/* ---- Tendencia ---- */}
        <div className="f-tarjeta" style={{ padding: 16, borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div className="f-etiqueta">TENDENCIA · MEDIA 7 DÍAS</div>
              <div className="f-cifra" style={{ fontSize: 46, marginTop: 10 }}>
                {mediaActual != null ? fmtPeso(mediaActual) : "—"}
                <span style={{ fontSize: 18, color: "var(--f-texto2)" }}> kg</span>
              </div>
            </div>
            <div style={{ textAlign: "right", flex: "none" }}>
              <div
                style={{
                  font: "700 17px/1 var(--f-mono)",
                  color: tendencia == null ? "var(--f-texto2)" : tendencia < 0 ? "var(--f-ok)" : "var(--f-aviso)",
                }}
              >
                {tendencia != null ? conSigno(tendencia, 2) : "—"}
              </div>
              <div className="f-etiqueta" style={{ marginTop: 6, letterSpacing: ".1em" }}>KG / SEMANA</div>
            </div>
          </div>

          {medias.length > 1 ? (
            <>
              <div style={{ marginTop: 16 }}>
                <Grafica
                  tipo="line"
                  etiquetas={medias.map((m) => formatoCorto(m.date))}
                  valores={medias.map((m) => Math.round(m.media * 10) / 10)}
                  alto={96}
                  formato={(v) => `${num(v, 1)} kg de media`}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 9,
                  font: "500 9.5px/1 var(--f-mono)",
                  color: "var(--f-texto3)",
                }}
              >
                <span>{formatoCorto(medias[0].date).toUpperCase()} · {fmtPeso(primeraMedia)}</span>
                <span style={{ color: "var(--f-acento)" }}>HOY · {fmtPeso(mediaActual)}</span>
              </div>
            </>
          ) : (
            <div style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 12 }}>
              Con dos pesajes ya aparece la línea de tendencia.
            </div>
          )}
        </div>

        {/* ---- Alerta de ritmo ---- */}
        {alerta && (
          <div
            className={`f-tarjeta ${alerta.nivel === "aviso" ? "f-tarjeta--aviso" : alerta.nivel === "ok" ? "f-tarjeta--ok" : ""}`}
            style={{ padding: "13px 15px", display: "flex", gap: 12, alignItems: "flex-start" }}
          >
            <span
              className="f-punto"
              style={{
                background: alerta.nivel === "aviso" ? "var(--f-aviso)" : alerta.nivel === "ok" ? "var(--f-ok)" : "var(--f-acento)",
                marginTop: 5,
              }}
            />
            <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)" }}>
              <strong
                style={{
                  color: alerta.nivel === "aviso" ? "var(--f-aviso)" : alerta.nivel === "ok" ? "var(--f-ok)" : "var(--f-acento)",
                }}
              >
                {alerta.titulo}
              </strong>{" "}
              {alerta.texto}
            </div>
          </div>
        )}

        {/* ---- Mantenimiento y objetivo ---- */}
        <div className="f-duo">
          <div className="f-tarjeta" style={{ padding: 13 }}>
            <div className="f-etiqueta" style={{ fontSize: 9.5, letterSpacing: ".12em" }}>MANTENIMIENTO REAL</div>
            <div className="f-cifra" style={{ fontSize: 30, marginTop: 9 }}>
              {mantenimiento ? entero(mantenimiento) : "—"}
            </div>
            <div style={{ font: "400 11.5px/1.3 var(--f-ui)", color: "var(--f-texto2)", marginTop: 4 }}>
              {calculo.fiable ? `calculado con ${calculo.dias} días` : calculo.motivo}
            </div>
          </div>
          <div className="f-tarjeta" style={{ padding: 13 }}>
            <div className="f-etiqueta" style={{ fontSize: 9.5, letterSpacing: ".12em" }}>OBJETIVO DE HOY</div>
            <div className="f-cifra f-acento" style={{ fontSize: 30, marginTop: 9 }}>
              {objetivo ? entero(objetivo) : "—"}
            </div>
            <div style={{ font: "400 11.5px/1.3 var(--f-ui)", color: "var(--f-texto2)", marginTop: 4 }}>
              {objetivo ? `déficit −${ajustes.deficitKcal ?? 250}${extra ? ` +${extra.extra} larga` : ""}` : "falta el mantenimiento"}
            </div>
          </div>
        </div>

        {calculo.fiable && ajustes.maintenanceKcal !== calculo.kcal && (
          <button className="f-boton f-boton--acento-fantasma f-boton--peq" onClick={guardarMantenimiento}>
            FIJAR {entero(calculo.kcal)} KCAL COMO MANTENIMIENTO
          </button>
        )}

        {extra && (
          <div className="f-tarjeta f-tarjeta--aviso" style={{ padding: "13px 15px" }}>
            <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)" }}>
              {extra.texto}
            </div>
          </div>
        )}

        {/* ---- Lo que llevas hoy ---- */}
        <div className="f-tarjeta" style={{ padding: "13px 15px", borderRadius: 16 }}>
          <div className="f-fila-sb" style={{ font: "500 10px/1 var(--f-mono)", letterSpacing: ".12em", color: "var(--f-texto3)" }}>
            <span>LLEVAS HOY</span>
            <span>
              {hoyRegistro?.kcal != null ? entero(hoyRegistro.kcal) : "—"} / {objetivo ? entero(objetivo) : "—"} kcal
            </span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: "var(--f-barra)", marginTop: 11, overflow: "hidden" }}>
            <span
              style={{
                display: "block",
                width: `${objetivo && hoyRegistro?.kcal ? Math.min(100, (hoyRegistro.kcal / objetivo) * 100) : 0}%`,
                height: "100%",
                background: hoyRegistro?.kcal > (objetivo || Infinity) ? "var(--f-aviso)" : "var(--f-acento)",
                borderRadius: 5,
              }}
            />
          </div>
          <div className="f-fila-sb" style={{ marginTop: 12 }}>
            <span className="f-etiqueta">PROTEÍNA OBJETIVO</span>
            <span className="f-cifra" style={{ fontSize: 20 }}>
              {ajustes.proteinTarget ?? 180}<span style={{ fontSize: 12, color: "var(--f-texto2)" }}> g</span>
            </span>
          </div>
        </div>
      </div>

      <div className="f-acciones">
        <div style={{ display: "flex", gap: 10 }}>
          <button className="f-boton" style={{ flex: 1, minHeight: 74, flexDirection: "column", gap: 3, borderRadius: 18 }} onClick={() => setDialogo(true)}>
            <span style={{ font: "800 21px/1 var(--f-display)", letterSpacing: ".06em", whiteSpace: "nowrap" }}>
              APUNTAR PESO
            </span>
            <span style={{ font: "500 10.5px/1 var(--f-mono)", opacity: 0.8, letterSpacing: 0, textTransform: "none" }}>
              {mediaActual != null ? `se abre en ${fmtPeso(registros[registros.length - 1]?.kg ?? mediaActual)}` : "primer registro"}
            </span>
          </button>
          <button
            className="f-boton f-boton--acento-fantasma"
            style={{ flex: 1, minHeight: 74, flexDirection: "column", gap: 3, borderRadius: 18 }}
            onClick={() => setDialogo(true)}
          >
            <span style={{ font: "800 21px/1 var(--f-display)", letterSpacing: ".06em", whiteSpace: "nowrap" }}>+ KCAL</span>
            <span style={{ font: "500 10.5px/1 var(--f-mono)", opacity: 0.8, letterSpacing: 0, textTransform: "none" }}>
              teclado numérico
            </span>
          </button>
        </div>
      </div>

      {dialogo && <DialogoPeso fecha={hoy} onCerrar={() => setDialogo(false)} />}
    </div>
  );
}
