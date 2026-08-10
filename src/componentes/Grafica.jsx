/*
 * FORJA · Gráficas.
 *
 * Chart.js con los tokens del sistema y sin adornos: sin rejilla, sin leyenda,
 * sin eje Y. La gráfica es la prueba, no la conclusión — la conclusión va
 * escrita debajo en una frase. Por eso aquí sobra todo lo decorativo.
 *
 * Se registran solo los controladores que se usan para no cargar Chart.js entero.
 */

import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useEffect, useRef } from "react";

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
);

/** Lee un token de color del CSS para que la gráfica siga el tema activo. */
const token = (nombre) => getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();

/**
 * @param tipo       "bar" | "line"
 * @param etiquetas  eje X
 * @param valores    serie principal
 * @param destacar   número de valores finales que van en color de acento
 * @param formato    función para el texto del tooltip
 */
export default function Grafica({ tipo = "bar", etiquetas, valores, destacar = 0, alto = 110, formato }) {
  const lienzo = useRef(null);
  const grafica = useRef(null);

  useEffect(() => {
    if (!lienzo.current) return undefined;

    const acento = token("--f-acento");
    const barra = token("--f-barra");
    const texto3 = token("--f-texto3");
    const sup = token("--f-sup");

    const colores = valores.map((_, i) => (i >= valores.length - destacar ? acento : barra));

    grafica.current = new Chart(lienzo.current, {
      type: tipo,
      data: {
        labels: etiquetas,
        datasets: [
          {
            data: valores,
            backgroundColor: tipo === "bar" ? colores : "transparent",
            borderColor: acento,
            borderWidth: tipo === "line" ? 2 : 0,
            borderRadius: tipo === "bar" ? 3 : 0,
            pointRadius: 0,
            pointHitRadius: 18,
            tension: 0.25,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // 60 fps en el móvil: sin animación de entrada en cada re-render.
        animation: { duration: 220 },
        layout: { padding: 0 },
        scales: {
          x: { display: false, grid: { display: false } },
          y: {
            display: false,
            grid: { display: false },
            // Arranca justo por debajo del mínimo: si no, las diferencias reales
            // de 2 kg se ven como una línea plana.
            beginAtZero: tipo === "bar" && Math.min(...valores) >= 0 && Math.max(...valores) < 50,
            grace: "8%",
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: sup,
            borderColor: token("--f-borde"),
            borderWidth: 1,
            titleColor: texto3,
            bodyColor: token("--f-texto"),
            titleFont: { family: "JetBrains Mono", size: 10 },
            bodyFont: { family: "JetBrains Mono", size: 13, weight: "600" },
            displayColors: false,
            padding: 10,
            callbacks: {
              label: (ctx) => (formato ? formato(ctx.parsed.y) : String(ctx.parsed.y)),
            },
          },
        },
      },
    });

    return () => {
      grafica.current?.destroy();
      grafica.current = null;
    };
  }, [tipo, etiquetas, valores, destacar, formato]);

  return (
    <div style={{ height: alto, position: "relative" }}>
      <canvas ref={lienzo} role="img" aria-label="Gráfica de evolución" />
    </div>
  );
}
