/*
 * FORJA · Apuntar peso y kcal.
 *
 * Es la acción más frecuente del día, así que se abre precargada con el último
 * peso conocido: en el caso normal (has variado 100 g) son dos toques y fuera.
 * Los ± mueven de 100 en 100 g para no tener que sacar el teclado casi nunca.
 */

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../datos/db.js";
import { entero, peso as fmtPeso } from "../logica/formato.js";
import { formatoDia } from "../logica/fechas.js";
import { senalGuardado } from "../utiles/senales.js";

export default function DialogoPeso({ fecha, onCerrar }) {
  // `undefined` significa "todavía consultando IndexedDB". Como Dexie devuelve
  // undefined también cuando el registro no existe, se normaliza a null: si no,
  // el primer día (que por definición no tiene registro) el diálogo se quedaba
  // esperando para siempre y no llegaba a pintarse nunca.
  const registro = useLiveQuery(async () => (await db.bodyLog.get(fecha)) ?? null, [fecha], undefined);

  // Último peso conocido antes de hoy: es el valor con el que se abre el campo.
  const ultimoPeso = useLiveQuery(
    async () => {
      const previos = await db.bodyLog.where("date").below(fecha).sortBy("date");
      const conPeso = previos.filter((r) => r.kg != null);
      return conPeso[conPeso.length - 1]?.kg ?? null;
    },
    [fecha],
    undefined,
  );

  const [kg, setKg] = useState(null);
  const [kcal, setKcal] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Se inicializa una sola vez, cuando ya sabemos qué había en la base.
  useEffect(() => {
    if (registro === undefined || ultimoPeso === undefined) return;
    setKg(registro?.kg ?? ultimoPeso ?? 90);
    setKcal(registro?.kcal != null ? String(registro.kcal) : "");
  }, [registro, ultimoPeso]);

  const ajustar = (delta) => setKg((v) => Math.round(((v ?? 90) + delta) * 10) / 10);

  const guardar = async () => {
    setGuardando(true);
    const kcalNum = kcal.trim() === "" ? null : Number(kcal.replace(",", "."));
    await db.bodyLog.put({
      date: fecha,
      kg: kg ?? null,
      kcal: Number.isFinite(kcalNum) ? Math.round(kcalNum) : null,
    });
    senalGuardado();
    onCerrar();
  };

  if (kg === null) return null;

  return (
    <div
      role="dialog"
      aria-label="Apuntar peso y calorías"
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
          gap: 16,
        }}
      >
        <div className="f-fila-sb">
          <div>
            <div className="f-etiqueta">PESO DE HOY</div>
            <div style={{ font: "400 12px/1.3 var(--f-ui)", color: "var(--f-texto3)", marginTop: 5 }}>
              {formatoDia(fecha)}
            </div>
          </div>
          <button onClick={onCerrar} style={{ font: "500 12px/1 var(--f-mono)", color: "var(--f-texto3)", padding: 10, margin: -10 }}>
            CERRAR
          </button>
        </div>

        {/* Peso con ± de 100 g: el teclado casi nunca hace falta. */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="f-boton f-boton--fantasma"
            style={{ width: 72, minWidth: 72, height: 72, flex: "none", fontSize: 28 }}
            onClick={() => ajustar(-0.1)}
            aria-label="Bajar 100 gramos"
          >
            −
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div className="f-cifra" style={{ fontSize: 62 }}>
              {fmtPeso(kg)}
              <span style={{ fontSize: 20, color: "var(--f-texto2)" }}> kg</span>
            </div>
          </div>
          <button
            className="f-boton f-boton--fantasma"
            style={{ width: 72, minWidth: 72, height: 72, flex: "none", fontSize: 28 }}
            onClick={() => ajustar(0.1)}
            aria-label="Subir 100 gramos"
          >
            +
          </button>
        </div>

        <div>
          <div className="f-etiqueta" style={{ marginBottom: 8 }}>CALORÍAS DEL DÍA</div>
          <input
            className="f-campo"
            type="number"
            inputMode="numeric"
            placeholder="2 350"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
          />
          {registro?.kcal != null && (
            <div style={{ font: "400 12px/1.3 var(--f-ui)", color: "var(--f-texto3)", marginTop: 8 }}>
              Ya tenías {entero(registro.kcal)} kcal apuntadas hoy.
            </div>
          )}
        </div>

        <button className="f-boton" onClick={guardar} disabled={guardando}>
          GUARDAR
        </button>
      </div>
    </div>
  );
}
