/*
 * FORJA · Entreno en vivo.
 *
 * Formato cuaderno: cada ejercicio es una tabla con columnas
 * SERIE · ANTERIOR · KG · REPS · ✓, todos los ejercicios uno debajo de otro.
 *
 * Cómo se usa:
 *  - Los valores vienen precargados (lo de hoy si ya tocaste la fila, si no
 *    la misma serie de la última vez). Se pueden teclear directamente.
 *  - El check de la derecha guarda la serie y arranca el descanso solo.
 *  - Desmarcar el check borra esa serie del registro.
 *  - "+ añadir serie" mete una fila extra más allá de las previstas.
 *
 * La cabecera lleva el cronómetro y los totales en vivo (volumen y series),
 * y TERMINAR cierra la sesión y abre el resumen comparado.
 *
 * Si sales y vuelves, la sesión se retoma tal cual: se crea al entrar y se
 * borra sola si te vas sin guardar ni una serie.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../datos/db.js";
import { OPCIONES_RIR, TECNICA_GENERAL } from "../datos/ejercicios.js";
import { useAjustes } from "../ganchos/useDatos.js";
import { useCuentaAtras, useCronometro } from "../ganchos/useTemporizador.js";
import { useWakeLock } from "../ganchos/useWakeLock.js";
import { hoyISO } from "../logica/fechas.js";
import { entero, kgSerie, reloj, serieTexto } from "../logica/formato.js";
import { bloquesDe, descansoDe, seriesPrevistas } from "../logica/sesionGym.js";
import {
  cancelarAvisoDescanso,
  prepararAudio,
  programarAvisoDescanso,
  senalDescansoFin,
  senalGuardado,
  vibrar,
} from "../utiles/senales.js";

/** Clave estable de una fila (ejercicio + número de serie). */
const clave = (exerciseId, serie) => `${exerciseId}#${serie}`;

export default function EntrenoVivo() {
  const { sessionName } = useParams();
  const nombre = decodeURIComponent(sessionName || "");
  const navegar = useNavigate();
  const { ajustes } = useAjustes();

  const bloques = useMemo(() => bloquesDe(nombre), [nombre]);
  const previstasTotal = useMemo(() => seriesPrevistas(nombre), [nombre]);

  const [sessionId, setSessionId] = useState(null);
  // Ediciones del usuario por fila. Lo que no esté aquí se deduce solo.
  const [valores, setValores] = useState({});
  // Filas extra añadidas a mano por ejercicio: { exerciseId: cuántas }.
  const [extras, setExtras] = useState({});
  const [descansando, setDescansando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  // Serie recién guardada a la espera de que anotes cuántas te quedaban.
  const [pendienteRir, setPendienteRir] = useState(null);

  const cronometro = useCronometro(true);
  useWakeLock(ajustes.wakeLock !== false);

  // ---- Sesión: se crea al entrar, se retoma si ya existe una hoy ----
  useEffect(() => {
    let vivo = true;
    (async () => {
      const hoy = hoyISO();
      // Buscar y crear van dentro de la misma transacción: si no, dos montajes
      // seguidos del componente crean dos sesiones para el mismo día.
      const id = await db.transaction("rw", db.gymSessions, async () => {
        const existente = await db.gymSessions
          .where("date")
          .equals(hoy)
          .filter((s) => s.sessionName === nombre)
          .first();
        if (existente) return existente.id;
        return db.gymSessions.add({ date: hoy, sessionName: nombre, durationMin: 0, notes: "" });
      });
      if (vivo) setSessionId(id);
    })();
    return () => {
      vivo = false;
    };
  }, [nombre]);

  const seriesHechas = useLiveQuery(
    () => (sessionId ? db.gymSets.where("sessionId").equals(sessionId).toArray() : Promise.resolve([])),
    [sessionId],
    [],
  );

  // Marcas de la última vez que se hizo esta misma sesión.
  const anterior = useLiveQuery(
    async () => {
      if (!sessionId) return null;
      const previas = await db.gymSessions.where("sessionName").equals(nombre).sortBy("date");
      const otras = previas.filter((s) => s.id !== sessionId);
      const ultima = otras[otras.length - 1];
      if (!ultima) return { sesion: null, porEjercicio: new Map() };
      const series = await db.gymSets.where("sessionId").equals(ultima.id).toArray();
      const porEjercicio = new Map();
      for (const s of series) {
        if (!porEjercicio.has(s.exerciseId)) porEjercicio.set(s.exerciseId, []);
        porEjercicio.get(s.exerciseId).push(s);
      }
      for (const lista of porEjercicio.values()) lista.sort((a, b) => a.setNumber - b.setNumber);
      return { sesion: ultima, porEjercicio };
    },
    [sessionId, nombre],
    undefined,
  );

  const hechasPorClave = useMemo(() => {
    const m = new Map();
    for (const s of seriesHechas) m.set(clave(s.exerciseId, s.setNumber), s);
    return m;
  }, [seriesHechas]);

  /**
   * Valor con el que se rellena una fila.
   *
   * Los kilos y las repeticiones se deducen por caminos distintos a propósito:
   *  - KG hereda de la serie que ya has hecho HOY en ese ejercicio, para que
   *    al subir el peso en la serie 1 las siguientes vayan con el peso nuevo.
   *  - REPS salen de la misma serie de la última vez, porque la caída de
   *    repeticiones entre series (12, 12, 11…) se repite sesión a sesión y
   *    arrastrar las 12 de la serie 1 a la 3 sería mentirte.
   */
  const valorDe = useCallback(
    (ejercicio, serie) => {
      const k = clave(ejercicio.id, serie);
      if (valores[k]) return valores[k];

      const guardada = hechasPorClave.get(k);
      if (guardada) return { kg: guardada.kg ?? 0, reps: guardada.reps ?? 0 };

      const hoyPrevia = seriesHechas
        .filter((s) => s.exerciseId === ejercicio.id && s.setNumber < serie)
        .sort((a, b) => b.setNumber - a.setNumber)[0];

      const previas = anterior?.porEjercicio?.get(ejercicio.id) || [];
      const mismaSerie = previas.find((s) => s.setNumber === serie) || previas[previas.length - 1];

      const kg = hoyPrevia?.kg ?? mismaSerie?.kg ?? (ejercicio.tipo === "tiempo" ? 0 : 20);
      const reps = mismaSerie?.reps ?? hoyPrevia?.reps ?? ejercicio.repMin ?? 10;
      return { kg, reps };
    },
    [valores, hechasPorClave, seriesHechas, anterior],
  );

  const editar = (ejercicio, serie, cambios) => {
    const k = clave(ejercicio.id, serie);
    setValores((v) => ({ ...v, [k]: { ...valorDe(ejercicio, serie), ...cambios } }));
    // Si la fila ya estaba guardada, la corrección va directa al registro.
    const guardada = hechasPorClave.get(k);
    if (guardada) {
      const nuevo = { ...valorDe(ejercicio, serie), ...cambios };
      db.gymSets.update(guardada.id, { kg: nuevo.kg, reps: nuevo.reps });
    }
  };

  // ---- Descanso ----
  const alTerminarDescanso = useCallback(() => {
    setDescansando(false);
    senalDescansoFin();
  }, []);
  // Duración constante como prop: el valor real se fija a mano con reiniciar()
  // al marcar cada serie. Si dependiera del ejercicio activo, cambiar de
  // tarjeta resetearía (y mataría) un descanso en marcha.
  const descanso = useCuentaAtras(120, alTerminarDescanso, false);

  // Si sales del entreno con un descanso en marcha, su aviso ya no toca.
  useEffect(() => () => cancelarAvisoDescanso(), []);

  /** Marca una serie: la guarda y arranca el descanso de ese ejercicio. */
  const marcar = async (ejercicio, serie) => {
    if (!sessionId) return;
    prepararAudio();

    const { kg, reps } = valorDe(ejercicio, serie);
    const fila = {
      sessionId,
      exerciseId: ejercicio.id,
      setNumber: serie,
      kg: ejercicio.tipo === "tiempo" ? kg || 0 : kg,
      reps,
      isWarmup: false,
    };
    // Upsert atómico: un doble toque rápido no puede duplicar la fila.
    const filaId = await db.transaction("rw", db.gymSets, async () => {
      const ya = await db.gymSets
        .where("[exerciseId+sessionId]")
        .equals([ejercicio.id, sessionId])
        .filter((s) => s.setNumber === serie)
        .first();
      if (ya) {
        await db.gymSets.update(ya.id, fila);
        return ya.id;
      }
      return db.gymSets.add(fila);
    });

    senalGuardado();
    // Se pregunta el RIR de ESTA serie mientras descansas: es el único momento
    // en que la tienes fresca y además no roba sitio a la tabla.
    setPendienteRir({ id: filaId, ejercicio: ejercicio.name, serie });
    // reiniciar() actualiza la ref de forma síncrona: arrancar va seguido.
    descanso.reiniciar(descansoDe(ejercicio));
    descanso.arrancar();
    setDescansando(true);
    // El despertador del service worker avisa aunque Android congele la app.
    programarAvisoDescanso(descansoDe(ejercicio));
  };

  /** Anota las repeticiones que te quedaban en la serie recién guardada. */
  const anotarRir = async (valor) => {
    if (!pendienteRir) return;
    await db.gymSets.update(pendienteRir.id, { rir: valor });
    vibrar(20);
    setPendienteRir(null);
  };

  /** Desmarca una serie: la quita del registro. */
  const desmarcar = async (ejercicio, serie) => {
    const guardada = hechasPorClave.get(clave(ejercicio.id, serie));
    if (guardada) await db.gymSets.delete(guardada.id);
    vibrar(25);
  };

  const anadirSerie = (ejercicio) => {
    setExtras((e) => ({ ...e, [ejercicio.id]: (e[ejercicio.id] || 0) + 1 }));
    vibrar(20);
  };

  const salir = async () => {
    // Si te vas sin guardar nada, la sesión vacía no se queda en el historial.
    if (sessionId && seriesHechas.length === 0) await db.gymSessions.delete(sessionId);
    navegar("/", { replace: true });
  };

  const terminar = async () => {
    if (seriesHechas.length === 0) {
      salir();
      return;
    }
    setSaliendo(true);
    await db.gymSessions.update(sessionId, { durationMin: Math.round(cronometro.segundos / 60) });
    navegar(`/resumen/${sessionId}`, { replace: true });
  };

  if (!bloques.length) {
    return (
      <div className="f-pantalla">
        <div className="f-scroll">
          <h1 className="f-titulo">Sesión desconocida</h1>
          <button className="f-boton f-boton--fantasma" onClick={() => navegar("/")}>VOLVER</button>
        </div>
      </div>
    );
  }

  const hechas = seriesHechas.filter((s) => !s.isWarmup).length;
  const volumen = seriesHechas.reduce((t, s) => t + (s.kg || 0) * (s.reps || 0), 0);

  return (
    <div className="f-pantalla">
      {/* ---- Cabecera: nombre, TERMINAR y totales en vivo ---- */}
      <div style={{ flex: "none", padding: "12px 18px 0" }}>
        <div className="f-fila-sb">
          <button
            onClick={salir}
            style={{
              font: "800 22px/1 var(--f-display)",
              textTransform: "uppercase",
              letterSpacing: ".04em",
              color: "var(--f-texto)",
              padding: "8px 10px 8px 0",
              margin: "-8px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "var(--f-texto3)", fontSize: 18 }}>‹</span> {nombre}
          </button>
          <button
            className="f-boton"
            style={{ width: "auto", minHeight: 44, padding: "0 20px", fontSize: 16, borderRadius: 12 }}
            onClick={terminar}
            disabled={saliendo || !sessionId}
          >
            TERMINAR
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            margin: "14px 0 12px",
            paddingBottom: 12,
            borderBottom: "1px solid var(--f-borde-sutil)",
          }}
        >
          <Dato etiqueta="DURACIÓN" valor={reloj(cronometro.segundos)} acento />
          <Dato etiqueta="VOLUMEN" valor={`${entero(volumen)} kg`} />
          <Dato etiqueta="SERIES" valor={`${hechas}/${previstasTotal}`} />
        </div>

        <div
          className="f-pretty"
          style={{ font: "400 11.5px/1.4 var(--f-ui)", color: "var(--f-texto3)", marginTop: -4, marginBottom: 8 }}
        >
          {TECNICA_GENERAL}
        </div>
      </div>

      {/* ---- Todos los ejercicios, en orden ---- */}
      <div className="f-scroll" style={{ paddingTop: 2, gap: 14 }}>
        {bloques.map((bloque, iBloque) => (
          <div key={bloque.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bloque.superserie && (
              <div className="f-etiqueta" style={{ color: "var(--f-acento)", paddingLeft: 2 }}>
                SUPERSERIE {bloque.superserie} · SE ALTERNAN SIN DESCANSO ENTRE ELLOS
              </div>
            )}
            {bloque.ejercicios.map((ejercicio) => (
              <TablaEjercicio
                key={ejercicio.id}
                numero={iBloque + 1}
                ejercicio={ejercicio}
                extras={extras[ejercicio.id] || 0}
                hechasPorClave={hechasPorClave}
                previas={anterior?.porEjercicio?.get(ejercicio.id) || []}
                valorDe={valorDe}
                onEditar={editar}
                onMarcar={marcar}
                onDesmarcar={desmarcar}
                onAnadir={anadirSerie}
              />
            ))}
          </div>
        ))}
        <div style={{ height: 4 }} />
      </div>

      {/* ---- Descanso: barra fija abajo mientras corre ----
           Si hay un RIR pendiente se pregunta aquí: estás parado de todas
           formas y la serie la acabas de hacer, así que el dato sale limpio. */}
      {descansando && (
        <div
          className="f-acciones f-entra"
          style={{ borderTop: "1px solid var(--f-acento)", paddingBottom: "calc(12px + var(--f-safe-abajo))" }}
        >
          <button
            onClick={() => {
              // Saltas el descanso a mano: el despertador ya no pinta nada.
              cancelarAvisoDescanso();
              descanso.saltar();
            }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 12 }}
          >
            <span style={{ textAlign: "left" }}>
              <span className="f-etiqueta" style={{ display: "block" }}>DESCANSO</span>
              <span style={{ display: "block", font: "400 12.5px/1.3 var(--f-ui)", color: "var(--f-texto2)", marginTop: 5 }}>
                Toca para saltarlo
              </span>
            </span>
            <span className="f-cifra f-acento" style={{ fontSize: 44 }}>
              {reloj(descanso.restante)}
            </span>
          </button>

          {pendienteRir && (
            <div style={{ borderTop: "1px solid var(--f-borde-sutil)", paddingTop: 12 }}>
              <div className="f-fila-sb" style={{ marginBottom: 10 }}>
                <span className="f-etiqueta">¿CUÁNTAS TE QUEDABAN?</span>
                <button
                  onClick={() => setPendienteRir(null)}
                  style={{ font: "500 11px/1 var(--f-mono)", color: "var(--f-texto3)", padding: 8, margin: -8 }}
                >
                  SALTAR
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {OPCIONES_RIR.map((o) => (
                  <button
                    key={o.valor}
                    onClick={() => anotarRir(o.valor)}
                    style={{
                      flex: 1,
                      minHeight: 56,
                      borderRadius: 12,
                      border: `1px solid var(--f-${o.color})`,
                      color: `var(--f-${o.color})`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                    }}
                  >
                    <span style={{ font: "800 22px/1 var(--f-display)" }}>{o.etiqueta}</span>
                    <span style={{ font: "400 10px/1 var(--f-ui)", opacity: 0.85 }}>{o.ayuda}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Dato({ etiqueta, valor, acento }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="f-etiqueta" style={{ fontSize: 9.5 }}>{etiqueta}</div>
      <div
        className="f-cifra"
        style={{ fontSize: 22, marginTop: 6, color: acento ? "var(--f-acento)" : "var(--f-texto)" }}
      >
        {valor}
      </div>
    </div>
  );
}

/* ==================== LA TABLA DE UN EJERCICIO ==================== */

function TablaEjercicio({
  numero,
  ejercicio,
  extras,
  hechasPorClave,
  previas,
  valorDe,
  onEditar,
  onMarcar,
  onDesmarcar,
  onAnadir,
}) {
  const esTiempo = ejercicio.tipo === "tiempo";

  // Filas visibles: las previstas + las guardadas por encima + las añadidas.
  const maxGuardada = Math.max(
    0,
    ...[...hechasPorClave.keys()]
      .filter((k) => k.startsWith(`${ejercicio.id}#`))
      .map((k) => Number(k.split("#")[1])),
  );
  const totalFilas = Math.max(ejercicio.series || 1, maxGuardada) + extras;
  const filas = Array.from({ length: totalFilas }, (_, i) => i + 1);

  const hechasDeEste = filas.filter((s) => hechasPorClave.has(clave(ejercicio.id, s))).length;
  const completo = hechasDeEste >= (ejercicio.series || 1);

  return (
    <div className="f-tarjeta" style={{ padding: "14px 0 6px" }}>
      {/* Cabecera del ejercicio */}
      <div style={{ padding: "0 14px 4px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ font: "600 11px/1 var(--f-mono)", color: "var(--f-texto3)", flex: "none" }}>
            {String(numero).padStart(2, "0")}
          </span>
          <span
            style={{
              font: "700 17px/1.2 var(--f-display)",
              textTransform: "uppercase",
              letterSpacing: ".02em",
              color: completo ? "var(--f-ok)" : "var(--f-acento)",
            }}
          >
            {ejercicio.name}
            {/* ⭐ del plan: laterales, pullover, hombro posterior, sóleo y tibial */}
            {ejercicio.prioritario && <span style={{ color: "var(--f-aviso)" }}> ★</span>}
          </span>
        </div>
        <div style={{ font: "400 12.5px/1.3 var(--f-ui)", color: "var(--f-texto2)", marginTop: 5 }}>
          Objetivo {ejercicio.doseText} · descanso {descansoDe(ejercicio)} s
        </div>

        {/* La técnica va aquí y no en un manual aparte: se lee justo antes de
            hacer la serie, que es el único momento en que sirve de algo. */}
        {ejercicio.tecnica && (
          <div
            className="f-pretty"
            style={{ font: "400 12px/1.45 var(--f-ui)", color: "var(--f-texto3)", marginTop: 7 }}
          >
            {ejercicio.tecnica}
          </div>
        )}
      </div>

      {/* Cabecera de columnas */}
      <div style={{ ...estiloFila, padding: "8px 14px 6px" }}>
        <span style={celSerie} className="f-etiqueta">SERIE</span>
        <span style={celAnterior} className="f-etiqueta">ANTERIOR</span>
        <span style={celNum} className="f-etiqueta">{esTiempo ? "KG" : "KG"}</span>
        <span style={celNum} className="f-etiqueta">{esTiempo ? "SEG" : "REPS"}</span>
        <span style={celCheck} className="f-etiqueta">✓</span>
      </div>

      {/* Filas */}
      {filas.map((serie) => {
        const guardada = hechasPorClave.get(clave(ejercicio.id, serie));
        const { kg, reps } = valorDe(ejercicio, serie);
        const previa = previas.find((s) => s.setNumber === serie);
        return (
          <div
            key={serie}
            style={{
              ...estiloFila,
              padding: "7px 14px",
              borderTop: "1px solid var(--f-borde-sutil)",
              background: guardada ? "color-mix(in srgb, var(--f-ok) 8%, transparent)" : "transparent",
            }}
          >
            <span style={{ ...celSerie, font: "700 15px/1 var(--f-display)", color: "var(--f-texto)" }}>
              {serie}
            </span>
            <span style={{ ...celAnterior, font: "500 12.5px/1 var(--f-mono)", color: "var(--f-texto3)" }}>
              {previa ? serieTexto(previa.kg, previa.reps, ejercicio.tipo) : "—"}
            </span>
            <span style={celNum}>
              <CampoNum
                valor={kg}
                decimal
                oculto={esTiempo && !kg}
                onCambio={(v) => onEditar(ejercicio, serie, { kg: v })}
              />
            </span>
            <span style={celNum}>
              <CampoNum valor={reps} onCambio={(v) => onEditar(ejercicio, serie, { reps: v })} />
            </span>
            <span style={celCheck}>
              <button
                onClick={() => (guardada ? onDesmarcar(ejercicio, serie) : onMarcar(ejercicio, serie))}
                aria-label={guardada ? `Desmarcar serie ${serie}` : `Guardar serie ${serie}`}
                style={{
                  width: 44,
                  height: 40,
                  borderRadius: 10,
                  background: guardada ? "var(--f-ok)" : "var(--f-sup2)",
                  border: guardada ? "none" : "1px solid var(--f-borde2)",
                  color: guardada ? "var(--f-ok-tinta)" : "var(--f-texto3)",
                  font: "700 17px/1 var(--f-ui)",
                }}
              >
                ✓
              </button>
            </span>
          </div>
        );
      })}

      {/* Indicación de la última serie: parciales hasta quemar, al fallo… */}
      {ejercicio.ultimaSerie && (
        <div
          style={{
            margin: "6px 14px 0",
            padding: "8px 11px",
            borderRadius: 10,
            background: "var(--f-sup2)",
            font: "500 12px/1.4 var(--f-ui)",
            color: "var(--f-aviso)",
          }}
        >
          {ejercicio.ultimaSerie}
        </div>
      )}

      {/* Añadir serie extra */}
      <div style={{ padding: "8px 14px 8px" }}>
        <button
          onClick={() => onAnadir(ejercicio)}
          style={{
            width: "100%",
            minHeight: 40,
            borderRadius: 10,
            border: "1px dashed var(--f-borde2)",
            color: "var(--f-texto3)",
            font: "600 12px/1 var(--f-mono)",
            letterSpacing: ".08em",
          }}
        >
          + AÑADIR SERIE
        </button>
      </div>
    </div>
  );
}

/* Reparto de columnas de la tabla, compartido entre cabecera y filas. */
const estiloFila = { display: "flex", alignItems: "center", gap: 8 };
const celSerie = { width: 26, flex: "none", textAlign: "left" };
// paddingLeft separa "SERIE" de "ANTERIOR" en la cabecera: pegadas se leían
// como una sola palabra.
const celAnterior = { flex: 1, minWidth: 0, textAlign: "left", paddingLeft: 6 };
const celNum = { width: 64, flex: "none", textAlign: "center" };
const celCheck = { width: 44, flex: "none", textAlign: "center" };

/**
 * Celda numérica editable, con teclado numérico del móvil.
 *
 * El valor se confirma en CADA pulsación, no al salir del campo: si solo se
 * confirmara al perder el foco, teclear "60" y tocar el ✓ directamente podía
 * guardar el peso viejo. `texto` guarda lo que hay escrito mientras editas
 * (para poder borrar del todo o escribir "52,") y se suelta al salir, momento
 * en el que si el campo quedó vacío se recupera el valor previo.
 */
function CampoNum({ valor, onCambio, decimal = false, oculto = false }) {
  const [texto, setTexto] = useState(null); // null = sin edición en curso

  if (oculto) return <span style={{ color: "var(--f-texto3)" }}>—</span>;

  const mostrado = texto !== null ? texto : decimal ? kgSerie(valor) : String(valor);

  const alEscribir = (bruto) => {
    // Se acepta coma o punto y se descarta cualquier otro carácter.
    const limpio = bruto.replace(/[^\d.,]/g, "");
    setTexto(limpio);
    const n = Number(limpio.replace(",", "."));
    if (limpio !== "" && Number.isFinite(n) && n >= 0) {
      onCambio(decimal ? Math.round(n * 100) / 100 : Math.round(n));
    }
  };

  return (
    <input
      value={mostrado}
      inputMode={decimal ? "decimal" : "numeric"}
      enterKeyHint="done"
      onFocus={(e) => e.target.select()}
      onChange={(e) => alEscribir(e.target.value)}
      onBlur={() => setTexto(null)}
      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
      style={{
        width: "100%",
        height: 40,
        background: "var(--f-sup2)",
        border: "1px solid transparent",
        borderRadius: 10,
        textAlign: "center",
        font: "700 16px/1 var(--f-mono)",
        color: "var(--f-texto)",
        fontVariantNumeric: "tabular-nums",
      }}
    />
  );
}
