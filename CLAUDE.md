# FORJA — contexto para Claude

## Qué es esto

App personal de entrenamiento de Jose (un solo usuario): gimnasio, plan de carrera
0→20K en 26 semanas, postura y peso diario. La dieta se REGISTRA en Fitia, fuera
de la app; aquí solo se enseña el plan por fases (tarjeta DIETA en Cuerpo, datos
en planDieta.js, plan completo en docs/plan-dieta.md): mini-cut 26-ago→8-sep,
mantenimiento ~2 400 kcal, volumen limpio desde el 16-sep. PWA instalable, 100 % local: sin
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
  **planCarrera.js** (el plan 0→20K con sus fechas reales), base de datos.
- `src/logica/` — motores puros sin interfaz: **calendario.js** (qué toca cada
  día: gym por rotación desde la fecha de inicio + carrera por las fechas del
  plan + postura), diario, veredictos, volumen.
- `src/pantallas/` — una por pestaña: Hoy, Gym, Carrera, Cuerpo, Diario,
  más Ajustes, EntrenoVivo…
- `docs/plan-carrera.md` — el plan de carrera del entrenador, palabra por
  palabra. Es la fuente de verdad del plan; el código lo implementa.

## El plan de entrenamiento (resumen operativo)

- **Documento maestro: docs/supercontexto-2026-08.md** (versión DEFINITIVA del
  21-ago: todo el contexto de entrenamiento, nutrición y postura).
- **Gym (ver docs/plan-gym-postura.md):** bloque de especialización de 12
  semanas — deltoide lateral + dorsal + espalda alta; pecho en mantenimiento.
  Todo en máquina/polea, sin superseries; grandes RIR 1-2 y descanso 2-3 min,
  aislados con última serie RIR 0-1 y descanso 90-120 s. Sóleo y tibial se
  quedan en los días de pierna (protección de la carrera) y el core va al
  final de esos días. Vuelta de vacaciones el MIÉRCOLES 26-ago (el 25 es el
  regreso); es UNA sola rutina con rampa: del 26-ago al 1-sep el motor de
  sesión baja las series (`seriesLight` + `enRampaSuave`, RIR 3), del 2 al
  8-sep volumen completo a RIR 2 y desde el 9 el 100 %. Rutina postural de
  5 ejercicios + 2 estiramientos extra (L-X-V).
- Carrera con fechas reales: empieza el vie 14-ago-2026, 20K el sáb
  13-feb-2027. Todo suave (RPE 3-4/10, «corro pero no sufro»).
- Fase 1 (S1-S8): CaCo. La S1 fueron 2 sesiones (vie 14 y lun 17 ago); desde
  la S2, TRES por semana: martes, jueves y sábado. Fases 2-3 (S9-S26):
  cortas martes y jueves + larga el sábado. Entre fases, transición sin
  carreras (4-12 oct). Descargas S12, S16, S20 y S24; larga máxima 18 km
  (S25); la S26 solo tiene un rodaje suave el martes y el 20K.
- **Los entrenos los hace con su reloj Garmin** (llevan los mismos nombres:
  `S3 - 5x 3c 2a`): la app NO tiene temporizador de carrera, solo se marcan
  las sesiones como hechas (DialogoCarrera precargado con lo del plan).
- El usuario puede recolocar el plan («Semana de carrera» en Ajustes →
  `desfaseCarrera`: repetir una semana desplaza TODO el plan de correr 7 días,
  nunca el gym) y hacer un día cualquiera la sesión de otra semana tocando la
  rejilla de la pantalla Carrera.

## Comandos

- `npm run dev` — servidor de desarrollo.
- `npm run publicar` — compila y sube a la rama `gh-pages`; así llega la
  versión nueva al móvil de Jose. **Solo publicar cuando Jose lo pida.**
- `npm run iconos` — regenera los iconos de la PWA.
