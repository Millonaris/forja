/*
 * FORJA · Cuerpo.
 *
 * Las dos cosas que se registran a diario y que no son entreno: peso/kcal y
 * la rutina postural. Cada una tiene su pantalla completa; aquí se ve el
 * estado de hoy de un vistazo para poder entrar directo a lo que falta.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Cabecera from "../componentes/Cabecera.jsx";
import DialogoPeso from "../componentes/DialogoPeso.jsx";
import { useAjustes, useCuerpo as useRegistrosCuerpo, usePostura } from "../ganchos/useDatos.js";
import { idsPrincipales } from "../datos/rutinaPostural.js";
import { rachaPostural } from "../logica/diario.js";
import { hoyISO, semanaDelPlan } from "../logica/fechas.js";
import { conSigno, entero, peso as fmtPeso } from "../logica/formato.js";
import { calcularMantenimiento, mediaMovil, objetivoKcal, tendenciaSemanal } from "../logica/nutricion.js";

export default function Cuerpo() {
  const navegar = useNavigate();
  const { ajustes } = useAjustes();
  const registros = useRegistrosCuerpo(60);
  const posturaPorDia = usePostura();
  const [dialogo, setDialogo] = useState(false);

  const hoy = hoyISO();
  const semana = semanaDelPlan(ajustes.startDate, hoy);

  const medias = useMemo(() => mediaMovil(registros, 7), [registros]);
  const tendencia = useMemo(() => tendenciaSemanal(registros.slice(-21)), [registros]);
  const calculo = useMemo(() => calcularMantenimiento(registros), [registros]);

  const hoyRegistro = registros.find((r) => r.date === hoy);
  const mediaActual = medias.length ? medias[medias.length - 1].media : null;
  const mantenimiento = calculo.fiable ? calculo.kcal : ajustes.maintenanceKcal;
  const objetivo = objetivoKcal(mantenimiento, ajustes.deficitKcal ?? 250);

  const principales = idsPrincipales(semana);
  const posturaHoy = posturaPorDia.get(hoy);
  const hechos = principales.filter((p) => posturaHoy?.completedIds?.includes(p)).length;
  const racha = rachaPostural(posturaPorDia, hoy);

  return (
    <div className="f-pantalla">
      <Cabecera titulo="Cuerpo" sub={`SEMANA ${semana} DE 26`} />

      <div className="f-scroll">
        {/* ---- Peso y kcal ---- */}
        <button
          className="f-tarjeta"
          style={{ padding: 18, textAlign: "left", width: "100%", borderRadius: 18 }}
          onClick={() => navegar("/nutricion")}
        >
          <div className="f-fila-sb">
            <span className="f-etiqueta">PESO Y KCAL</span>
            <span style={{ color: "var(--f-texto3)", font: "600 16px/1 var(--f-ui)" }}>›</span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
            <div>
              <div className="f-cifra" style={{ fontSize: 46 }}>
                {mediaActual != null ? fmtPeso(mediaActual) : "—"}
                <span style={{ fontSize: 17, color: "var(--f-texto2)" }}> kg</span>
              </div>
              <div className="f-etiqueta" style={{ marginTop: 6 }}>MEDIA 7 DÍAS</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  font: "700 17px/1 var(--f-mono)",
                  color: tendencia == null ? "var(--f-texto2)" : tendencia < 0 ? "var(--f-ok)" : "var(--f-aviso)",
                }}
              >
                {tendencia != null ? conSigno(tendencia, 2) : "—"}
              </div>
              <div className="f-etiqueta" style={{ marginTop: 6, letterSpacing: ".1em" }}>KG / SEM</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid var(--f-borde-sutil)",
              font: "400 12.5px/1.3 var(--f-ui)",
              color: "var(--f-texto2)",
            }}
          >
            <span>
              Hoy: {hoyRegistro?.kg != null ? `${fmtPeso(hoyRegistro.kg)} kg` : "sin pesar"}
              {hoyRegistro?.kcal != null ? ` · ${entero(hoyRegistro.kcal)} kcal` : ""}
            </span>
            <span style={{ color: "var(--f-acento)" }}>{objetivo ? `objetivo ${entero(objetivo)}` : "sin objetivo"}</span>
          </div>
        </button>

        {/* ---- Postura ---- */}
        <button
          className={`f-tarjeta ${posturaHoy?.fullDone ? "f-tarjeta--ok" : ""}`}
          style={{ padding: 18, textAlign: "left", width: "100%", borderRadius: 18 }}
          onClick={() => navegar("/postura")}
        >
          <div className="f-fila-sb">
            <span className="f-etiqueta">POSTURA</span>
            <span style={{ color: "var(--f-texto3)", font: "600 16px/1 var(--f-ui)" }}>›</span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
            <div>
              <div
                className="f-cifra"
                style={{ fontSize: 40, color: posturaHoy?.fullDone ? "var(--f-ok)" : "var(--f-texto)" }}
              >
                {hechos}
                <span style={{ fontSize: 18, color: "var(--f-texto2)" }}>/{principales.length}</span>
              </div>
              <div className="f-etiqueta" style={{ marginTop: 6 }}>HOY</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="f-cifra" style={{ fontSize: 26, color: racha > 0 ? "var(--f-ok)" : "var(--f-texto3)" }}>
                {racha}
              </div>
              <div className="f-etiqueta" style={{ marginTop: 6, letterSpacing: ".1em" }}>RACHA</div>
            </div>
          </div>

          <div style={{ height: 8, borderRadius: 4, background: "var(--f-barra)", marginTop: 14, overflow: "hidden" }}>
            <span
              style={{
                display: "block",
                width: `${(hechos / principales.length) * 100}%`,
                height: "100%",
                background: posturaHoy?.fullDone ? "var(--f-ok)" : "var(--f-acento)",
              }}
            />
          </div>
        </button>
      </div>

      <div className="f-acciones">
        <div style={{ display: "flex", gap: 10 }}>
          <button className="f-boton" style={{ flex: 1 }} onClick={() => setDialogo(true)}>
            APUNTAR PESO
          </button>
          <button className="f-boton f-boton--acento-fantasma" style={{ flex: 1 }} onClick={() => navegar("/postura/rutina")}>
            RUTINA
          </button>
        </div>
      </div>

      {dialogo && <DialogoPeso fecha={hoy} onCerrar={() => setDialogo(false)} />}
    </div>
  );
}
