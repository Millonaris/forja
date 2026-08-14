/*
 * FORJA · Ajustes.
 *
 * Agrupados por lo que cambia en la vida real: el plan, las rutinas, los
 * avisos y los datos. Exportar e importar van en primer plano a propósito:
 * es tu cuaderno, los datos son tuyos y tienen que poder salir en un toque.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Cabecera from "../componentes/Cabecera.jsx";
import { NOMBRES_SESION, ejerciciosDe } from "../datos/ejercicios.js";
import { guardarAjustes } from "../datos/db.js";
import { borrarRegistros } from "../datos/semilla.js";
import { useAjustes } from "../ganchos/useDatos.js";
import { FASES, INTERVALOS_F1, LARGAS, semanaCarreraPorFecha } from "../datos/planCarrera.js";
import { SEMANAS_PLAN, construirCalendario } from "../logica/calendario.js";
import { formatoCorto, hoyISO } from "../logica/fechas.js";
import { entero } from "../logica/formato.js";
import { estadoAlmacenamiento } from "../utiles/almacenamiento.js";
import { exportarJSON, formatearTamano, importarJSON, tamanoCopia } from "../utiles/copiaSeguridad.js";
import { pedirPermisoAvisos, senalGuardado, vibrar } from "../utiles/senales.js";

/*
 * Paletas de acento. Los bloques de color de verdad están en tokens.css
 * ([data-paleta]); aquí solo va la muestra que se pinta en el selector.
 */
const PALETAS = [
  { id: "cian", nombre: "cian", color: "#2FD8F5" },
  { id: "ambar", nombre: "amarillo", color: "#FFD60A" },
  { id: "lima", nombre: "lima", color: "#B4F53C" },
  { id: "naranja", nombre: "naranja", color: "#FF7A1A" },
  { id: "magenta", nombre: "magenta", color: "#FF5CA8" },
  { id: "violeta", nombre: "violeta", color: "#A98BFF" },
];

export default function Ajustes() {
  const { ajustes } = useAjustes();
  const navegar = useNavigate();
  const entradaFichero = useRef(null);

  const [tamano, setTamano] = useState(null);
  const [almacen, setAlmacen] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  // Solo al entrar en la pantalla: calcular el tamaño serializa la base
  // entera (fotos incluidas) y no puede colgar de cada toque a un interruptor.
  useEffect(() => {
    tamanoCopia().then(setTamano).catch(() => setTamano(null));
    estadoAlmacenamiento().then(setAlmacen).catch(() => setAlmacen(null));
  }, []);

  const cambiar = async (cambios) => {
    await guardarAjustes(cambios);
    vibrar(20);
  };

  /**
   * Los avisos en segundo plano no se pueden encender a secas: hacen falta
   * notificaciones concedidas. El permiso solo se puede pedir desde un toque,
   * y este lo es.
   */
  const cambiarAvisos = async (activo) => {
    if (!activo) {
      await cambiar({ avisos: false });
      return;
    }
    const permiso = await pedirPermisoAvisos();
    if (permiso !== "granted") {
      setMensaje({
        tipo: "error",
        texto:
          permiso === "unsupported"
            ? "Este navegador no puede mostrar avisos del sistema. Instala FORJA desde Chrome (⋮ → Instalar aplicación)."
            : "Android tiene bloqueadas las notificaciones de FORJA. Actívalas en Ajustes de Android → Aplicaciones → FORJA → Notificaciones.",
      });
      return;
    }
    await cambiar({ avisos: true });
  };

  const exportar = async () => {
    try {
      const { bytes, via } = await exportarJSON();
      if (via === "cancelado") {
        setMensaje({ tipo: "error", texto: "Copia cancelada: no se ha guardado en ningún sitio." });
        return;
      }
      // Solo cuenta como copia hecha si de verdad salió del móvil.
      await guardarAjustes({ ultimoBackup: new Date().toISOString() });
      setMensaje({
        tipo: "ok",
        texto:
          via === "compartir"
            ? `Copia compartida · ${formatearTamano(bytes)}. Guárdala en Drive o mándatela por correo.`
            : `Copia descargada · ${formatearTamano(bytes)}. Está en la carpeta Descargas.`,
      });
    } catch (e) {
      setMensaje({ tipo: "error", texto: `No se pudo exportar: ${e.message}` });
    }
  };

  const importar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const texto = await file.text();
      const resumen = await importarJSON(texto);
      const filas = Object.values(resumen).reduce((t, n) => t + n, 0);
      setMensaje({ tipo: "ok", texto: `Restauradas ${entero(filas)} filas. Todo en su sitio.` });
      senalGuardado();
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      e.target.value = "";
    }
  };

  // Semana que marcan las fechas del entrenador y semana elegida: pueden ir
  // separadas si aquí se ha elegido repetir, retroceder o adelantar.
  const desfase = ajustes.desfaseCarrera || 0;
  const semanaNatural = semanaCarreraPorFecha(hoyISO());
  const semanaPlan = Math.min(Math.max(semanaNatural + desfase, 1), SEMANAS_PLAN);
  // El día del 20K: el sábado de la última semana del plan (13-feb-2027 si
  // no se ha repetido ninguna semana).
  const diaDel20K = [...construirCalendario(ajustes.startDate, desfase).values()].find(
    (d) => d.carrera?.esCarreraObjetivo,
  )?.iso;

  return (
    <div className="f-pantalla">
      <Cabecera titulo="Ajustes" atras />

      <div className="f-scroll" style={{ gap: 16 }}>
        {mensaje && (
          <div
            className={`f-tarjeta ${mensaje.tipo === "error" ? "f-tarjeta--alerta" : "f-tarjeta--ok"}`}
            style={{ padding: "13px 15px" }}
          >
            <div style={{ font: "500 13px/1.5 var(--f-ui)" }}>{mensaje.texto}</div>
          </div>
        )}

        {/* ---- Plan ---- */}
        <Grupo titulo="PLAN">
          <FilaDato etiqueta="Fecha de inicio" valor={`${formatoCorto(ajustes.startDate)} · ${SEMANAS_PLAN} sem`} />
          <FilaEditable
            etiqueta="Cambiar inicio"
            tipo="date"
            valor={ajustes.startDate}
            onCambio={(v) => v && cambiar({ startDate: v })}
          />
          <FilaSelectorSemana
            valor={semanaPlan}
            onCambio={(elegida) => cambiar({ desfaseCarrera: elegida - semanaNatural })}
          />
          {desfase !== 0 && (
            <div style={{ padding: "0 15px 12px", font: "400 12px/1.5 var(--f-ui)", color: "var(--f-texto3)" }}>
              El plan de correr va {Math.abs(desfase)} semana{Math.abs(desfase) === 1 ? "" : "s"}{" "}
              {desfase < 0 ? "por detrás" : "por delante"} del calendario. El gimnasio no cambia.
            </div>
          )}
          <FilaDato etiqueta="Día del 20K" valor={diaDel20K ? formatoCorto(diaDel20K) : "—"} acento />
          <FilaDato etiqueta="Días de gimnasio" valor="L · X · V" />
          <FilaDato etiqueta="Rotación" valor="T-P-T-P continua" />
        </Grupo>

        {/* ---- Rutinas ---- */}
        <Grupo titulo="RUTINAS">
          {NOMBRES_SESION.map((n) => (
            <FilaDato key={n} etiqueta={n} valor={`${ejerciciosDe(n).length} ejercicios`} />
          ))}
          <FilaDato etiqueta="Rutina de postura" valor="7 + 2 extras" />
          <FilaDato etiqueta="Plan de carrera" valor="0 → 20K · 3 fases" />
        </Grupo>

        {/* ---- Nutrición ---- */}
        <Grupo titulo="NUTRICIÓN">
          <FilaDato
            etiqueta="Mantenimiento fijado"
            valor={ajustes.maintenanceKcal ? `${entero(ajustes.maintenanceKcal)} kcal` : "sin calcular"}
          />
          <FilaNumero
            etiqueta="Déficit diario"
            valor={ajustes.deficitKcal ?? 250}
            sufijo="kcal"
            paso={50}
            min={0}
            max={600}
            onCambio={(v) => cambiar({ deficitKcal: v })}
          />
          <FilaNumero
            etiqueta="Proteína objetivo"
            valor={ajustes.proteinTarget ?? 180}
            sufijo="g"
            paso={5}
            min={100}
            max={260}
            onCambio={(v) => cambiar({ proteinTarget: v })}
          />
        </Grupo>

        {/* ---- Apariencia y avisos ---- */}
        <Grupo titulo="APARIENCIA Y AVISOS">
          <div className="f-fila" style={{ justifyContent: "space-between" }}>
            <span style={{ font: "500 14.5px/1.2 var(--f-ui)" }}>Tema</span>
            <span style={{ display: "flex", gap: 4, background: "var(--f-sup2)", borderRadius: 9, padding: 3 }}>
              {[
                { id: "oscuro", etiqueta: "OSCURO" },
                { id: "claro", etiqueta: "CLARO" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => cambiar({ tema: t.id })}
                  style={{
                    padding: "10px 13px",
                    borderRadius: 7,
                    background: ajustes.tema === t.id ? "var(--f-acento)" : "transparent",
                    color: ajustes.tema === t.id ? "var(--f-acento-tinta)" : "var(--f-texto3)",
                    font: "700 12px/1 var(--f-mono)",
                  }}
                >
                  {t.etiqueta}
                </button>
              ))}
            </span>
          </div>

          <div className="f-fila" style={{ justifyContent: "space-between", gap: 12 }}>
            <span style={{ font: "500 14.5px/1.2 var(--f-ui)", flex: "none" }}>Color</span>
            <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {PALETAS.map((p) => {
                const activa = (ajustes.paleta || "cian") === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => cambiar({ paleta: p.id })}
                    aria-label={`Color ${p.nombre}`}
                    aria-pressed={activa}
                    style={{
                      // Muestra siempre la versión viva: es una muestra, no un control.
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: p.color,
                      border: activa ? "3px solid var(--f-texto)" : "3px solid transparent",
                      boxShadow: activa ? "none" : "inset 0 0 0 1px rgba(128,128,128,.35)",
                    }}
                  />
                );
              })}
            </span>
          </div>

          <FilaSwitch etiqueta="Vibración" activo={ajustes.vibracion} onCambio={(v) => cambiar({ vibracion: v })} />
          <FilaSwitch etiqueta="Pitidos en los temporizadores" activo={ajustes.sonido} onCambio={(v) => cambiar({ sonido: v })} />
          <FilaSwitch etiqueta="Avisar con la app en segundo plano" activo={ajustes.avisos} onCambio={cambiarAvisos} />
          <FilaSwitch etiqueta="Pantalla siempre encendida entrenando" activo={ajustes.wakeLock} onCambio={(v) => cambiar({ wakeLock: v })} />
        </Grupo>

        {/* ---- Datos ---- */}
        <div>
          <div className="f-etiqueta" style={{ marginBottom: 9 }}>DATOS</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="f-boton f-boton--fantasma f-boton--peq" style={{ flex: 1, minHeight: 56 }} onClick={exportar}>
              EXPORTAR JSON
            </button>
            <button
              className="f-boton f-boton--fantasma f-boton--peq"
              style={{ flex: 1, minHeight: 56 }}
              onClick={() => entradaFichero.current?.click()}
            >
              IMPORTAR
            </button>
          </div>
          <input ref={entradaFichero} type="file" accept="application/json,.json" onChange={importar} style={{ display: "none" }} />

          <div style={{ font: "400 11.5px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 9 }}>
            Tamaño actual: {formatearTamano(tamano)}
            {ajustes.ultimoBackup
              ? ` · última copia: ${formatoCorto(ajustes.ultimoBackup.slice(0, 10))}`
              : " · nunca has hecho copia"}
          </div>
          <div className="f-pretty" style={{ font: "400 12px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 8 }}>
            La copia incluye todo: sesiones, series, carreras, peso, postura y fotos. Importar reemplaza los datos
            actuales por los del fichero.
          </div>

          {/* Estado real del almacenamiento del móvil */}
          {almacen?.soportado && (
            <div
              className="f-tarjeta"
              style={{ padding: "12px 14px", marginTop: 12, borderColor: almacen.persistente ? "var(--f-borde)" : "var(--f-aviso)" }}
            >
              <div className="f-fila-sb">
                <span className="f-etiqueta">ALMACENAMIENTO</span>
                <span
                  style={{
                    font: "600 11px/1 var(--f-mono)",
                    color: almacen.persistente ? "var(--f-ok)" : "var(--f-aviso)",
                  }}
                >
                  {almacen.persistente ? "PROTEGIDO" : "SIN PROTEGER"}
                </span>
              </div>
              <div className="f-pretty" style={{ font: "400 12px/1.5 var(--f-ui)", color: "var(--f-texto3)", marginTop: 8 }}>
                {almacen.persistente
                  ? "Android no borrará estos datos aunque el móvil se quede sin espacio. Aun así, la copia en JSON es lo único que te salva si pierdes el teléfono."
                  : "Android podría borrar estos datos si el móvil se queda sin espacio. Se concede solo al instalar la app en la pantalla de inicio: hazlo y vuelve a abrir desde el icono."}
                {almacen.usado != null && ` · La app ocupa ${formatearTamano(almacen.usado)}.`}
              </div>
            </div>
          )}
        </div>

        {/* ---- Zona peligrosa ---- */}
        <div>
          <div className="f-etiqueta" style={{ marginBottom: 9, color: "var(--f-alerta)" }}>BORRAR</div>
          {confirmarBorrado ? (
            <div className="f-tarjeta f-tarjeta--alerta" style={{ padding: 15 }}>
              <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)" }}>
                Esto borra todas las sesiones, series, carreras, pesos y fotos. No se puede deshacer.
                Exporta una copia antes si no estás seguro.
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  className="f-boton f-boton--alerta f-boton--peq"
                  style={{ flex: 1 }}
                  onClick={async () => {
                    await borrarRegistros();
                    setConfirmarBorrado(false);
                    setMensaje({ tipo: "ok", texto: "Registros borrados. El plan y los ejercicios siguen ahí." });
                    navegar("/");
                  }}
                >
                  SÍ, BORRAR TODO
                </button>
                <button className="f-boton f-boton--fantasma f-boton--peq" style={{ flex: 1 }} onClick={() => setConfirmarBorrado(false)}>
                  CANCELAR
                </button>
              </div>
            </div>
          ) : (
            <button
              className="f-boton f-boton--fantasma f-boton--peq"
              style={{ borderColor: "var(--f-alerta)", color: "var(--f-alerta)" }}
              onClick={() => setConfirmarBorrado(true)}
            >
              BORRAR TODOS LOS REGISTROS
            </button>
          )}
        </div>

        <div style={{ font: "400 11px/1.5 var(--f-ui)", color: "var(--f-texto3)", textAlign: "center", paddingBottom: 8 }}>
          FORJA · funciona sin internet · todos los datos viven en este móvil
          <br />
          {/* Para saber qué versión corre el móvil cuando algo no se actualiza. */}
          versión {__VERSION_FORJA__} · {__FECHA_FORJA__}
        </div>
      </div>
    </div>
  );
}

/* ---------- Piezas reutilizables ---------- */

function Grupo({ titulo, children }) {
  return (
    <div>
      <div className="f-etiqueta" style={{ marginBottom: 9 }}>{titulo}</div>
      <div className="f-tarjeta">{children}</div>
    </div>
  );
}

/** Qué toca en cada semana del plan de carrera, para el selector. */
function textoSemanaPlan(s) {
  if (s <= 8) return `Sem ${s} · ${INTERVALOS_F1[s].texto}`;
  const larga = LARGAS[s];
  if (larga.carrera) return `Sem ${s} · la semana del 20K`;
  return `Sem ${s} · larga ${larga.km} km${larga.descarga ? " · descarga" : ""}`;
}

/**
 * Selector de la semana del plan de carrera, agrupado por fases. Elegir una
 * semana recoloca SOLO el plan de correr: si repites una semana o cambias de
 * fase, aquí se le dice a la app dónde estás de verdad.
 */
function FilaSelectorSemana({ valor, onCambio }) {
  return (
    <div className="f-fila" style={{ justifyContent: "space-between", padding: "13px 15px", gap: 12 }}>
      <span style={{ font: "500 14.5px/1.2 var(--f-ui)", flex: "none" }}>Semana de carrera</span>
      <select
        value={valor}
        onChange={(e) => onCambio(Number(e.target.value))}
        aria-label="Semana del plan de carrera"
        style={{
          background: "var(--f-sup2)",
          border: "1px solid var(--f-borde2)",
          borderRadius: 9,
          padding: "10px 11px",
          font: "600 13px/1 var(--f-mono)",
          color: "var(--f-acento)",
          minHeight: 44,
          maxWidth: "60%",
        }}
      >
        {FASES.map((f) => (
          <optgroup key={f.n} label={`${f.nombre} · SEMANAS ${f.desde}-${f.hasta}`}>
            {Array.from({ length: f.hasta - f.desde + 1 }, (_, i) => f.desde + i).map((s) => (
              <option key={s} value={s}>
                {textoSemanaPlan(s)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

function FilaDato({ etiqueta, valor, acento }) {
  return (
    <div className="f-fila" style={{ justifyContent: "space-between", padding: "13px 15px" }}>
      <span style={{ font: "500 14.5px/1.2 var(--f-ui)" }}>{etiqueta}</span>
      <span style={{ font: "600 13px/1 var(--f-mono)", color: acento ? "var(--f-acento)" : "var(--f-texto2)", flex: "none" }}>
        {valor}
      </span>
    </div>
  );
}

function FilaEditable({ etiqueta, valor, tipo, onCambio }) {
  return (
    <div className="f-fila" style={{ justifyContent: "space-between", padding: "13px 15px" }}>
      <span style={{ font: "500 14.5px/1.2 var(--f-ui)" }}>{etiqueta}</span>
      <input
        type={tipo}
        // `key` fuerza el remontaje cuando llega el valor real de IndexedDB:
        // con defaultValue a secas se quedaría clavado en el valor por defecto.
        key={valor}
        defaultValue={valor}
        onChange={(e) => onCambio(e.target.value)}
        style={{
          background: "var(--f-sup2)",
          border: "1px solid var(--f-borde2)",
          borderRadius: 9,
          padding: "10px 11px",
          font: "600 13px/1 var(--f-mono)",
          color: "var(--f-texto)",
          minHeight: 44,
        }}
      />
    </div>
  );
}

function FilaNumero({ etiqueta, valor, sufijo, paso, min, max, onCambio }) {
  return (
    <div className="f-fila" style={{ justifyContent: "space-between", padding: "11px 15px" }}>
      <span style={{ flex: 1, minWidth: 0, font: "500 14.5px/1.2 var(--f-ui)" }}>{etiqueta}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
        <button
          onClick={() => onCambio(Math.max(min, valor - paso))}
          aria-label={`Bajar ${etiqueta}`}
          style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid var(--f-borde2)", font: "700 20px/1 var(--f-display)" }}
        >
          −
        </button>
        <span style={{ font: "600 14px/1 var(--f-mono)", color: "var(--f-acento)", minWidth: 62, textAlign: "center" }}>
          {entero(valor)} {sufijo}
        </span>
        <button
          onClick={() => onCambio(Math.min(max, valor + paso))}
          aria-label={`Subir ${etiqueta}`}
          style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid var(--f-borde2)", font: "700 20px/1 var(--f-display)" }}
        >
          +
        </button>
      </span>
    </div>
  );
}

function FilaSwitch({ etiqueta, activo, onCambio }) {
  return (
    <button
      className="f-fila"
      style={{ justifyContent: "space-between", padding: "14px 15px", width: "100%", textAlign: "left", minHeight: 56 }}
      onClick={() => onCambio(!activo)}
      role="switch"
      aria-checked={!!activo}
    >
      <span style={{ flex: 1, minWidth: 0, font: "500 14.5px/1.2 var(--f-ui)" }}>{etiqueta}</span>
      <span className="f-switch" aria-checked={!!activo}>
        <span />
      </span>
    </button>
  );
}
