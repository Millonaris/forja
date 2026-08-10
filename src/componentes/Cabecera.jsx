/*
 * FORJA · Cabecera de pantalla.
 * Título grande a la izquierda, dato o acción de contexto a la derecha.
 */

import { useNavigate } from "react-router-dom";

export default function Cabecera({ titulo, derecha, atras = false, sub = null }) {
  const navegar = useNavigate();

  return (
    <header
      style={{
        flex: "none",
        padding: "10px 18px 6px",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
        {atras && (
          <button
            onClick={() => navegar(-1)}
            aria-label="Volver"
            style={{
              font: "700 22px/1 var(--f-ui)",
              color: "var(--f-texto3)",
              // Área táctil de 48 px aunque el glifo sea pequeño.
              padding: "12px 14px 12px 0",
              margin: "-12px 0 -12px -2px",
            }}
          >
            ‹
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 className="f-titulo" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {titulo}
          </h1>
          {sub && <div className="f-etiqueta" style={{ marginTop: 6 }}>{sub}</div>}
        </div>
      </div>
      {derecha && <div style={{ flex: "none" }}>{derecha}</div>}
    </header>
  );
}
