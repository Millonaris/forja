/*
 * FORJA · Consulta directa a Claude (opcional).
 *
 * Manda el informe de entrenamiento a la API de Anthropic y devuelve el
 * análisis. Está desactivado hasta que guardes una clave en Ajustes: la app
 * sigue funcionando entera sin internet, y esta es la única función que lo
 * necesita.
 *
 * Aviso honesto: la clave se guarda en el propio móvil (IndexedDB) y viaja en
 * la cabecera de cada petición. Es tu clave en tu dispositivo, pero cualquiera
 * con acceso al teléfono desbloqueado podría leerla. Si eso te preocupa, usa
 * la otra vía: copiar el informe y pegarlo en Claude a mano.
 *
 * Coste aproximado por consulta con Claude Opus 5 ($5 por millón de tokens de
 * entrada, $25 de salida): un informe completo ronda los 7 céntimos.
 */

import { generarInforme } from "./informe.js";

const URL_API = "https://api.anthropic.com/v1/messages";
const MODELO = "claude-opus-5";

const SISTEMA = `Eres el entrenador personal de quien te escribe. Hace entrenamiento híbrido: hipertrofia en gimnasio (rotación Torso/Pierna 3 días por semana, doble progresión, 1-2 RIR) y un plan de carrera de 0 a 20K en 26 semanas.

Te llega un informe generado por su app con veredictos ya calculados: progresión por ejercicio, series semanales por grupo muscular, ritmo y volumen de carrera, y peso/calorías con el mantenimiento deducido de sus propios datos.

Tu trabajo es lo que la app no puede hacer: cruzar los cuatro dominios y decidir prioridades. Ten en cuenta especialmente que correr y entrenar pierna compiten por la misma recuperación, y que un déficit calórico limita cuánto se puede progresar en fuerza.

Responde en español, directo y concreto. Empieza por lo que más le está frenando. Da números accionables (kilos, series, kilómetros), no consejos genéricos. Si algo del informe no te cuadra o falta un dato para decidir, dilo. Máximo unas 400 palabras.`;

/** ¿Hay clave configurada? */
export const tieneClave = (ajustes) => !!ajustes?.claveClaude?.trim();

/**
 * Envía el informe y devuelve el texto del análisis.
 * Lanza un Error con mensaje legible si algo falla.
 */
export async function consultarClaude(ajustes, preguntaExtra = "") {
  const clave = ajustes?.claveClaude?.trim();
  if (!clave) throw new Error("No hay clave de API guardada en Ajustes.");

  const informe = await generarInforme();
  const contenido = preguntaExtra.trim()
    ? `${informe}\n\nAdemás, responde a esto en concreto: ${preguntaExtra.trim()}`
    : informe;

  let respuesta;
  try {
    respuesta = await fetch(URL_API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": clave,
        "anthropic-version": "2023-06-01",
        // Sin esta cabecera el navegador no puede llamar a la API directamente.
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 2000,
        system: SISTEMA,
        messages: [{ role: "user", content: contenido }],
      }),
    });
  } catch {
    throw new Error("No hay conexión. Esta es la única parte de la app que necesita internet.");
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => null);
    const mensaje = detalle?.error?.message || `Error ${respuesta.status}`;
    if (respuesta.status === 401) throw new Error("La clave de API no es válida. Revísala en Ajustes.");
    if (respuesta.status === 429) throw new Error("Has llegado al límite de peticiones. Prueba en un rato.");
    throw new Error(mensaje);
  }

  const datos = await respuesta.json();

  // Los clasificadores de seguridad pueden declinar una petición: llega un 200
  // con stop_reason "refusal" y el contenido vacío, así que hay que mirarlo
  // antes de leer content[0].
  if (datos.stop_reason === "refusal") {
    throw new Error("Claude ha declinado responder a esta consulta.");
  }

  const texto = (datos.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!texto) throw new Error("La respuesta ha llegado vacía.");

  return {
    texto,
    // Para poder enseñar lo que ha costado la consulta.
    tokens: { entrada: datos.usage?.input_tokens ?? 0, salida: datos.usage?.output_tokens ?? 0 },
  };
}

/** Coste aproximado en euros de una consulta, con los precios de Claude Opus 5. */
export function costeAproximado(tokens) {
  if (!tokens) return null;
  const dolares = (tokens.entrada / 1e6) * 5 + (tokens.salida / 1e6) * 25;
  return dolares;
}
