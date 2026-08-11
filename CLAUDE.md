# FORJA — contexto para Claude

## Qué es esto

App personal de entrenamiento de Jose (un solo usuario): gimnasio, plan de carrera
0→20K en 26 semanas, postura y nutrición. PWA instalable, 100 % local: sin
servidor, sin cuentas; todos los datos viven en el móvil (IndexedDB con Dexie).
React + Vite. Se publica en GitHub Pages: https://millonaris.github.io/forja/

## Sobre Jose (importante)

**Jose no programa.** Decide tú por él las cuestiones técnicas y explícale las
cosas en lenguaje de usuario, sin jerga: qué verá en pantalla y qué cambia para
él, no qué funciones tocaste. Responde siempre en español.

## Convenciones del código

- Todo en español: nombres de ficheros, variables, funciones y comentarios.
- Los comentarios explican el PORQUÉ de las decisiones, no el qué.
- Sin tests automáticos. Verificar con `npx oxlint src`, `npx vite build`
  y probando la app en el navegador (`npm run dev`, la app usa rutas con
  almohadilla: `/#/carrera`, `/#/ajustes`…).
- La base de datos se siembra en cada arranque de forma idempotente
  ([semilla.js](src/datos/semilla.js)): ejercicios nuevos aparecen solos, y los
  ajustes nuevos toman su valor por defecto sin pisar los existentes.
  **No cambiar ids de ejercicios ya existentes**: los registros del móvil de
  Jose apuntan a esos ids.

## Mapa del código

- `src/datos/` — catálogos y semilla: ejercicios del gym, músculos,
  **planCarrera.js** (el plan 0→20K), base de datos.
- `src/logica/` — motores puros sin interfaz: **calendario.js** (qué toca cada
  día: gym + carrera + postura; aquí vive la regla viernes-pierna → larga el
  domingo, y el desfase de semanas), diario, veredictos, volumen.
- `src/pantallas/` — una por pestaña: Hoy, Gym, Carrera, Cuerpo, Diario,
  más Ajustes, TimerIntervalos, EntrenoVivo…
- `docs/plan-carrera.md` — el plan de carrera del entrenador, palabra por
  palabra. Es la fuente de verdad del plan; el código lo implementa.

## El plan de carrera (resumen operativo)

- 26 semanas, 3 fases. Todo se corre suave («poder hablar frases enteras»).
- Fase 1 (sem 1-8): intervalos corre/camina, martes y sábado. La semana 8
  tiene dos sesiones distintas (claves `8m` y `8s` en `INTERVALOS_F1`).
- Fases 2-3: cortas martes y jueves + tirada larga. Regla crítica: viernes
  torso → larga el sábado; viernes pierna → larga el **domingo**. Larga máxima
  16 km; semanas 25-26 son taper; el 20K es el domingo de la semana 26.
- El usuario puede recolocar el plan («Semana de carrera» en Ajustes →
  `desfaseCarrera` en ajustes, solo mueve la carrera, nunca el gym) y cambiar
  la sesión de intervalos de un día concreto (botones MÁS SUAVE / MÁS DURA en
  el temporizador).

## Comandos

- `npm run dev` — servidor de desarrollo.
- `npm run publicar` — compila y sube a la rama `gh-pages`; así llega la
  versión nueva al móvil de Jose. **Solo publicar cuando Jose lo pida.**
- `npm run iconos` — regenera los iconos de la PWA.
