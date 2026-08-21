/*
 * FORJA · Dieta.
 *
 * La pantalla completa del plan de dieta del entrenador: la fase de hoy con
 * sus kcal, macros y reparto por comidas; las cuatro fases semana a semana;
 * el día a día del mini-cut; y las reglas fijas. Aquí no se registra nada —
 * las comidas se apuntan en Fitia; esta pantalla es la chuleta.
 */

import Cabecera from "../componentes/Cabecera.jsx";
import { ESTRUCTURA_DIA, FASES_DIETA, HITOS_DIETA, KCAL_DIA_A_DIA, faseDietaDe } from "../datos/planDieta.js";
import { formatoCorto, formatoDia, hoyISO } from "../logica/fechas.js";

export default function Dieta() {
  const hoy = hoyISO();
  const fase = faseDietaDe(hoy);
  const enMinicut = hoy <= "2026-09-08";

  return (
    <div className="f-pantalla">
      <Cabecera titulo="Dieta" sub="SE REGISTRA EN FITIA · AQUÍ, EL PLAN" atras />

      <div className="f-scroll">
        {/* ---- La fase de hoy ---- */}
        <div className="f-tarjeta f-tarjeta--destacada" style={{ padding: 18, borderRadius: 18 }}>
          <div className="f-etiqueta" style={{ color: "var(--f-acento)", letterSpacing: ".16em" }}>
            {fase ? `AHORA · ${fase.nombre}` : "AHORA · COMER NORMAL (EMPIEZA EL MIÉRCOLES 26)"}
          </div>

          {fase && (
            <>
              <div className="f-cifra" style={{ fontSize: 44, marginTop: 10 }}>
                {fase.kcal}
                <span style={{ fontSize: 16, color: "var(--f-texto2)" }}> kcal/día</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {[
                  ["PROTEÍNA", fase.macros.proteina],
                  ["GRASA", fase.macros.grasa],
                  ["CARBOS", fase.macros.carbos],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="f-tarjeta" style={{ flex: 1, minWidth: 0, padding: "10px 8px", borderRadius: 12, textAlign: "center", background: "var(--f-sup2)" }}>
                    <div className="f-etiqueta" style={{ letterSpacing: ".1em" }}>{etiqueta}</div>
                    <div style={{ font: "700 13.5px/1.2 var(--f-mono)", marginTop: 5 }}>{valor}</div>
                  </div>
                ))}
              </div>
              <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 12 }}>
                {fase.nota}
              </div>
            </>
          )}

        </div>

        {/* ---- Las comidas del día: la tabla exacta del entrenador ---- */}
        <div className="f-tarjeta" style={{ padding: "14px 15px", borderRadius: 16 }}>
          <div className="f-etiqueta" style={{ marginBottom: 8 }}>LAS COMIDAS DEL DÍA</div>
          <div style={{ font: "500 11px/1.5 var(--f-mono)", color: "var(--f-texto3)", marginBottom: 10 }}>
            {ESTRUCTURA_DIA.toUpperCase()}
          </div>
          {(() => {
            const f = fase ?? FASES_DIETA[0];
            const total = f.comidasDetalle.reduce(
              (t, c) => ({ p: t.p + c.p, h: t.h + c.h, g: t.g + c.g }),
              { p: 0, h: 0, g: 0 },
            );
            const columnas = { display: "grid", gridTemplateColumns: "1fr 44px 44px 44px", gap: "0 8px", alignItems: "center" };
            return (
              <>
                <div style={{ ...columnas, font: "500 9.5px/1 var(--f-mono)", letterSpacing: ".08em", color: "var(--f-texto3)", paddingBottom: 7 }}>
                  <span />
                  <span style={{ textAlign: "right" }}>PROT</span>
                  <span style={{ textAlign: "right" }}>HIDR</span>
                  <span style={{ textAlign: "right" }}>GRASA</span>
                </div>
                {f.comidasDetalle.map((c) => (
                  <div key={c.nombre} style={{ ...columnas, padding: "8px 0", borderTop: "1px solid var(--f-borde-sutil)" }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", font: "500 13px/1.2 var(--f-ui)" }}>{c.nombre}</span>
                      <span style={{ display: "block", font: "500 10px/1.2 var(--f-mono)", color: "var(--f-texto3)", marginTop: 3 }}>
                        {c.hora}
                      </span>
                    </span>
                    <span style={{ font: "700 13px/1 var(--f-mono)", color: "var(--f-acento)", textAlign: "right" }}>{c.p} g</span>
                    <span style={{ font: "600 13px/1 var(--f-mono)", color: "var(--f-texto2)", textAlign: "right" }}>{c.h} g</span>
                    <span style={{ font: "600 13px/1 var(--f-mono)", color: "var(--f-texto2)", textAlign: "right" }}>{c.g} g</span>
                  </div>
                ))}
                <div style={{ ...columnas, padding: "9px 0 2px", borderTop: "2px solid var(--f-borde)" }}>
                  <span style={{ font: "600 12px/1 var(--f-mono)", letterSpacing: ".08em" }}>TOTAL</span>
                  <span style={{ font: "700 13px/1 var(--f-mono)", color: "var(--f-acento)", textAlign: "right" }}>{total.p} g</span>
                  <span style={{ font: "700 13px/1 var(--f-mono)", textAlign: "right" }}>{total.h} g</span>
                  <span style={{ font: "700 13px/1 var(--f-mono)", textAlign: "right" }}>{total.g} g</span>
                </div>
                <div className="f-pretty" style={{ font: "400 12.5px/1.6 var(--f-ui)", color: "var(--f-texto2)", marginTop: 10 }}>
                  {f.notaComidas} Sin obsesionarse con el gramo: lo que manda es clavar aproximadamente las
                  calorías y la proteína del día.
                </div>
              </>
            );
          })()}
        </div>

        {/* ---- Las cuatro fases, semana a semana ---- */}
        <div className="f-tarjeta" style={{ padding: "14px 4px 8px", borderRadius: 16 }}>
          <div className="f-etiqueta" style={{ padding: "0 13px 10px" }}>EL PLAN, SEMANA A SEMANA</div>
          {FASES_DIETA.map((f) => {
            const activa = f === fase;
            return (
              <div
                key={f.nombre}
                style={{
                  padding: "11px 13px",
                  borderTop: "1px solid var(--f-borde-sutil)",
                  background: activa ? "color-mix(in srgb, var(--f-acento) 8%, transparent)" : undefined,
                }}
              >
                <div className="f-fila-sb">
                  <span style={{ font: "600 13.5px/1.2 var(--f-ui)", color: activa ? "var(--f-acento)" : "var(--f-texto)" }}>
                    {f.nombre}
                  </span>
                  <span className="f-cifra" style={{ fontSize: 17 }}>{f.kcal}</span>
                </div>
                <div style={{ font: "400 11.5px/1.4 var(--f-ui)", color: "var(--f-texto3)", marginTop: 4 }}>
                  {formatoCorto(f.desde)} {f.hasta ? `→ ${formatoCorto(f.hasta)}` : "en adelante"} ·{" "}
                  {f.macros.proteina} P · {f.macros.grasa} G · {f.macros.carbos} C
                </div>
              </div>
            );
          })}
        </div>

        {/* ---- Kcal día a día del mini-cut (desaparece cuando termine) ---- */}
        {enMinicut && (
          <div className="f-tarjeta" style={{ padding: "14px 4px 8px", borderRadius: 16 }}>
            <div className="f-etiqueta" style={{ padding: "0 13px 10px" }}>MINI-CUT · KCAL DÍA A DÍA</div>
            {KCAL_DIA_A_DIA.map((d) => {
              const esHoy = d.fecha === hoy;
              const pasado = d.fecha < hoy;
              return (
                <div
                  key={d.fecha}
                  style={{
                    padding: "8px 13px",
                    borderTop: "1px solid var(--f-borde-sutil)",
                    opacity: pasado ? 0.45 : 1,
                    background: esHoy ? "color-mix(in srgb, var(--f-acento) 8%, transparent)" : undefined,
                  }}
                >
                  <div className="f-fila-sb">
                    <span
                      style={{
                        font: "600 11px/1.4 var(--f-mono)",
                        color: esHoy ? "var(--f-acento)" : "var(--f-texto3)",
                      }}
                    >
                      {formatoDia(d.fecha).toUpperCase()}
                    </span>
                    <span className="f-cifra" style={{ fontSize: 16 }}>
                      {d.kcal} <span style={{ fontSize: 10, color: "var(--f-texto3)" }}>KCAL</span>
                    </span>
                  </div>
                  {d.nota && (
                    <div className="f-pretty" style={{ font: "400 12px/1.45 var(--f-ui)", color: "var(--f-aviso)", marginTop: 3 }}>
                      {d.nota}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ---- Hitos de medidas ---- */}
        <div className="f-tarjeta" style={{ padding: "14px 15px", borderRadius: 16 }}>
          <div className="f-etiqueta" style={{ marginBottom: 10 }}>CINTURA Y FOTOS</div>
          {HITOS_DIETA.map((h) => (
            <div
              key={h.fecha}
              style={{
                display: "flex",
                gap: 10,
                padding: "4px 0",
                opacity: h.fecha < hoy ? 0.45 : 1,
                font: "400 12.5px/1.5 var(--f-ui)",
                color: "var(--f-texto2)",
              }}
            >
              <span style={{ flex: "none", width: 74, font: "600 11px/1.7 var(--f-mono)", color: "var(--f-texto3)" }}>
                {formatoDia(h.fecha).toUpperCase()}
              </span>
              <span className="f-pretty">{h.texto}</span>
            </div>
          ))}
          <div style={{ font: "400 11.5px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 8 }}>
            Fotos siempre iguales: misma luz, misma distancia, misma hora, pose relajada y repetible.
          </div>
        </div>

        {/* ---- Reglas fijas ---- */}
        <div className="f-tarjeta" style={{ padding: "14px 15px", borderRadius: 16 }}>
          <div className="f-etiqueta" style={{ marginBottom: 10 }}>REGLAS QUE NO CAMBIAN</div>
          <div className="f-pretty" style={{ font: "400 13px/1.7 var(--f-ui)", color: "var(--f-texto2)" }}>
            · Creatina 5 g todos los días — no se quita para pesar menos.
            <br />· Agua y sal normales: nada de deshidratar, saunas ni diuréticos.
            <br />· Alcohol 0 durante el mini-cut. Fibra 25-35 g (baja si te hincha cerca de un día visual).
            <br />· Pesarse cada mañana (tras el baño, antes de desayunar) y juzgar SOLO la media de 7 días
            + cintura + fotos.
            <br />· El gimnasio es para conservar y ganar músculo, no para quemar calorías: los descansos no
            se recortan.
            <br />· Proteínas de cabecera: pollo, pavo, pescado, huevos y claras, yogur proteico, queso
            fresco batido. Hidratos: arroz, patata, pasta, avena, pan y fruta. Verdura generosa. Grasa de
            aceite de oliva, huevos, pescado y frutos secos pesados.
          </div>
        </div>
      </div>
    </div>
  );
}
