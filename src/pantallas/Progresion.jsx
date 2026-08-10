/*
 * FORJA · Progresión.
 *
 * Dos vistas: un ejercicio a fondo, o el semáforo de todos de un vistazo.
 * La gráfica nunca es la conclusión: debajo va siempre el veredicto en una
 * frase y qué hacer en la próxima sesión.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Cabecera from "../componentes/Cabecera.jsx";
import Grafica from "../componentes/Grafica.jsx";
import { EJERCICIOS } from "../datos/ejercicios.js";
import { OBJETIVO_SERIES, RANGO_SERIES, nombreMusculo } from "../datos/musculos.js";
import { useCarreras, useHistorialGym } from "../ganchos/useDatos.js";
import { formatoCorto, hoyISO } from "../logica/fechas.js";
import { entero, kgSerie, num, serieTexto } from "../logica/formato.js";
import { interferenciaEnHistorial } from "../logica/interferencia.js";
import { agruparPorSesion, semaforoGlobal, veredictoEjercicio } from "../logica/veredictos.js";
import { estadoVolumen, seriesPorMusculo } from "../logica/volumen.js";

export default function Progresion() {
  const [vista, setVista] = useState("ejercicio");
  const [seleccionado, setSeleccionado] = useState(null);
  const navegar = useNavigate();
  const historial = useHistorialGym();
  const carreras = useCarreras();

  // Veredicto de todos los ejercicios. Se recalcula solo cuando cambian datos.
  // A cada uno se le pasa el contexto de carrera: sin eso, una pierna fundida
  // por la tirada larga se leería como estancamiento del plan de fuerza.
  const veredictos = useMemo(() => {
    if (!historial) return [];
    return EJERCICIOS.map((ejercicio) => {
      const sets = historial.porEjercicio.get(ejercicio.id) || [];
      const sesiones = agruparPorSesion(sets, historial.sesiones, ejercicio);
      const planas = Math.min(sesiones.length, 4);
      const interferencia = interferenciaEnHistorial(ejercicio, sesiones, carreras, planas);
      return {
        ejercicio,
        sesiones,
        veredicto: veredictoEjercicio(ejercicio, sesiones, { interferencia }),
      };
    });
  }, [historial, carreras]);

  // Series semanales por músculo: la métrica que manda en hipertrofia.
  const volumen = useMemo(() => {
    if (!historial) return [];
    const sets = [...historial.porEjercicio.values()].flat();
    return seriesPorMusculo(sets, historial.sesiones, hoyISO(), 4);
  }, [historial]);

  const conDatos = veredictos.filter((v) => v.sesiones.length > 0);
  const actual = conDatos.find((v) => v.ejercicio.id === seleccionado) || conDatos[0] || null;

  if (!historial) return <div className="f-pantalla" />;

  return (
    <div className="f-pantalla">
      <Cabecera
        titulo="Progresión"
        atras
        derecha={
          <button
            className="f-etiqueta"
            style={{ color: "var(--f-acento)", padding: "10px 0 10px 12px" }}
            onClick={() => navegar("/revision")}
          >
            REVISIÓN ›
          </button>
        }
      />

      <div className="f-scroll">
        <div className="f-segmento">
          <button aria-pressed={vista === "ejercicio"} onClick={() => setVista("ejercicio")}>
            EJERCICIO
          </button>
          <button aria-pressed={vista === "general"} onClick={() => setVista("general")}>
            SEMÁFORO
          </button>
          <button aria-pressed={vista === "volumen"} onClick={() => setVista("volumen")}>
            VOLUMEN
          </button>
        </div>

        {conDatos.length === 0 ? (
          <div className="f-tarjeta" style={{ borderStyle: "dashed", padding: "26px 20px", textAlign: "center" }}>
            <div className="f-cifra" style={{ fontSize: 22, textTransform: "uppercase", color: "var(--f-texto3)" }}>
              Sin datos suficientes
            </div>
            <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 9 }}>
              El veredicto aparece cuando hayas registrado el mismo ejercicio en dos sesiones distintas.
            </div>
          </div>
        ) : vista === "ejercicio" ? (
          <VistaEjercicio actual={actual} conDatos={conDatos} onCambiar={setSeleccionado} />
        ) : vista === "volumen" ? (
          <VistaVolumen volumen={volumen} />
        ) : (
          <VistaGeneral veredictos={conDatos} onElegir={(id) => { setSeleccionado(id); setVista("ejercicio"); }} />
        )}
      </div>
    </div>
  );
}

function VistaEjercicio({ actual, conDatos, onCambiar }) {
  if (!actual) return null;
  const { ejercicio, sesiones, veredicto } = actual;

  const etiquetas = sesiones.map((s) => formatoCorto(s.date));
  const valores = sesiones.map((s) => Math.round(s.volumen || s.puntuacion));
  const mejor = sesiones.reduce((a, b) => (b.puntuacion > a.puntuacion ? b : a));

  return (
    <>
      {/* Selector de ejercicio: nativo, porque la lista puede tener 32 entradas. */}
      <select
        value={ejercicio.id}
        onChange={(e) => onCambiar(e.target.value)}
        className="f-tarjeta"
        style={{
          width: "100%",
          height: 48,
          padding: "0 14px",
          font: "600 14px/1 var(--f-ui)",
          background: "var(--f-sup)",
          color: "var(--f-texto)",
          appearance: "none",
        }}
      >
        {conDatos.map((v) => (
          <option key={v.ejercicio.id} value={v.ejercicio.id}>
            {v.ejercicio.name} · {v.ejercicio.sessionName}
          </option>
        ))}
      </select>

      <div className="f-tarjeta" style={{ padding: 16, borderRadius: 16 }}>
        <div className="f-fila-sb">
          <div className="f-cifra" style={{ fontSize: 20, lineHeight: 1.1, textTransform: "uppercase" }}>
            {ejercicio.name}
          </div>
          <span className="f-mono" style={{ font: "500 11px/1 var(--f-mono)", color: "var(--f-texto3)", flex: "none" }}>
            {sesiones.length} ses.
          </span>
        </div>

        <div style={{ margin: "14px 0 4px" }}>
          {/* Sin carga (dead bug, plancha…) el dato protagonista son las
              repeticiones o los segundos, no un "0 kg" sin sentido. */}
          <div className="f-cifra f-acento" style={{ fontSize: 42 }}>
            {ejercicio.tipo === "tiempo" ? (
              `${mejor.mejorReps} s`
            ) : mejor.mejorKg > 0 ? (
              <>
                {kgSerie(mejor.mejorKg)}
                <span style={{ fontSize: 16, color: "var(--f-texto2)" }}> kg</span>
              </>
            ) : (
              <>
                {mejor.mejorReps}
                <span style={{ fontSize: 16, color: "var(--f-texto2)" }}> reps</span>
              </>
            )}
          </div>
          <div className="f-etiqueta" style={{ marginTop: 5 }}>
            MEJOR MARCA · {serieTexto(mejor.mejorKg, mejor.mejorReps, ejercicio.tipo)}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <Grafica
            etiquetas={etiquetas}
            valores={valores}
            destacar={Math.min(3, valores.length)}
            alto={110}
            formato={(v) => `${entero(v)} kg de volumen`}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            font: "500 9.5px/1 var(--f-mono)",
            color: "var(--f-texto3)",
          }}
        >
          <span>{formatoCorto(sesiones[0].date).toUpperCase()}</span>
          <span>VOLUMEN POR SESIÓN</span>
          <span>{formatoCorto(sesiones[sesiones.length - 1].date).toUpperCase()}</span>
        </div>
      </div>

      <TarjetaVeredicto veredicto={veredicto} />

      {/* Las series exactas de las últimas sesiones, por si quieres el detalle. */}
      <div className="f-tarjeta" style={{ padding: "14px 4px 6px" }}>
        <div className="f-etiqueta" style={{ padding: "0 13px 12px" }}>ÚLTIMAS SESIONES</div>
        {[...sesiones].reverse().slice(0, 6).map((s) => (
          <div
            key={s.sessionId}
            style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", borderTop: "1px solid var(--f-borde-sutil)" }}
          >
            <span
              style={{
                font: "500 11px/1 var(--f-mono)",
                color: "var(--f-texto3)",
                flex: "none",
                width: 72,
                whiteSpace: "nowrap",
              }}
            >
              {formatoCorto(s.date).replace(/ \d{4}$/, "")}
            </span>
            <span className="f-mono" style={{ flex: 1, font: "600 13px/1 var(--f-mono)" }}>
              {s.series.filter((x) => !x.isWarmup).map((x) => serieTexto(x.kg, x.reps, ejercicio.tipo)).join("  ")}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function TarjetaVeredicto({ veredicto }) {
  const clase =
    veredicto.color === "ok" ? "f-tarjeta--ok" : veredicto.color === "aviso" ? "f-tarjeta--aviso" : veredicto.color === "alerta" ? "f-tarjeta--alerta" : "";
  const color =
    veredicto.color === "ok" ? "var(--f-ok)" : veredicto.color === "aviso" ? "var(--f-aviso)" : veredicto.color === "alerta" ? "var(--f-alerta)" : "var(--f-texto3)";

  return (
    <div className={`f-tarjeta ${clase}`} style={{ padding: 16, borderRadius: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span className="f-punto" style={{ background: color }} />
        <span style={{ font: "600 10.5px/1 var(--f-mono)", letterSpacing: ".16em", color, textTransform: "uppercase" }}>
          {veredicto.titulo}
        </span>
      </div>
      <div className="f-cifra" style={{ fontSize: 27, lineHeight: 1.15, marginTop: 10, textTransform: "uppercase" }}>
        {veredicto.titular || veredicto.titulo}
      </div>
      <div className="f-pretty" style={{ font: "400 13.5px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 7 }}>
        {veredicto.detalle}
      </div>
      {veredicto.sugerencia && (
        <div
          className="f-pretty"
          style={{
            font: "500 13px/1.5 var(--f-ui)",
            color: "var(--f-texto)",
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--f-borde-sutil)",
          }}
        >
          {veredicto.sugerencia}
        </div>
      )}

      {/* Cuando el diagnóstico es fatiga, la carga de descarga va en grande:
          es un número que tienes que llevarte a la máquina. */}
      {veredicto.descarga && (
        <div
          style={{
            marginTop: 12,
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--f-sup2)",
            border: "1px solid var(--f-aviso)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span className="f-etiqueta" style={{ color: "var(--f-aviso)" }}>
            SEMANA DE DESCARGA
          </span>
          <span className="f-cifra" style={{ fontSize: 26, color: "var(--f-aviso)" }}>
            {kgSerie(veredicto.descarga.hasta)}
            <span style={{ fontSize: 13, color: "var(--f-texto2)" }}> kg</span>
          </span>
        </div>
      )}
    </div>
  );
}

function VistaGeneral({ veredictos, onElegir }) {
  const ordenados = semaforoGlobal(veredictos);
  const color = (estado) =>
    estado === "progresa" ? "var(--f-ok)" : estado === "estancado" ? "var(--f-aviso)" : estado === "baja" ? "var(--f-alerta)" : "var(--f-texto3)";

  const cuenta = {
    progresa: ordenados.filter((v) => v.veredicto.estado === "progresa").length,
    estancado: ordenados.filter((v) => v.veredicto.estado === "estancado").length,
    baja: ordenados.filter((v) => v.veredicto.estado === "baja").length,
  };

  return (
    <>
      <div className="f-duo">
        {[
          { etiqueta: "PROGRESAN", valor: cuenta.progresa, c: "var(--f-ok)" },
          { etiqueta: "ESTANCADOS", valor: cuenta.estancado, c: "var(--f-aviso)" },
          { etiqueta: "BAJANDO", valor: cuenta.baja, c: "var(--f-alerta)" },
        ].map((x) => (
          <div key={x.etiqueta} className="f-tarjeta" style={{ padding: "12px 13px" }}>
            <div className="f-etiqueta" style={{ fontSize: 9, letterSpacing: ".1em" }}>{x.etiqueta}</div>
            <div className="f-cifra" style={{ fontSize: 32, color: x.c, marginTop: 8 }}>{x.valor}</div>
          </div>
        ))}
      </div>

      <div className="f-tarjeta" style={{ padding: "14px 4px 6px", borderRadius: 16 }}>
        <div className="f-etiqueta" style={{ padding: "0 13px 12px" }}>
          SEMÁFORO · {ordenados.length} EJERCICIOS
        </div>
        {ordenados.map(({ ejercicio, veredicto }) => (
          <button
            key={ejercicio.id}
            onClick={() => onElegir(ejercicio.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "10px 13px",
              borderTop: "1px solid var(--f-borde-sutil)",
              width: "100%",
              textAlign: "left",
            }}
          >
            <span className="f-punto" style={{ background: color(veredicto.estado) }} />
            <span style={{ flex: 1, minWidth: 0, font: "500 13.5px/1.2 var(--f-ui)" }}>{ejercicio.name}</span>
            <span
              style={{ font: "600 12px/1 var(--f-mono)", color: color(veredicto.estado), flex: "none" }}
            >
              {resumenCorto(veredicto)}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/**
 * Volumen semanal por músculo. La barra enseña el rango útil (10-20 series):
 * lo que importa no es el número suelto sino si cae dentro de la franja.
 */
function VistaVolumen({ volumen }) {
  if (!volumen.length) {
    return (
      <div className="f-tarjeta" style={{ borderStyle: "dashed", padding: "26px 20px", textAlign: "center" }}>
        <div className="f-cifra" style={{ fontSize: 22, textTransform: "uppercase", color: "var(--f-texto3)" }}>
          Sin series esta semana
        </div>
        <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 9 }}>
          En cuanto entrenes aparecerá aquí cuántas series lleva cada músculo.
        </div>
      </div>
    );
  }

  const bajos = volumen.filter((m) => estadoVolumen(m.media, m.musculo).estado === "bajo").length;
  const altos = volumen.filter((m) => estadoVolumen(m.media, m.musculo).estado === "alto").length;
  const juzgables = volumen.filter((m) => m.media != null).length;

  return (
    <>
      <div className="f-tarjeta" style={{ padding: "14px 15px", borderRadius: 16 }}>
        <div className="f-etiqueta">SERIES POR MÚSCULO · MEDIA SEMANAL</div>
        <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 8 }}>
          Por defecto el rango útil son {RANGO_SERIES.min}-{RANGO_SERIES.max} series duras por músculo y semana, salvo
          donde tu plan decide otra cosa.
          {juzgables === 0
            ? " Aún no hay una semana completa con la que juzgar."
            : bajos === 0 && altos === 0
              ? " Todo lo que entrenas está donde debe."
              : `${bajos > 0 ? ` ${bajos} ${bajos === 1 ? "músculo va" : "músculos van"} por debajo de su objetivo.` : ""}${
                  altos > 0 ? ` ${altos} ${altos === 1 ? "está" : "están"} por encima.` : ""
                }`}
        </div>

        {/* Las decisiones del plan que se apartan del rango general se explican
            aquí: si no, "pecho en 4 series" parece un descuido y no lo es. */}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--f-borde-sutil)" }}>
          {Object.entries(OBJETIVO_SERIES).map(([musculo, o]) => (
            <div
              key={musculo}
              className="f-pretty"
              style={{ font: "400 12px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 4 }}
            >
              <strong style={{ color: "var(--f-texto2)" }}>
                {nombreMusculo(musculo)} {o.min}-{o.max}:
              </strong>{" "}
              {o.nota}
            </div>
          ))}
        </div>

        <div className="f-pretty" style={{ font: "400 12px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 10 }}>
          El veredicto va sobre las semanas completas: la semana en curso se muestra aparte porque a mitad de semana
          todo parecería falta de volumen.
        </div>
      </div>

      <div className="f-tarjeta" style={{ padding: "14px 4px 8px", borderRadius: 16 }}>
        {volumen.map((m) => {
          const est = estadoVolumen(m.media, m.musculo);
          // La barra representa 0-25 series; la franja útil se marca encima.
          const pct = Math.min(100, ((m.media ?? 0) / 25) * 100);
          const pctCurso = Math.min(100, (m.enCurso / 25) * 100);
          return (
            <div key={m.musculo} style={{ padding: "10px 13px", borderTop: "1px solid var(--f-borde-sutil)" }}>
              <div className="f-fila-sb">
                <span style={{ font: "500 13.5px/1.2 var(--f-ui)" }}>{m.nombre}</span>
                <span style={{ font: "600 13px/1 var(--f-mono)", color: `var(--f-${est.color})`, flex: "none" }}>
                  {m.media == null ? "—" : `${num(m.media, m.media % 1 ? 1 : 0)} ser.`}
                </span>
              </div>

              <div style={{ position: "relative", height: 8, marginTop: 8, borderRadius: 4, background: "var(--f-barra)" }}>
                {/* Franja del objetivo DE ESTE músculo: el deltoides lateral
                    va a 12-16 y el pecho a 4-10, así que una franja única
                    mentiría en las dos filas que más importan. */}
                <span
                  style={{
                    position: "absolute",
                    left: `${(est.objetivo.min / 25) * 100}%`,
                    width: `${((est.objetivo.max - est.objetivo.min) / 25) * 100}%`,
                    top: 0,
                    bottom: 0,
                    background: "color-mix(in srgb, var(--f-ok) 22%, transparent)",
                  }}
                />
                {/* Semana en curso: marca hueca, para verla avanzar sin juzgarla */}
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pctCurso}%`,
                    borderRadius: 4,
                    border: "1px solid var(--f-acento)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 2,
                    bottom: 2,
                    width: `${pct}%`,
                    borderRadius: 3,
                    background: `var(--f-${est.color})`,
                  }}
                />
              </div>

              <div style={{ font: "400 11px/1.3 var(--f-ui)", color: "var(--f-texto3)", marginTop: 6 }}>
                {est.texto} · esta semana llevas {num(m.enCurso, m.enCurso % 1 ? 1 : 0)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Texto de una línea para la fila del semáforo. */
function resumenCorto(v) {
  if (v.estado === "progresa") return v.titular;
  if (v.estado === "estancado") return `${v.planas} ses. plano`;
  if (v.estado === "baja") return "bajando";
  if (v.estado === "mantiene") return "igual";
  return "—";
}
