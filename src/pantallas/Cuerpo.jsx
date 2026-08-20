/*
 * FORJA · Cuerpo.
 *
 * El peso manda: el objetivo es pesarse CADA día, así que lo primero es el
 * peso de hoy en grande, luego la gráfica diaria y la tabla día a día (cada
 * fila se puede tocar para corregirla). De dieta, nada: eso lo lleva Fitia.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Cabecera from "../componentes/Cabecera.jsx";
import DialogoPeso from "../componentes/DialogoPeso.jsx";
import Grafica from "../componentes/Grafica.jsx";
import { useAjustes, useCuerpo as useRegistrosCuerpo, usePostura } from "../ganchos/useDatos.js";
import { idsPrincipales } from "../datos/rutinaPostural.js";
import { rachaPostural } from "../logica/diario.js";
import { faseDietaDe, proximoHitoDieta } from "../datos/planDieta.js";
import { formatoCorto, formatoDia, hoyISO, semanaDelPlan } from "../logica/fechas.js";
import { conSigno, num, peso as fmtPeso } from "../logica/formato.js";
import { mediaMovil, tendenciaSemanal } from "../logica/peso.js";

export default function Cuerpo() {
  const navegar = useNavigate();
  const { ajustes } = useAjustes();
  const registros = useRegistrosCuerpo(90);
  const posturaPorDia = usePostura();
  // Fecha abierta en el diálogo de peso: hoy desde el botón, o un día
  // concreto tocando su fila de la tabla para corregirlo.
  const [dialogo, setDialogo] = useState(null);

  const hoy = hoyISO();
  const semana = semanaDelPlan(ajustes.startDate, hoy);

  const medias = useMemo(() => mediaMovil(registros, 7), [registros]);
  const tendencia = useMemo(() => tendenciaSemanal(registros.slice(-21)), [registros]);

  // Solo los días con peso apuntado, ordenados de antiguo a reciente.
  const pesajes = useMemo(() => registros.filter((r) => r.kg != null), [registros]);
  const hoyRegistro = registros.find((r) => r.date === hoy);
  const ultimo = pesajes[pesajes.length - 1] ?? null;

  const mediaActual = medias.length ? medias[medias.length - 1].media : null;

  const faseDieta = faseDietaDe(hoy);
  const hitoDieta = proximoHitoDieta(hoy);

  const principales = idsPrincipales(semana);
  const posturaHoy = posturaPorDia.get(hoy);
  const hechos = principales.filter((p) => posturaHoy?.completedIds?.includes(p)).length;
  const racha = rachaPostural(posturaPorDia, hoy);

  // Tabla día a día: los últimos 14 pesajes, del más reciente al más antiguo,
  // cada uno con su diferencia respecto al pesaje anterior.
  const tabla = useMemo(() => {
    const filas = pesajes.map((r, i) => ({
      ...r,
      dif: i > 0 ? Math.round((r.kg - pesajes[i - 1].kg) * 10) / 10 : null,
    }));
    return filas.slice(-14).reverse();
  }, [pesajes]);

  return (
    <div className="f-pantalla">
      <Cabecera titulo="Cuerpo" sub={`SEMANA ${semana} DE 26`} />

      <div className="f-scroll">
        {/* ---- El peso de hoy, en grande ---- */}
        <button
          className={`f-tarjeta ${hoyRegistro?.kg != null ? "f-tarjeta--ok" : "f-tarjeta--destacada"}`}
          style={{ padding: 18, textAlign: "left", width: "100%", borderRadius: 18 }}
          onClick={() => setDialogo(hoy)}
        >
          <div
            className="f-etiqueta"
            style={{ color: hoyRegistro?.kg != null ? "var(--f-ok)" : "var(--f-acento)", letterSpacing: ".16em" }}
          >
            {hoyRegistro?.kg != null ? "PESO DE HOY · APUNTADO" : "PESO DE HOY · SIN PESAR AÚN"}
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginTop: 10 }}>
            <div>
              <div className="f-cifra" style={{ fontSize: 56 }}>
                {hoyRegistro?.kg != null ? fmtPeso(hoyRegistro.kg) : ultimo ? fmtPeso(ultimo.kg) : "—"}
                <span style={{ fontSize: 19, color: "var(--f-texto2)" }}> kg</span>
              </div>
              {hoyRegistro?.kg == null && (
                <div style={{ font: "400 12px/1.3 var(--f-ui)", color: "var(--f-texto3)", marginTop: 5 }}>
                  {ultimo ? `último apuntado · ${formatoDia(ultimo.date)}` : "toca para apuntar el primero"}
                </div>
              )}
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
              <div className="f-etiqueta" style={{ marginTop: 6, letterSpacing: ".1em" }}>KG / SEM</div>
            </div>
          </div>
        </button>

        {/* ---- Gráfica del peso diario ---- */}
        <div className="f-tarjeta" style={{ padding: "14px 15px", borderRadius: 16 }}>
          <div className="f-fila-sb" style={{ marginBottom: 12 }}>
            <span className="f-etiqueta">PESO DÍA A DÍA · ÚLTIMOS 30</span>
            {mediaActual != null && (
              <span style={{ font: "500 10px/1 var(--f-mono)", color: "var(--f-texto3)" }}>
                MEDIA 7D · {fmtPeso(mediaActual)} KG
              </span>
            )}
          </div>
          {pesajes.length > 1 ? (
            <>
              <Grafica
                tipo="line"
                etiquetas={pesajes.slice(-30).map((r) => formatoCorto(r.date))}
                valores={pesajes.slice(-30).map((r) => r.kg)}
                alto={110}
                formato={(v) => `${num(v, 1)} kg`}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 9,
                  font: "500 9.5px/1 var(--f-mono)",
                  color: "var(--f-texto3)",
                }}
              >
                <span>{formatoCorto(pesajes.slice(-30)[0].date).toUpperCase()} · {fmtPeso(pesajes.slice(-30)[0].kg)}</span>
                <span style={{ color: "var(--f-acento)" }}>
                  {formatoCorto(ultimo.date).toUpperCase()} · {fmtPeso(ultimo.kg)}
                </span>
              </div>
            </>
          ) : (
            <div style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto3)" }}>
              Con dos pesajes ya aparece la línea. Lo importante: pesarse cada día, a la misma hora.
            </div>
          )}
        </div>

        {/* ---- Tabla día a día ---- */}
        <div className="f-tarjeta" style={{ padding: "14px 4px 6px", borderRadius: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0 13px 12px",
              font: "500 10px/1 var(--f-mono)",
              letterSpacing: ".14em",
              color: "var(--f-texto3)",
            }}
          >
            <span>DÍA A DÍA</span>
            <span>VS DÍA ANTERIOR</span>
          </div>
          {tabla.length === 0 ? (
            <div style={{ padding: "4px 13px 14px", font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto3)" }}>
              En cuanto apuntes el primer peso aparecerá aquí su lista.
            </div>
          ) : (
            tabla.map((r) => (
              <button
                key={r.date}
                onClick={() => setDialogo(r.date)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 13px",
                  borderTop: "1px solid var(--f-borde-sutil)",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", font: "500 13.5px/1.2 var(--f-ui)" }}>
                    {formatoDia(r.date)}
                    {r.date === hoy ? " · hoy" : ""}
                  </span>
                </span>
                <span className="f-cifra" style={{ fontSize: 20, flex: "none" }}>
                  {fmtPeso(r.kg)} <span style={{ fontSize: 12, color: "var(--f-texto2)" }}>kg</span>
                </span>
                <span
                  style={{
                    flex: "none",
                    width: 52,
                    textAlign: "right",
                    font: "700 13px/1 var(--f-mono)",
                    color: r.dif == null ? "var(--f-texto3)" : r.dif < 0 ? "var(--f-ok)" : r.dif > 0 ? "var(--f-aviso)" : "var(--f-texto3)",
                  }}
                >
                  {r.dif == null ? "·" : r.dif === 0 ? "=" : conSigno(r.dif, 1)}
                </span>
              </button>
            ))
          )}
          {tabla.length > 0 && (
            <div style={{ padding: "10px 13px 8px", font: "400 11.5px/1.4 var(--f-ui)", color: "var(--f-texto3)" }}>
              Toca un día para corregir su peso.
            </div>
          )}
        </div>

        {/* ---- Dieta: el objetivo de la fase; el plan entero, en su pantalla ---- */}
        <button
          className="f-tarjeta"
          style={{ padding: "14px 15px", borderRadius: 16, width: "100%", textAlign: "left" }}
          onClick={() => navegar("/dieta")}
        >
          <div className="f-fila-sb">
            <span className="f-etiqueta">
              DIETA · {faseDieta ? faseDieta.nombre : "EMPIEZA EL LUNES 24"}
            </span>
            <span style={{ color: "var(--f-texto3)", font: "600 16px/1 var(--f-ui)" }}>›</span>
          </div>

          {faseDieta ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 12 }}>
                <div>
                  <div className="f-cifra f-acento" style={{ fontSize: 34 }}>
                    {faseDieta.kcal}
                    <span style={{ fontSize: 14, color: "var(--f-texto2)" }}> kcal/día</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {[
                  ["PROTEÍNA", faseDieta.macros.proteina],
                  ["GRASA", faseDieta.macros.grasa],
                  ["CARBOS", faseDieta.macros.carbos],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="f-tarjeta" style={{ flex: 1, minWidth: 0, padding: "9px 8px", borderRadius: 12, textAlign: "center", background: "var(--f-sup2)" }}>
                    <div className="f-etiqueta" style={{ letterSpacing: ".1em" }}>{etiqueta}</div>
                    <div style={{ font: "700 13px/1.2 var(--f-mono)", marginTop: 5 }}>{valor}</div>
                  </div>
                ))}
              </div>
              <div className="f-pretty" style={{ font: "400 12px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 12 }}>
                {faseDieta.nota}
              </div>
            </>
          ) : (
            <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 10 }}>
              Mini-cut del 24-ago al 8-sep (1 700 → 1 800-1 900 kcal), semana de mantenimiento (~2 400) y
              desde el 16-sep volumen limpio con superávit mínimo. Hasta entonces, comer normal.
            </div>
          )}

          {hitoDieta && (
            <div style={{ font: "500 12px/1.4 var(--f-ui)", color: "var(--f-aviso)", marginTop: 10 }}>
              {formatoDia(hitoDieta.fecha)} · {hitoDieta.texto}
            </div>
          )}
          <div style={{ font: "400 11.5px/1.4 var(--f-ui)", color: "var(--f-texto3)", marginTop: 8 }}>
            Toca para ver el plan entero: fases, macros por comida y el día a día del mini-cut.
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
          <button className="f-boton" style={{ flex: 1 }} onClick={() => setDialogo(hoy)}>
            APUNTAR PESO
          </button>
          <button className="f-boton f-boton--acento-fantasma" style={{ flex: 1 }} onClick={() => navegar("/postura/rutina")}>
            RUTINA
          </button>
        </div>
      </div>

      {dialogo && <DialogoPeso fecha={dialogo} onCerrar={() => setDialogo(null)} />}
    </div>
  );
}
