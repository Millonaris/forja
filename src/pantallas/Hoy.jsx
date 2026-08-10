/*
 * FORJA · HOY. El centro de mando.
 *
 * Una sola pregunta respondida arriba del todo: ¿qué toca hoy? Todo lo demás
 * (postura, peso, mañana) se reduce a estados de una palabra para no competir
 * con la tarjeta-héroe, y las acciones viven en el tercio inferior.
 *
 * El primer día no hay nada que comparar, así que la pantalla se sustituye por
 * las tres tareas de calibración en vez de enseñar tarjetas vacías.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";

import { db } from "../datos/db.js";
import { FASES } from "../datos/planCarrera.js";
import { useAjustes, useCarreras, useCuerpo, usePostura } from "../ganchos/useDatos.js";
import { planDelDia, SEMANAS_PLAN } from "../logica/calendario.js";
import { formatoDiaMayus, haceCuanto, hoyISO, sumarDias, semanaDelPlan } from "../logica/fechas.js";
import { conSigno, entero, peso } from "../logica/formato.js";
import { duracionEstimada, numeroBloques } from "../logica/sesionGym.js";
import { ejerciciosDe } from "../datos/ejercicios.js";
import { idsPrincipales } from "../datos/rutinaPostural.js";
import { mediaMovil } from "../logica/nutricion.js";
import { avisoAntesDePierna } from "../logica/interferencia.js";
import { copiaPendiente } from "../utiles/copiaSeguridad.js";
import DialogoPeso from "../componentes/DialogoPeso.jsx";
import { useState } from "react";

/** Saludo según la hora, porque la app se abre sobre todo a primera hora. */
function saludo() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 21) return "Buenas tardes";
  return "Buenas noches";
}

export default function Hoy() {
  const navegar = useNavigate();
  const { ajustes } = useAjustes();
  const [dialogoPeso, setDialogoPeso] = useState(false);

  const hoy = hoyISO();
  const manana = sumarDias(hoy, 1);
  const inicio = ajustes.startDate;
  const semana = semanaDelPlan(inicio, hoy);

  const plan = planDelDia(inicio, hoy);
  const planManana = planDelDia(inicio, manana);

  const registrosCuerpo = useCuerpo(30);
  const carreras = useCarreras();
  const posturaPorDia = usePostura();

  // ¿Ya está entrenado lo de hoy? Los botones cambian de estado en consecuencia.
  const sesionHoy = useLiveQuery(() => db.gymSessions.where("date").equals(hoy).first(), [hoy], undefined);
  const carreraHoy = useLiveQuery(() => db.runs.where("date").equals(hoy).first(), [hoy], undefined);

  // Última vez que se hizo esta misma sesión, para el "hace 3 días".
  const ultimaIgual = useLiveQuery(
    async () => {
      if (!plan?.gym) return null;
      const previas = await db.gymSessions.where("sessionName").equals(plan.gym.sessionName).sortBy("date");
      const anteriores = previas.filter((s) => s.date < hoy);
      return anteriores[anteriores.length - 1] || null;
    },
    [plan?.gym?.sessionName, hoy],
    undefined,
  );

  const totalRegistros = useLiveQuery(
    async () => (await db.gymSessions.count()) + (await db.bodyLog.count()) + (await db.runs.count()),
    [],
    undefined,
  );

  const cuerpoHoy = registrosCuerpo.find((r) => r.date === hoy);
  const posturaHoy = posturaPorDia.get(hoy);
  const idsHoy = idsPrincipales(semana);
  const posturaHechos = posturaHoy?.completedIds?.filter((id) => idsHoy.includes(id)).length || 0;

  // Todavía cargando de IndexedDB: no se pinta nada para no dar un salto visual.
  if (totalRegistros === undefined) return <div className="f-pantalla" />;

  // Día 1: sin ningún dato, la pantalla es otra.
  if (totalRegistros === 0) return <PrimerDia inicio={inicio} onApuntarPeso={() => setDialogoPeso(true)} dialogoPeso={dialogoPeso} cerrar={() => setDialogoPeso(false)} />;

  const tendencia = calcularTendencia(registrosCuerpo);
  const copia = copiaPendiente(ajustes.ultimoBackup, totalRegistros > 0);
  const avisoCarrera = avisoAntesDePierna(plan?.gym?.sessionName, carreras, hoy);

  return (
    <div className="f-pantalla">
      <div className="f-scroll" style={{ paddingTop: 14 }}>
        {/* ---- Cabecera: fecha, saludo y semana del plan ---- */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: "500 11px/1 var(--f-mono)", letterSpacing: ".16em", color: "var(--f-texto3)" }}>
              {formatoDiaMayus(hoy)}
            </div>
            <div className="f-cifra" style={{ fontSize: 34, lineHeight: 1.05, textTransform: "uppercase", marginTop: 4 }}>
              {saludo()}
            </div>
          </div>
          <button
            onClick={() => navegar("/ajustes")}
            style={{ textAlign: "right", flex: "none", padding: "6px 0 6px 12px" }}
            aria-label="Ajustes"
          >
            <div className="f-cifra f-acento" style={{ fontSize: 26 }}>
              {Math.min(semana, SEMANAS_PLAN)}
              <span style={{ color: "var(--f-texto3)" }}>/{SEMANAS_PLAN}</span>
            </div>
            <div className="f-etiqueta" style={{ marginTop: 4 }}>SEMANA ⚙</div>
          </button>
        </div>

        <BarraFases semana={semana} />

        {/* ---- Tarjeta-héroe: lo principal del día ---- */}
        {plan?.gym ? (
          <HeroeGym
            plan={plan}
            hecha={!!sesionHoy}
            ultima={ultimaIgual}
            avisoCarrera={avisoCarrera}
            onEmpezar={() => navegar(`/entreno/${encodeURIComponent(plan.gym.sessionName)}`)}
            onVerResumen={() => sesionHoy && navegar(`/resumen/${sesionHoy.id}`)}
          />
        ) : plan?.carrera ? (
          <HeroeCarrera
            plan={plan}
            hecha={!!carreraHoy}
            onEmpezar={() =>
              plan.carrera.tipo === "intervalos"
                ? navegar(`/intervalos/${plan.carrera.semanaIntervalos}`)
                : navegar("/carrera")
            }
          />
        ) : (
          <HeroeDescanso semana={semana} />
        )}

        {/* ---- Estados de una palabra ---- */}
        <div className="f-duo">
          <div className="f-tarjeta" style={{ padding: "14px 14px 12px", minHeight: 104, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div className="f-etiqueta">POSTURA</div>
            <div>
              {/* Los domingos la rutina no está planificada: ni se marca como
                  pendiente ni rompe la racha, así que no debe dar la lata. */}
              <div
                className="f-cifra"
                style={{
                  fontSize: 22,
                  color: posturaHoy?.fullDone
                    ? "var(--f-ok)"
                    : plan?.postura
                      ? "var(--f-aviso)"
                      : "var(--f-texto3)",
                }}
              >
                {posturaHoy?.fullDone ? "HECHA" : plan?.postura ? "PENDIENTE" : "DÍA LIBRE"}
              </div>
              <div style={{ font: "400 12px/1.3 var(--f-ui)", color: "var(--f-texto2)", marginTop: 3 }}>
                {posturaHechos}/{idsHoy.length} ejerc. · 8 min
              </div>
            </div>
            <button
              className="f-boton f-boton--aviso-fantasma"
              style={{
                minHeight: 34,
                fontSize: 12,
                borderRadius: 10,
                ...(posturaHoy?.fullDone || !plan?.postura
                  ? { borderColor: "var(--f-borde)", color: "var(--f-texto2)" }
                  : null),
              }}
              onClick={() => navegar("/postura/rutina")}
            >
              {posturaHoy?.fullDone ? "REPASAR" : plan?.postura ? "HACER" : "HACER IGUAL"}
            </button>
          </div>

          <div className="f-tarjeta" style={{ padding: "14px 14px 12px", minHeight: 104, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div className="f-etiqueta">PESO DE HOY</div>
            <div>
              <div className="f-cifra" style={{ fontSize: 30 }}>
                {cuerpoHoy?.kg != null ? peso(cuerpoHoy.kg) : "—"}
                <span style={{ fontSize: 16, color: "var(--f-texto2)" }}> kg</span>
              </div>
              <div
                style={{
                  font: "400 12px/1.3 var(--f-ui)",
                  marginTop: 3,
                  color: tendencia == null ? "var(--f-texto2)" : tendencia < 0 ? "var(--f-ok)" : "var(--f-texto2)",
                }}
              >
                {tendencia == null
                  ? cuerpoHoy?.kg != null
                    ? "primer registro"
                    : "sin apuntar hoy"
                  : `${conSigno(tendencia)} vs semana pasada`}
              </div>
            </div>
            <button
              className="f-boton f-boton--fantasma"
              style={{ minHeight: 34, fontSize: 12, borderRadius: 10, color: "var(--f-texto2)" }}
              onClick={() => setDialogoPeso(true)}
            >
              {cuerpoHoy?.kcal != null ? `${entero(cuerpoHoy.kcal)} KCAL` : "+ KCAL"}
            </button>
          </div>
        </div>

        {/* ---- Aviso de copia de seguridad ----
             Los datos solo viven aquí: si no sale una copia del móvil cada
             pocas semanas, un teléfono perdido se lleva el plan entero. */}
        {copia.toca && (
          <button
            className="f-tarjeta f-tarjeta--aviso"
            style={{ padding: "13px 15px", display: "flex", gap: 12, alignItems: "flex-start", width: "100%", textAlign: "left" }}
            onClick={() => navegar("/ajustes")}
          >
            <span className="f-punto" style={{ background: "var(--f-aviso)", marginTop: 5 }} />
            <span className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)" }}>
              <strong style={{ color: "var(--f-aviso)" }}>
                {copia.dias == null ? "Nunca has hecho copia." : `Hace ${copia.dias} días de la última copia.`}
              </strong>{" "}
              Tus datos solo están en este móvil. Exporta el JSON y mándatelo a Drive: son dos toques.
            </span>
          </button>
        )}

        {/* ---- Qué toca mañana ---- */}
        {planManana && (
          <button
            className="f-tarjeta"
            style={{ padding: "13px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left", width: "100%" }}
            onClick={() => navegar("/diario")}
          >
            <div style={{ minWidth: 0 }}>
              <div className="f-etiqueta">
                MAÑANA · {planManana.gym ? "GIMNASIO" : planManana.carrera ? "CARRERA" : "DESCANSO"}
              </div>
              <div style={{ font: "600 14px/1.3 var(--f-ui)", marginTop: 5 }}>
                {planManana.gym?.sessionName || planManana.carrera?.detalle || "Solo postura y comer bien"}
              </div>
            </div>
            <span style={{ width: 26, height: 26, border: "2px solid var(--f-texto3)", borderRadius: "50%", flex: "none" }} />
          </button>
        )}
      </div>

      {/* ---- Acciones principales, al alcance del pulgar ---- */}
      <div className="f-acciones">
        <button className="f-boton" onClick={() => setDialogoPeso(true)}>
          APUNTAR PESO Y KCAL
        </button>
      </div>

      {dialogoPeso && <DialogoPeso fecha={hoy} onCerrar={() => setDialogoPeso(false)} />}
    </div>
  );
}

/** Barra de las 3 fases del plan de carrera con el avance real dentro de cada una. */
function BarraFases({ semana }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 4, height: 6 }}>
        {FASES.map((fase) => {
          const total = fase.hasta - fase.desde + 1;
          const avance = Math.max(0, Math.min(total, semana - fase.desde + 1));
          const pct = (avance / total) * 100;
          return (
            <div
              key={fase.n}
              style={{ flex: total, background: "var(--f-borde)", borderRadius: 3, overflow: "hidden" }}
            >
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--f-acento)", borderRadius: 3 }} />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 7,
          font: "500 9.5px/1 var(--f-mono)",
          letterSpacing: ".1em",
          color: "var(--f-texto3)",
        }}
      >
        {FASES.map((f) => (
          <span key={f.n} style={{ color: semana >= f.desde && semana <= f.hasta ? "var(--f-acento)" : undefined }}>
            {f.nombre}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroeGym({ plan, hecha, ultima, avisoCarrera, onEmpezar, onVerResumen }) {
  const nombre = plan.gym.sessionName;
  const ejercicios = ejerciciosDe(nombre);
  const primeros = ejercicios.slice(0, 2);
  const restantes = ejercicios.length - primeros.length;

  return (
    <div className={`f-tarjeta ${hecha ? "f-tarjeta--ok" : "f-tarjeta--destacada"}`} style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="f-punto" style={{ background: hecha ? "var(--f-ok)" : "var(--f-acento)", width: 8, height: 8 }} />
        <span
          style={{
            font: "600 11px/1 var(--f-mono)",
            letterSpacing: ".16em",
            color: hecha ? "var(--f-ok)" : "var(--f-acento)",
          }}
        >
          {hecha ? "HECHO HOY · GIMNASIO" : "HOY TOCA · GIMNASIO"}
        </span>
      </div>

      <div className="f-cifra" style={{ fontSize: 54, textTransform: "uppercase", margin: "12px 0 6px" }}>
        {nombre}
      </div>
      <div style={{ font: "400 14px/1.4 var(--f-ui)", color: "var(--f-texto2)" }}>
        {numeroBloques(nombre)} ejercicios · ~{duracionEstimada(nombre)} min
        {ultima ? ` · última vez ${haceCuanto(ultima.date)}` : " · primera vez"}
      </div>

      {plan.gym.aviso && (
        <div
          style={{
            marginTop: 12,
            font: "500 12px/1.4 var(--f-ui)",
            color: "var(--f-aviso)",
            background: "var(--f-sup2)",
            border: "1px solid var(--f-borde)",
            borderRadius: "var(--f-r-chip)",
            padding: "9px 11px",
          }}
        >
          {plan.gym.aviso}
        </div>
      )}

      {/* Interferencia: correr y hacer pierna compiten por la misma
          recuperación, y saberlo ANTES evita leer una mala sesión como
          estancamiento. */}
      {avisoCarrera && (
        <div
          className="f-pretty"
          style={{
            marginTop: 10,
            font: "400 12px/1.45 var(--f-ui)",
            color: "var(--f-texto2)",
            background: "var(--f-sup2)",
            border: "1px solid var(--f-aviso)",
            borderRadius: "var(--f-r-chip)",
            padding: "9px 11px",
          }}
        >
          <strong style={{ color: "var(--f-aviso)" }}>{avisoCarrera.titulo}</strong> {avisoCarrera.texto}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, margin: "14px 0 18px", flexWrap: "wrap" }}>
        {primeros.map((e) => (
          <span key={e.id} className="f-chip">
            {e.name} {e.doseText}
          </span>
        ))}
        {restantes > 0 && <span className="f-chip" style={{ color: "var(--f-texto3)" }}>+{restantes} más</span>}
      </div>

      {hecha ? (
        <button className="f-boton f-boton--fantasma" onClick={onVerResumen}>
          VER RESUMEN
        </button>
      ) : (
        <button className="f-boton" onClick={onEmpezar}>
          EMPEZAR SESIÓN
        </button>
      )}
    </div>
  );
}

function HeroeCarrera({ plan, hecha, onEmpezar }) {
  const c = plan.carrera;
  return (
    <div className={`f-tarjeta ${hecha ? "f-tarjeta--ok" : "f-tarjeta--destacada"}`} style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="f-punto" style={{ background: hecha ? "var(--f-ok)" : "var(--f-acento)", width: 8, height: 8 }} />
        <span
          style={{
            font: "600 11px/1 var(--f-mono)",
            letterSpacing: ".16em",
            color: hecha ? "var(--f-ok)" : "var(--f-acento)",
          }}
        >
          {hecha ? "HECHO HOY · CARRERA" : `HOY TOCA · ${c.etiqueta}`}
        </span>
      </div>

      <div className="f-cifra" style={{ fontSize: 34, lineHeight: 1.05, textTransform: "uppercase", margin: "12px 0 8px" }}>
        {c.detalle}
      </div>
      <div style={{ font: "400 13.5px/1.4 var(--f-ui)", color: "var(--f-texto2)" }}>
        {c.minutos ? `Total ${c.minutos} min` : `${String(c.km).replace(".", ",")} km`} · ritmo cómodo, que puedas hablar
      </div>

      {c.movida && (
        <div style={{ marginTop: 12, font: "500 12px/1.4 var(--f-ui)", color: "var(--f-aviso)" }}>
          {c.motivoMovida}
        </div>
      )}

      <button className="f-boton" style={{ marginTop: 16 }} onClick={onEmpezar} disabled={hecha}>
        {hecha ? "YA REGISTRADA" : c.tipo === "intervalos" ? "EMPEZAR INTERVALOS" : "REGISTRAR CARRERA"}
      </button>
    </div>
  );
}

function HeroeDescanso({ semana }) {
  return (
    <div className="f-tarjeta" style={{ padding: 22, borderStyle: "dashed" }}>
      <div className="f-etiqueta">HOY · DESCANSO</div>
      <div className="f-cifra" style={{ fontSize: 40, textTransform: "uppercase", margin: "12px 0 6px" }}>
        Día libre
      </div>
      <div className="f-pretty" style={{ font: "400 13.5px/1.5 var(--f-ui)", color: "var(--f-texto2)" }}>
        {semana <= 26
          ? "El descanso es parte del plan: es cuando el músculo que rompiste se rehace. Postura y comer bien siguen contando."
          : "Plan terminado. Sigue con la rotación si quieres mantener."}
      </div>
    </div>
  );
}

/** Diferencia entre la media de peso de esta semana y la de la anterior. */
function calcularTendencia(registros) {
  const medias = mediaMovil(registros, 7);
  if (medias.length < 8) return null;
  const actual = medias[medias.length - 1].media;
  const haceUnaSemana = medias[Math.max(0, medias.length - 8)].media;
  return actual - haceUnaSemana;
}

/** Pantalla del primer día: tres tareas de calibración en vez de tarjetas vacías. */
function PrimerDia({ inicio, onApuntarPeso, dialogoPeso, cerrar }) {
  const navegar = useNavigate();
  const hoy = hoyISO();
  const plan = planDelDia(inicio, hoy);

  const tareas = [
    { n: 1, titulo: "Pésate y apunta el peso", sub: "Punto de partida de todo", accion: onApuntarPeso },
    { n: 2, titulo: "Haz la foto de perfil", sub: "Semana 1, la referencia", accion: () => navegar("/postura") },
    { n: 3, titulo: "Test de la pared", sub: "4 comprobaciones, 2 min", accion: () => navegar("/postura") },
  ];

  return (
    <div className="f-pantalla">
      <div className="f-scroll" style={{ paddingTop: 14, gap: 16 }}>
        <div>
          {/* El engranaje también aquí: en el resto de la app se entra a Ajustes
              por el contador de semana, que el día 1 todavía no existe. Sin
              esto, recién instalada no hay forma de llegar a los ajustes. */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ font: "500 11px/1 var(--f-mono)", letterSpacing: ".16em", color: "var(--f-texto3)" }}>
              {formatoDiaMayus(hoy)} · DÍA 1
            </div>
            <button
              onClick={() => navegar("/ajustes")}
              style={{ flex: "none", padding: "4px 0 6px 12px", marginTop: -4 }}
              aria-label="Ajustes"
            >
              <span className="f-etiqueta">AJUSTES ⚙</span>
            </button>
          </div>
          <div className="f-cifra" style={{ fontSize: 40, lineHeight: 1.05, textTransform: "uppercase", marginTop: 8 }}>
            Empieza FORJA
          </div>
          <p className="f-pretty" style={{ font: "400 14px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 8 }}>
            Aún no hay nada que comparar. Las tres cosas de abajo montan la línea de salida; el resto se llena solo con el uso.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tareas.map((t, i) => (
            <button
              key={t.n}
              className={`f-tarjeta ${i === 0 ? "f-tarjeta--destacada" : ""}`}
              style={{ padding: 15, display: "flex", alignItems: "center", gap: 13, textAlign: "left", width: "100%" }}
              onClick={t.accion}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  flex: "none",
                  borderRadius: "50%",
                  border: `2px solid ${i === 0 ? "var(--f-acento)" : "var(--f-texto3)"}`,
                  color: i === 0 ? "var(--f-acento)" : "var(--f-texto3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "700 13px/1 var(--f-mono)",
                }}
              >
                {t.n}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: "600 15px/1.2 var(--f-ui)" }}>{t.titulo}</span>
                <span style={{ display: "block", font: "400 12px/1.3 var(--f-ui)", color: "var(--f-texto3)", marginTop: 4 }}>
                  {t.sub}
                </span>
              </span>
              <span style={{ color: i === 0 ? "var(--f-acento)" : "var(--f-texto3)", font: "600 16px/1 var(--f-ui)" }}>›</span>
            </button>
          ))}
        </div>

        <div className="f-tarjeta" style={{ borderStyle: "dashed", padding: "22px 18px", textAlign: "center" }}>
          <div className="f-cifra" style={{ fontSize: 22, textTransform: "uppercase", color: "var(--f-texto3)" }}>
            Sin historial todavía
          </div>
          <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 8 }}>
            Tras 3 sesiones verás aquí tu primera comparación “vs la vez anterior”.
          </div>
        </div>

        {plan?.gym && (
          <div className="f-tarjeta" style={{ padding: 15 }}>
            <div className="f-etiqueta">HOY TOCA</div>
            <div className="f-cifra" style={{ fontSize: 34, textTransform: "uppercase", marginTop: 10 }}>
              {plan.gym.sessionName}
            </div>
            <div style={{ font: "400 13px/1.4 var(--f-ui)", color: "var(--f-texto2)", marginTop: 6 }}>
              Primera sesión: entra con pesos cómodos, hoy solo calibramos.
            </div>
            <button
              className="f-boton f-boton--fantasma"
              style={{ marginTop: 14 }}
              onClick={() => navegar(`/entreno/${encodeURIComponent(plan.gym.sessionName)}`)}
            >
              EMPEZAR SESIÓN
            </button>
          </div>
        )}
      </div>

      <div className="f-acciones">
        <button className="f-boton" onClick={onApuntarPeso}>
          APUNTAR MI PESO
        </button>
      </div>

      {dialogoPeso && <DialogoPeso fecha={hoy} onCerrar={cerrar} />}
    </div>
  );
}
