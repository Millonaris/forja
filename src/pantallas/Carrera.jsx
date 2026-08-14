/*
 * FORJA · Carrera.
 *
 * La sesión de hoy manda; el plan de 26 semanas queda como contexto, resumido
 * en una rejilla que cabe entera en pantalla. Los entrenos se hacen con el
 * reloj (Garmin): aquí solo se marca cada sesión como hecha.
 */

import { useMemo, useState } from "react";

import Cabecera from "../componentes/Cabecera.jsx";
import DialogoCarrera from "../componentes/DialogoCarrera.jsx";
import { FASES, LARGAS, faseDeSemana, sesionesDeSemanaCarrera } from "../datos/planCarrera.js";
import { useAjustes, useCarreras } from "../ganchos/useDatos.js";
import { construirCalendario, planDelDia, semanaCarreraDe, SEMANAS_PLAN } from "../logica/calendario.js";
import { formatoDia, hoyISO, sumarDias } from "../logica/fechas.js";
import { num, ritmo } from "../logica/formato.js";
import { veredictosCarrera } from "../logica/veredictosCarrera.js";

export default function Carrera() {
  const { ajustes } = useAjustes();
  const carreras = useCarreras();
  const [dialogo, setDialogo] = useState(null);
  // Semana abierta en el selector manual: hacer HOY una sesión de otra semana.
  const [semanaElegida, setSemanaElegida] = useState(null);

  const hoy = hoyISO();
  const inicio = ajustes.startDate;
  const desfase = ajustes.desfaseCarrera || 0;
  const semana = semanaCarreraDe(ajustes, hoy);
  const plan = planDelDia(inicio, hoy, desfase);
  const hechaHoy = carreras.find((c) => c.date === hoy);

  // Si hoy no toca correr, se enseña la próxima sesión del plan.
  const proxima = plan?.carrera ? { iso: hoy, carrera: plan.carrera } : buscarProxima(inicio, hoy, desfase);
  const kmPorSemana = agruparKm(carreras, ajustes);

  // Los tres veredictos del motor de carrera: ritmo, volumen y base aeróbica.
  const veredictos = useMemo(() => veredictosCarrera(carreras, hoy), [carreras, hoy]);

  // Cuántas carreras registraste en cada semana del plan, para la rejilla.
  const corridasPorSemana = useMemo(() => {
    const m = new Map();
    for (const c of carreras) {
      const s = c.weekNum ?? semanaCarreraDe(ajustes, c.date);
      m.set(s, (m.get(s) || 0) + 1);
    }
    return m;
  }, [carreras, ajustes]);

  return (
    <div className="f-pantalla">
      <Cabecera
        titulo="Carrera"
        derecha={
          <span className="f-mono" style={{ font: "500 11px/1 var(--f-mono)", color: "var(--f-texto3)" }}>
            0 → 20K · SEM {Math.min(semana, SEMANAS_PLAN)}/{SEMANAS_PLAN}
          </span>
        }
      />

      <div className="f-scroll">
        {/* ---- La sesión que toca ---- */}
        {proxima ? (
          <div className={`f-tarjeta ${hechaHoy ? "f-tarjeta--ok" : "f-tarjeta--destacada"}`} style={{ padding: 18, borderRadius: 18 }}>
            <div
              className="f-etiqueta"
              style={{ color: hechaHoy ? "var(--f-ok)" : "var(--f-acento)", letterSpacing: ".16em", fontSize: 10.5 }}
            >
              {hechaHoy
                ? "HECHA HOY"
                : proxima.iso === hoy
                  ? `SESIÓN DE HOY · SEMANA ${semana}`
                  : `PRÓXIMA · ${formatoDia(proxima.iso).toUpperCase()}`}
            </div>

            <div className="f-cifra" style={{ fontSize: 34, lineHeight: 1.05, textTransform: "uppercase", margin: "11px 0 8px" }}>
              {proxima.carrera.detalle}
            </div>

            <div style={{ font: "400 13.5px/1.4 var(--f-ui)", color: "var(--f-texto2)" }}>
              {proxima.carrera.minutos ? `Total ${proxima.carrera.minutos} min` : `${num(proxima.carrera.km, 1)} km`} ·
              {" "}suave: poder hablar frases enteras
            </div>

            {hechaHoy ? (
              <button
                className="f-boton f-boton--fantasma"
                style={{ marginTop: 16 }}
                onClick={() => setDialogo({ fecha: hoy, existente: hechaHoy })}
              >
                {num(hechaHoy.km, 1)} KM · {hechaHoy.minutes} MIN · EDITAR
              </button>
            ) : (
              <>
                <button
                  className="f-boton"
                  style={{ marginTop: 16 }}
                  onClick={() => setDialogo({ fecha: proxima.iso, plan: proxima.carrera })}
                >
                  MARCAR COMO HECHA
                </button>
                <div className="f-pretty" style={{ font: "400 12px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 10 }}>
                  El entreno lo lleva el reloj; aquí solo se apunta al terminar.
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="f-tarjeta" style={{ borderStyle: "dashed", padding: 22, textAlign: "center" }}>
            <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto3)" }}>
              El plan de 26 semanas ha terminado. Enhorabuena por el 20K.
            </div>
          </div>
        )}

        {/* ---- Veredictos: lo que el plan no te dice ----
             Correr no progresa en kilos: progresa bajando el ritmo al mismo
             esfuerzo y aguantando más volumen sin romperte. */}
        {carreras.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <TarjetaVeredictoCarrera
              etiqueta={`RITMO · ${veredictos.ritmo.tipo.toUpperCase()}`}
              v={veredictos.ritmo}
            />
            <TarjetaVeredictoCarrera etiqueta="VOLUMEN SEMANAL" v={veredictos.volumen} />
            <TarjetaVeredictoCarrera etiqueta="BASE AERÓBICA" v={veredictos.base} />
          </div>
        )}

        {/* ---- Km por semana ---- */}
        <div className="f-tarjeta" style={{ padding: "14px 15px", borderRadius: 16 }}>
          <div className="f-etiqueta" style={{ marginBottom: 14 }}>KM POR SEMANA</div>
          {kmPorSemana.length === 0 ? (
            <div style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto3)" }}>
              Todavía no hay carreras registradas.
            </div>
          ) : (
            <>
              <div style={{ height: 78, display: "flex", alignItems: "flex-end", gap: 6 }}>
                {kmPorSemana.map((s, i) => {
                  const max = Math.max(...kmPorSemana.map((x) => x.km), 1);
                  return (
                    <div
                      key={s.semana}
                      title={`Semana ${s.semana}: ${num(s.km, 1)} km`}
                      style={{
                        flex: 1,
                        height: `${Math.max(6, (s.km / max) * 100)}%`,
                        background: i === kmPorSemana.length - 1 ? "var(--f-acento)" : "var(--f-barra)",
                        borderRadius: "3px 3px 0 0",
                      }}
                    />
                  );
                })}
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
                <span>SEM {kmPorSemana[0].semana} · {num(kmPorSemana[0].km, 1)} KM</span>
                <span style={{ color: "var(--f-acento)" }}>
                  SEM {kmPorSemana[kmPorSemana.length - 1].semana} · {num(kmPorSemana[kmPorSemana.length - 1].km, 1)} KM
                </span>
              </div>
            </>
          )}
        </div>

        {/* ---- Últimas carreras ---- */}
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
            <span>ÚLTIMAS CARRERAS</span>
            <span>RITMO</span>
          </div>
          {carreras.length === 0 ? (
            <div style={{ padding: "4px 13px 14px", font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto3)" }}>
              En cuanto registres la primera aparecerá aquí con su ritmo.
            </div>
          ) : (
            carreras.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => setDialogo({ fecha: c.date, existente: c })}
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
                    {formatoDia(c.date)} · {num(c.km, 1)} km
                  </span>
                  <span style={{ display: "block", font: "400 11.5px/1.2 var(--f-ui)", color: "var(--f-texto3)", marginTop: 4 }}>
                    {c.minutes} min · {c.type}
                  </span>
                </span>
                <span style={{ font: "700 16px/1 var(--f-mono)", color: "var(--f-texto2)", flex: "none" }}>
                  {ritmo(c.km, c.minutes)}
                </span>
              </button>
            ))
          )}
        </div>

        {/* ---- El plan entero en una rejilla ---- */}
        <div className="f-tarjeta" style={{ padding: "14px 15px", borderRadius: 16 }}>
          <div className="f-etiqueta" style={{ marginBottom: 12 }}>PLAN 26 SEMANAS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(13,1fr)", gap: 5 }}>
            {Array.from({ length: SEMANAS_PLAN }, (_, i) => i + 1).map((s) => {
              const larga = LARGAS[s];
              const actual = s === semana;
              const hechas = corridasPorSemana.get(s) || 0;
              // F1: viernes y lunes. F2-3: dos cortas y la larga, salvo la
              // semana 26, que solo tiene el rodaje del martes y el 20K.
              const previstas = faseDeSemana(s) === 1 || s === SEMANAS_PLAN ? 2 : 3;

              // El color sale de lo que REALMENTE corriste, no de que la fecha
              // haya pasado: pintar de verde una semana en blanco sería mentir.
              let fondo;
              if (actual) fondo = "var(--f-acento)";
              else if (hechas >= previstas) fondo = "var(--f-heat-ok)";
              else if (hechas > 0) fondo = "var(--f-heat-parcial)";
              else if (s < semana) fondo = "var(--f-heat-vacio)";
              else fondo = larga?.descarga ? "var(--f-heat-parcial)" : "var(--f-barra)";

              const estado = actual
                ? "en curso"
                : s > semana
                  ? "por venir"
                  : `${hechas} de ${previstas} carreras`;
              return (
                <button
                  key={s}
                  onClick={() => setSemanaElegida(s)}
                  aria-label={`Ver las sesiones de la semana ${s}`}
                  title={`Semana ${s} · fase ${faseDeSemana(s)} · ${estado}${larga ? ` · larga ${num(larga.km, 1)} km` : ""}`}
                  style={{
                    height: 16,
                    padding: 0,
                    borderRadius: 3,
                    background: fondo,
                    opacity: s > semana ? 0.55 : 1,
                    boxShadow: actual ? "0 0 0 2px var(--f-acento-glow)" : undefined,
                  }}
                />
              );
            })}
          </div>
          <div className="f-pretty" style={{ font: "400 12px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 10 }}>
            Toca una semana para ver sus sesiones y hacer hoy la que quieras, aunque sea de otra fase.
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap", font: "500 9.5px/1 var(--f-mono)", color: "var(--f-texto3)" }}>
            {FASES.map((f) => (
              <span key={f.n}>
                {f.nombre} · SEM {f.desde}-{f.hasta}
              </span>
            ))}
          </div>
        </div>
      </div>

      {semanaElegida && (
        <SelectorSemana
          semanaElegida={semanaElegida}
          semanaActual={semana}
          onElegir={(sesion) => {
            setSemanaElegida(null);
            setDialogo({ fecha: hoy, plan: sesion });
          }}
          onCerrar={() => setSemanaElegida(null)}
        />
      )}

      {dialogo && (
        <DialogoCarrera
          fecha={dialogo.fecha}
          semana={semanaCarreraDe(ajustes, dialogo.fecha)}
          plan={dialogo.plan}
          existente={dialogo.existente}
          onCerrar={() => setDialogo(null)}
        />
      )}
    </div>
  );
}

/**
 * Hoja con las sesiones de una semana del plan, la que sea: sirve para hacer
 * HOY una sesión de otra semana u otra fase sin mover el plan. Los intervalos
 * arrancan el temporizador; cortas y largas se registran a mano como siempre.
 */
function SelectorSemana({ semanaElegida, semanaActual, onElegir, onCerrar }) {
  const sesiones = sesionesDeSemanaCarrera(semanaElegida);
  const fase = faseDeSemana(semanaElegida);
  const esFutura = semanaElegida > semanaActual;

  return (
    <div
      role="dialog"
      aria-label={`Sesiones de la semana ${semanaElegida}`}
      onClick={onCerrar}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,.72)",
        display: "flex",
        alignItems: "flex-end",
        animation: "f-entra .15s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "var(--f-sup)",
          borderTop: "1px solid var(--f-borde)",
          borderRadius: "22px 22px 0 0",
          padding: "20px 18px calc(20px + var(--f-safe-abajo))",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div className="f-fila-sb">
          <div>
            <div className="f-etiqueta">SEMANA {semanaElegida} · FASE {fase}</div>
            <div style={{ font: "400 12px/1.3 var(--f-ui)", color: "var(--f-texto3)", marginTop: 5 }}>
              {semanaElegida === semanaActual
                ? "Es tu semana actual."
                : "Solo cambia lo de hoy: el plan no se mueve."}
            </div>
          </div>
          <button onClick={onCerrar} style={{ font: "500 12px/1 var(--f-mono)", color: "var(--f-texto3)", padding: 10, margin: -10 }}>
            CERRAR
          </button>
        </div>

        {sesiones.map((s) => (
          <button
            key={`${s.tipo}-${s.detalle}`}
            className="f-tarjeta"
            onClick={() => onElegir(s)}
            style={{ padding: "14px 15px", borderRadius: 16, textAlign: "left", display: "block", width: "100%" }}
          >
            <div className="f-etiqueta" style={{ color: "var(--f-acento)" }}>{s.etiqueta}</div>
            <div className="f-cifra" style={{ fontSize: 21, lineHeight: 1.15, textTransform: "uppercase", margin: "7px 0 5px" }}>
              {s.detalle}
            </div>
            <div style={{ font: "400 12px/1.3 var(--f-ui)", color: "var(--f-texto3)" }}>
              {s.minutos ? `Total ${s.minutos} min · ` : ""}se apunta al terminar, con los datos del reloj
            </div>
          </button>
        ))}

        {esFutura && (
          <div
            className="f-pretty"
            style={{
              font: "500 12px/1.5 var(--f-ui)",
              color: "var(--f-aviso)",
              background: "var(--f-sup2)",
              border: "1px solid var(--f-borde)",
              borderRadius: "var(--f-r-chip)",
              padding: "9px 11px",
            }}
          >
            Ojo: esto es de más adelante. El entrenador pide no adelantar semanas — los huesos y tendones van meses por
            detrás del corazón. Para un día suelto vale, como costumbre no.
          </div>
        )}
      </div>
    </div>
  );
}

/** Una lectura del motor de carrera: titular grande y explicación debajo. */
function TarjetaVeredictoCarrera({ etiqueta, v }) {
  const clase =
    v.color === "ok"
      ? "f-tarjeta--ok"
      : v.color === "aviso"
        ? "f-tarjeta--aviso"
        : v.color === "alerta"
          ? "f-tarjeta--alerta"
          : "";
  const color = v.color === "tenue" ? "var(--f-texto3)" : `var(--f-${v.color})`;

  return (
    <div className={`f-tarjeta ${clase}`} style={{ padding: "14px 15px", borderRadius: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span className="f-punto" style={{ background: color }} />
        <span style={{ font: "600 10.5px/1 var(--f-mono)", letterSpacing: ".16em", color }}>{etiqueta}</span>
      </div>
      <div className="f-cifra" style={{ fontSize: 24, lineHeight: 1.15, marginTop: 9, textTransform: "uppercase" }}>
        {v.titular}
      </div>
      <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 6 }}>
        {v.detalle}
      </div>
      {v.accion && (
        <div
          className="f-pretty"
          style={{
            font: "500 13px/1.5 var(--f-ui)",
            color: "var(--f-texto)",
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--f-borde-sutil)",
          }}
        >
          {v.accion}
        </div>
      )}
    </div>
  );
}

/** Siguiente día con carrera prevista, mirando hasta 14 días adelante. */
function buscarProxima(inicio, desde, desfase) {
  const cal = construirCalendario(inicio, desfase);
  for (let i = 1; i <= 14; i++) {
    const iso = sumarDias(desde, i);
    const dia = cal.get(iso);
    if (dia?.carrera) return { iso, carrera: dia.carrera };
  }
  return null;
}

/** Suma de km por semana del plan, para la gráfica de volumen. */
function agruparKm(carreras, ajustes) {
  const porSemana = new Map();
  for (const c of carreras) {
    const s = c.weekNum ?? semanaCarreraDe(ajustes, c.date);
    porSemana.set(s, (porSemana.get(s) || 0) + (c.km || 0));
  }
  return [...porSemana.entries()]
    .map(([semana, km]) => ({ semana, km }))
    .sort((a, b) => a.semana - b.semana)
    .slice(-12);
}
