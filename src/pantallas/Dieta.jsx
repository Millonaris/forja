/*
 * FORJA · Dieta.
 *
 * La pantalla completa del plan de dieta del entrenador: la fase de hoy con
 * sus kcal, macros y reparto por comidas; las cuatro fases semana a semana;
 * el día a día del mini-cut; y las reglas fijas. Aquí no se registra nada —
 * las comidas se apuntan en Fitia; esta pantalla es la chuleta.
 */

import Cabecera from "../componentes/Cabecera.jsx";
import { FASES_DIETA, HITOS_DIETA, KCAL_DIA_A_DIA, faseDietaDe } from "../datos/planDieta.js";
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
            {fase ? `AHORA · ${fase.nombre}` : "AHORA · COMER NORMAL (EMPIEZA EL LUNES 24)"}
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
              <div style={{ font: "500 12px/1.4 var(--f-mono)", color: "var(--f-texto3)", marginTop: 10 }}>
                EJEMPLO DEL DÍA · {fase.ejemplo}
              </div>
              <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 10 }}>
                {fase.nota}
              </div>
            </>
          )}

        </div>

        {/* ---- Las comidas del día ---- */}
        <div className="f-tarjeta" style={{ padding: "14px 15px", borderRadius: 16 }}>
          <div className="f-etiqueta" style={{ marginBottom: 10 }}>LAS COMIDAS DEL DÍA</div>
          {["COMIDA 1", "COMIDA 2", "COMIDA 3", "COMIDA 4"].map((nombre) => (
            <div key={nombre} className="f-fila-sb" style={{ padding: "7px 0", borderBottom: "1px solid var(--f-borde-sutil)" }}>
              <span style={{ font: "500 13px/1.2 var(--f-ui)" }}>{nombre}</span>
              <span style={{ font: "700 13px/1 var(--f-mono)", color: "var(--f-acento)" }}>45-50 g proteína</span>
            </div>
          ))}
          <div className="f-pretty" style={{ font: "400 12.5px/1.6 var(--f-ui)", color: "var(--f-texto2)", marginTop: 10 }}>
            Los <strong>hidratos</strong>, concentrados antes y/o después del gym. Las <strong>grasas</strong>,
            repartidas donde caigan cómodas. Si un día haces 3 comidas, sube la proteína a ~60-65 g por comida.
            Sin obsesionarse con el gramo: lo que manda es clavar aproximadamente las calorías y la proteína
            del día.
          </div>
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
