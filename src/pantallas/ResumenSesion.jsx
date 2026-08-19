/*
 * FORJA · Resumen de sesión.
 *
 * No celebra números sueltos: cada ejercicio sale ya comparado con la vez
 * anterior, y el cierre es una frase accionable para la próxima sesión.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../datos/db.js";
import { ejerciciosDe } from "../datos/ejercicios.js";
import { useAjustes } from "../ganchos/useDatos.js";
import { proximaVezQueToca } from "../logica/calendario.js";
import { formatoDia, haceCuanto } from "../logica/fechas.js";
import { conSignoEntero, duracion, entero } from "../logica/formato.js";
import { compararSesiones, veredictoEjercicio, agruparPorSesion } from "../logica/veredictos.js";
import { seriesPrevistas } from "../logica/sesionGym.js";
import { senalFin } from "../utiles/senales.js";
import { useEffect, useRef } from "react";

export default function ResumenSesion() {
  const { sessionId } = useParams();
  const id = Number(sessionId);
  const navegar = useNavigate();
  const { ajustes } = useAjustes();

  const datos = useLiveQuery(
    async () => {
      const sesion = await db.gymSessions.get(id);
      if (!sesion) return null;

      const seriesHoy = await db.gymSets.where("sessionId").equals(id).toArray();

      // Sesión anterior del mismo tipo, para comparar contra algo equivalente.
      const previas = await db.gymSessions.where("sessionName").equals(sesion.sessionName).sortBy("date");
      const anteriores = previas.filter((s) => s.id !== id && s.date <= sesion.date);
      const anterior = anteriores[anteriores.length - 1] || null;
      const seriesAntes = anterior ? await db.gymSets.where("sessionId").equals(anterior.id).toArray() : [];

      // Todo el histórico, para poder sacar el consejo de cierre.
      const todasSesiones = await db.gymSessions.toArray();
      const todosSets = await db.gymSets.toArray();

      return { sesion, seriesHoy, anterior, seriesAntes, todasSesiones, todosSets };
    },
    [id],
    undefined,
  );

  // La señal de fin suena una sola vez al abrir el resumen.
  const sonado = useRef(false);
  useEffect(() => {
    if (datos && !sonado.current) {
      sonado.current = true;
      senalFin();
    }
  }, [datos]);

  if (datos === undefined) return <div className="f-pantalla" />;
  if (!datos) {
    return (
      <div className="f-pantalla">
        <div className="f-scroll">
          <h1 className="f-titulo">Sesión no encontrada</h1>
          <button className="f-boton f-boton--fantasma" onClick={() => navegar("/")}>VOLVER A HOY</button>
        </div>
      </div>
    );
  }

  const { sesion, seriesHoy, anterior, seriesAntes, todasSesiones, todosSets } = datos;
  const ejercicios = ejerciciosDe(sesion.sessionName);
  const comparacion = compararSesiones(seriesHoy, seriesAntes, ejercicios);
  const previstas = seriesPrevistas(sesion.sessionName);
  const deltaVolumen = anterior ? comparacion.volumenHoy - comparacion.volumenAntes : null;
  const proxima = proximaVezQueToca(ajustes.startDate, sesion.date, sesion.sessionName);

  const consejo = construirConsejo({ sesion, ejercicios, todasSesiones, todosSets, comparacion, anterior });

  // Los ⭐ del plan (laterales, pullover, hombro posterior, sóleo, tibial)
  // sostienen la salud del hombro y la espalda: saltárselos no es lo mismo que
  // saltarse un accesorio, así que se dice en voz alta.
  const hechosIds = new Set(seriesHoy.map((s) => s.exerciseId));
  const prioritariosSaltados = ejercicios.filter((e) => e.prioritario && !hechosIds.has(e.id));

  return (
    <div className="f-pantalla">
      <div className="f-scroll" style={{ paddingTop: 16, gap: 16 }}>
        {/* ---- Sello de hecho ---- */}
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <div style={{ position: "relative", width: 74, height: 74, margin: "0 auto 14px" }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid var(--f-ok)",
                animation: "f-pulso 2.4s ease-out infinite",
              }}
            />
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "var(--f-ok)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--f-ok-tinta)",
                font: "800 30px/1 var(--f-display)",
              }}
            >
              ✓
            </span>
          </div>
          <div className="f-cifra" style={{ fontSize: 40, textTransform: "uppercase" }}>
            {sesion.sessionName} hecho
          </div>
          <div style={{ font: "400 14px/1.4 var(--f-ui)", color: "var(--f-texto2)", marginTop: 6 }}>
            {formatoDia(sesion.date)} · {duracion(sesion.durationMin)} ·{" "}
            {comparacion.porEjercicio.length} ejercicio{comparacion.porEjercicio.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* ---- Los dos números de cabecera ---- */}
        <div className="f-duo">
          <div className="f-tarjeta" style={{ padding: 14 }}>
            <div className="f-etiqueta" style={{ fontSize: 9.5, letterSpacing: ".12em" }}>VOLUMEN TOTAL</div>
            <div className="f-cifra" style={{ fontSize: 30, marginTop: 8 }}>
              {entero(comparacion.volumenHoy)}
              <span style={{ fontSize: 15, color: "var(--f-texto2)" }}> kg</span>
            </div>
            <div
              style={{
                font: "500 12px/1 var(--f-mono)",
                marginTop: 6,
                color: deltaVolumen == null ? "var(--f-texto2)" : deltaVolumen > 0 ? "var(--f-ok)" : deltaVolumen < 0 ? "var(--f-alerta)" : "var(--f-texto2)",
              }}
            >
              {deltaVolumen == null ? "primera vez" : `${conSignoEntero(deltaVolumen)} vs anterior`}
            </div>
          </div>

          <div className="f-tarjeta" style={{ padding: 14 }}>
            <div className="f-etiqueta" style={{ fontSize: 9.5, letterSpacing: ".12em" }}>SERIES</div>
            <div className="f-cifra" style={{ fontSize: 30, marginTop: 8 }}>
              {comparacion.seriesHechas}
              <span style={{ fontSize: 15, color: "var(--f-texto2)" }}>/{previstas}</span>
            </div>
            <div style={{ font: "500 12px/1 var(--f-mono)", color: "var(--f-texto2)", marginTop: 6 }}>
              {previstas - comparacion.seriesHechas === 0
                ? "0 saltadas"
                : `${previstas - comparacion.seriesHechas} saltadas`}
            </div>
          </div>
        </div>

        {/* ---- Ejercicio a ejercicio, ya comparado ---- */}
        <div className="f-tarjeta" style={{ padding: "6px 4px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px",
              font: "500 9.5px/1 var(--f-mono)",
              letterSpacing: ".12em",
              color: "var(--f-texto3)",
            }}
          >
            <span>EJERCICIO</span>
            <span>{anterior ? `HOY vs ${haceCuanto(anterior.date, sesion.date).toUpperCase()}` : "HOY"}</span>
          </div>
          {comparacion.porEjercicio.map((p) => (
            <div
              key={p.ejercicio.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "11px 12px",
                borderTop: "1px solid var(--f-borde-sutil)",
              }}
            >
              <span style={{ font: "500 13.5px/1.2 var(--f-ui)", minWidth: 0, flex: 1 }}>{p.ejercicio.name}</span>
              <span
                style={{
                  font: "600 13px/1 var(--f-mono)",
                  flex: "none",
                  color:
                    p.estado === "sube" ? "var(--f-ok)" : p.estado === "baja" ? "var(--f-alerta)" : p.estado === "nuevo" ? "var(--f-acento)" : "var(--f-texto2)",
                }}
              >
                {p.texto} &nbsp;{p.nota}
              </span>
            </div>
          ))}
        </div>

        {/* ---- Prioritarios que se han quedado sin hacer ---- */}
        {prioritariosSaltados.length > 0 && (
          <div className="f-tarjeta f-tarjeta--aviso" style={{ padding: "14px 15px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span className="f-punto" style={{ background: "var(--f-aviso)", width: 10, height: 10, marginTop: 5 }} />
            <div className="f-pretty" style={{ font: "400 13.5px/1.5 var(--f-ui)", color: "var(--f-texto2)" }}>
              <strong style={{ color: "var(--f-aviso)" }}>
                Te has saltado {prioritariosSaltados.length === 1 ? "un ejercicio" : `${prioritariosSaltados.length} ejercicios`} de los que no se saltan:
              </strong>{" "}
              {prioritariosSaltados.map((e) => e.name).join(", ")}. Son los que sostienen el hombro y la espalda; si un
              día vas justo de tiempo, recorta antes de los accesorios.
            </div>
          </div>
        )}

        {/* ---- La frase que te llevas a la próxima sesión ---- */}
        <div
          className="f-tarjeta"
          style={{ padding: "14px 15px", display: "flex", gap: 12, alignItems: "flex-start" }}
        >
          <span className="f-punto" style={{ background: `var(--f-${consejo.color})`, width: 10, height: 10, marginTop: 5 }} />
          <div className="f-pretty" style={{ font: "400 13.5px/1.5 var(--f-ui)", color: "var(--f-texto2)" }}>
            {consejo.texto}
          </div>
        </div>

        {proxima && (
          <div className="f-etiqueta" style={{ textAlign: "center" }}>
            PRÓXIMO {sesion.sessionName} · {formatoDia(proxima).toUpperCase()}
          </div>
        )}
      </div>

      <div className="f-acciones">
        <button className="f-boton" onClick={() => navegar("/", { replace: true })}>
          CERRAR EL DÍA
        </button>
      </div>
    </div>
  );
}

/**
 * Construye el consejo de cierre.
 * Prioriza lo accionable: primero lo que lleva estancado, después lo que ha ido bien.
 */
function construirConsejo({ sesion, ejercicios, todasSesiones, todosSets, comparacion, anterior }) {
  const mapaSesiones = new Map(todasSesiones.map((s) => [s.id, s]));

  // Se busca el ejercicio con el estancamiento más largo de la sesión.
  let peor = null;
  for (const ej of ejercicios) {
    const sets = todosSets.filter((s) => s.exerciseId === ej.id);
    if (!sets.length) continue;
    const historial = agruparPorSesion(sets, mapaSesiones, ej);
    const v = veredictoEjercicio(ej, historial);
    if ((v.estado === "estancado" || v.estado === "baja") && (!peor || v.planas > peor.veredicto.planas)) {
      peor = { ejercicio: ej, veredicto: v };
    }
  }

  if (peor) {
    return {
      color: "aviso",
      texto: `${peor.ejercicio.name} lleva ${peor.veredicto.planas} sesiones sin moverse. ${peor.veredicto.sugerencia}`,
    };
  }

  if (!anterior) {
    return {
      color: "acento",
      texto: "Primera vez de esta sesión: estos números son tu línea de salida. A partir de la próxima ya hay con qué comparar.",
    };
  }

  const delta = comparacion.volumenHoy - comparacion.volumenAntes;
  if (comparacion.suben > 0 && delta > 0) {
    return {
      color: "ok",
      texto: `Mejor sesión de ${sesion.sessionName} hasta ahora: ${comparacion.suben} ejercicio${comparacion.suben > 1 ? "s" : ""} por encima de la vez anterior y ${entero(delta)} kg más de volumen en total. Sigue con la misma progresión.`,
    };
  }

  if (comparacion.bajan > comparacion.suben) {
    return {
      color: "aviso",
      texto: "Sesión por debajo de la anterior. Si has dormido poco o venías con déficit alto es normal: repite las mismas cargas la próxima vez antes de tocar nada.",
    };
  }

  return {
    color: "ok",
    texto: "Sesión sólida, en línea con la anterior. Mantén las cargas hasta llenar el rango de repeticiones en todas las series.",
  };
}
