# FORJA — Contexto completo de la app para rediseño de UI/UX

**Fecha:** 21 de agosto de 2026
**Para:** diseñador/a de producto (UI/UX)
**De:** Jose (usuario único de la app)

Este documento describe TODO lo que hace la app hoy: su estructura visual,
sus pantallas, los datos que maneja y los planes que contiene. No hay nada
técnico: es el mapa funcional para poder reformularlo todo mejor integrado.
Al final está el **requisito de cambio más importante** (flexibilidad de
días de entrenamiento), que debe guiar el rediseño.

---

## 1. Qué es FORJA

App personal de entrenamiento de UN solo usuario (Jose, 41 años, 1,87 m,
~95-96 kg). Funciona en el móvil como una app instalada, sin cuentas ni
internet: **todos los datos viven en el teléfono**.

Cubre 4 áreas que siguen planes escritos por su entrenador:

1. **Gimnasio (hipertrofia)** — 3 días/semana, con especialización estética.
2. **Carrera (método CaCo)** — de cero a 20 km en ~30 semanas.
3. **Postura** — rutina diaria de 8-10 minutos.
4. **Peso y dieta** — peso diario en la app; la dieta se muestra como plan
   (las comidas se registran en otra app, Fitia).

Reparto de papeles importante para el diseño:

- Los **entrenos de carrera se hacen con el reloj Garmin** → en la app solo
  se marcan como hechos.
- Las **comidas se apuntan en Fitia** → la app solo enseña el objetivo
  (kcal y macros de la fase).
- El **gimnasio SÍ se registra entero en la app**, serie a serie.
- El **peso se apunta cada mañana en la app** (dos toques).

---

## 2. Estructura actual de navegación

Barra inferior con 6 pestañas:

| Pestaña | Contenido principal |
|---------|---------------------|
| HOY | Resumen del día: qué toca ahora |
| GYM | Entrenamiento de fuerza |
| CARRERA | Plan y registro de carrera |
| CUERPO | Peso diario + acceso a postura y dieta |
| DIETA | El plan de comida por fases |
| DIARIO | Adherencia y mapa de calor del plan |

Pantallas secundarias (se llega desde las anteriores):

- **Entreno en vivo** (desde Gym): guía la sesión serie a serie.
- **Resumen de sesión** (al acabar un entreno).
- **Progresión** (desde Gym): veredictos por ejercicio y volumen por músculo.
- **Postura** (desde Cuerpo): rutina diaria, test de la pared, fotos.
- **Rutina postural en vivo** (con temporizadores).
- **Ajustes**: fecha de inicio, semana de carrera, tema/color, avisos,
  copias de seguridad, borrado.
- **Revisión**: genera un informe de texto para pegárselo a una IA/entrenador.

### Problemas de estructura detectados (por qué "es lioso")

- **La información está repetida en varios sitios**: la sesión de hoy sale
  en HOY y en GYM; la carrera de hoy sale en HOY y en CARRERA; el peso sale
  en HOY y en CUERPO; la dieta sale en CUERPO (resumen) y en DIETA.
- **Postura está escondida** dentro de CUERPO, pero es una tarea diaria de
  primer nivel.
- **HOY mezcla** hero del entreno + postura + peso + aviso de copia +
  mañana, todo en tarjetas distintas con jerarquías parecidas.
- **Demasiadas tarjetas con avisos de texto largo** (protocolos, rampas,
  reglas del entrenador) incrustadas entre datos.
- El calendario/planificación está **anclado a fechas y días de la semana**
  (ver requisito final: esto debe cambiar a "días recomendados").

---

## 3. Pantalla a pantalla (estado actual)

### 3.1 HOY

- Cabecera: fecha, saludo, **semana del plan** (ej. "2/30") y acceso a Ajustes.
- Barra de progreso de las 3 fases del plan de carrera.
- **Tarjeta héroe** (lo principal del día): o la sesión de gym que toca
  (nombre, nº ejercicios, duración estimada, aviso del entrenador, botón
  EMPEZAR SESIÓN), o la carrera que toca (botón MARCAR COMO HECHA), o
  descanso/vacaciones.
- Tarjetas pequeñas: **Postura** (hecha/pendiente + botón), **Peso de hoy**
  (valor + tendencia + botón apuntar/corregir).
- Aviso de copia de seguridad si hace tiempo que no se exporta.
- "Mañana toca…" (vistazo al día siguiente).
- Botón grande fijo: APUNTAR PESO.
- El primer día de uso la pantalla es distinta: 3 tareas de calibración
  (peso, foto de perfil, test de la pared).

### 3.2 GYM

- Tarjeta principal: **hoy toca X** (o "próxima · día — sesión"), con nº de
  ejercicios y duración estimada, botón EMPEZAR SESIÓN.
- "La rotación": las 4 sesiones (Torso A, Pierna A, Torso B, Pierna B), cada
  una abre su detalle y se puede empezar cualquiera manualmente.
- Últimas sesiones registradas (fecha, duración, comparación).
- Acceso a **Progresión**.

**Entreno en vivo**: pantalla a pantalla completa, sin barra de navegación.
Guía la sesión paso a paso: ejercicio, serie X de Y, dosis objetivo
(ej. 3×8-12), peso y reps a anotar, botones para el **RIR** (0-1 / 2 / 3+),
técnica del ejercicio, indicación de última serie si la hay, y
**temporizador de descanso automático** (2-3 min grandes, 90-120 s
aislados) con aviso sonoro/vibración. Los ejercicios ⭐ (prioritarios) avisan
si se saltan.

**Resumen de sesión**: totales, comparación con la anterior, veredicto.

**Progresión**: por ejercicio, veredicto de doble progresión ("sube peso",
"llena el rango", "estancado…") usando el historial y el RIR; y **volumen
semanal por músculo** contra los objetivos del plan (con las decisiones
del entrenador explicadas, ej. pecho bajo a propósito).

### 3.3 CARRERA

- Tarjeta principal: sesión de hoy o próxima (ej. "6×(1½′ corre + 2′
  camina)"), total de minutos, botón **MARCAR COMO HECHA**. En sesiones de
  intervalos NO se piden km ni ritmo (mezclan correr/caminar); en carreras
  continuas sí (km + minutos → ritmo).
- **Veredictos**: ritmo (¿mejora al mismo esfuerzo?), volumen semanal (¿subes
  demasiado rápido?), base aeróbica.
- Gráfico de **km por semana**.
- **Últimas carreras** (lista con fecha, km si los hay, ritmo o "HECHA").
- **Rejilla del plan de 30 semanas**: cada semana es una casilla con color
  (hecha completa / parcial / vacía / descarga / actual). Tocar una semana
  abre sus sesiones y permite hacer HOY cualquiera de ellas (con aviso si es
  de más adelante).

### 3.4 CUERPO

- **Peso de hoy en grande** (o el último), tendencia kg/semana.
- Gráfica del peso diario (últimos 30) + media de 7 días.
- **Tabla día a día**: cada pesaje con su diferencia respecto al anterior;
  tocar una fila permite corregirla.
- Tarjeta resumen de **DIETA** (fase actual) que lleva a la pestaña Dieta.
- Tarjeta de **POSTURA** (hecho hoy X/6, racha) que lleva a su pantalla.
- Botones fijos: APUNTAR PESO · RUTINA (postura).

El diálogo de apuntar peso: número grande con − / + de 100 en 100 g,
precargado con el último peso. Solo peso, nada más.

### 3.5 DIETA

- **Fase actual**: kcal/día en grande, 3 macros (proteína/grasa/carbos),
  nota del entrenador.
- **Protocolo del día visual** (tarjeta temporal, desaparece al pasar la fecha).
- **Las comidas del día**: tabla exacta por comida con horario
  (desayuno 09:00 → pesas 12:00 → comida post-entreno → merienda → cena)
  y gramos de P/H/G por comida + total. Cambia sola según la fase.
- **El plan semana a semana**: las 4 fases con fechas, kcal y macros.
- **Kcal día a día del mini-cut** (lista temporal con notas de días señalados).
- **Cintura y fotos**: fechas de medición.
- **Reglas fijas** (creatina 5 g, agua/sal normales, media de 7 días, alimentos
  de cabecera).

### 3.6 DIARIO

- **Adherencia** de la semana y total (checks hechos / planificados).
- **Mapa de calor** semanal (filas = semanas, columnas = L-D), con ventana
  alrededor de la semana actual y opción de ver todas.
- **Detalle del día elegido**: 3 checks automáticos (Gimnasio, Carrera,
  Postura) que salen de los registros reales; se pueden corregir a mano;
  nota libre del día.

### 3.7 POSTURA

- Rutina diaria (6 ejercicios ahora, 5 cuando pase la semana 4): cada uno con
  dosis y nota técnica; pantalla "en vivo" con temporizadores por ejercicio.
- 2 estiramientos extra los días de gym (pectoral en puerta; flexor de cadera
  opcional).
- **Racha** de días completos.
- **Test de la pared** (día 0 y cada 6 semanas) con 3 resultados posibles y
  su consejo.
- **Fotos de perfil** comparables (los lunes; comparativa lado a lado).

### 3.8 AJUSTES

- Fecha de inicio del plan; **"Semana de carrera"** (recolocar el plan si se
  repite una semana: mueve TODO el plan de correr, nunca el gym).
- Día de los 20 km (calculado), días de gym, rotación.
- Lista de rutinas (solo informativo).
- Tema claro/oscuro, color de acento, vibración, sonidos, avisos.
- **Exportar/importar copia de seguridad** (fichero con todos los datos).
- Borrar registros.

---

## 4. Los planes que contiene (datos de referencia)

### 4.1 Gimnasio — especialización de silueta

Objetivo estético (12 semanas): **1) deltoide lateral · 2) dorsal/espalda
en V · 3) hombro posterior/espalda alta · 4) resto proporcionado** (pecho en
mantenimiento). Todo en máquina/polea. Secuencia fija e infinita:

**TORSO A → PIERNA A → TORSO B → PIERNA B → repetir** (3 días/semana).

- **Torso A** (21 series): Jalón al pecho 3×8-12 · ⭐Elevación lateral
  4×12-20 · Press inclinado 3×8-12 · Remo pecho apoyado 3×8-12 · Press
  hombro 2×8-12 · ⭐Reverse pec deck 2×12-20 · Curl bíceps 2×10-15 ·
  Tríceps polea 2×10-15.
- **Pierna A**: Hack squat 3×8-12 · Prensa 2×10-15 · Curl femoral 3×10-15 ·
  Extensión cuádriceps 2×10-15 · Hip thrust 2×8-12 · Gemelos 3×10-20 ·
  ⭐Sóleo 3×12-15 · ⭐Tibial 2×15-20 (protección para correr) ·
  ⭐Elevación lateral 3×12-20 · ⭐Pullover 2×10-15 · Core: dead bug 2×8/lado
  + plancha lateral 2×20-30 s/lado.
- **Torso B** (21): Press plano 3×8-12 · ⭐Laterales 4×12-20 · Jalón neutro
  3×8-12 · High row 3×8-12 · Pec deck 2×10-15 · ⭐Reverse pec deck 2×12-20 ·
  Curl 2×10-15 · Tríceps sobre cabeza 2×10-15.
- **Pierna B**: Hip thrust 3×8-12 · Prensa 3×8-12 · Curl femoral 3×10-15 ·
  Extensión cuádriceps 2×10-15 · Extensión 45° 2×10-15 · Gemelos 3×10-20 ·
  ⭐Sóleo · ⭐Tibial · ⭐Laterales 3×12-20 · ⭐Pullover 2×10-15 · Core:
  pallof 2×10/lado + plancha lateral.

Reglas: grandes RIR 1-2 y descanso 2-3 min; aislados RIR 1-2 con última
serie RIR 0-1 y descanso 90-120 s; **doble progresión** (llenar el rango de
reps → subir 2,5 kg); sin superseries, sin fallo sistemático.

Situación temporal (agosto-septiembre 2026): rampa de vuelta de vacaciones —
del 26-ago al 1-sep se hace el 75-80 % de las series a RIR 3; del 2 al 8-sep
casi todo a RIR 2; desde el 9, el 100 %.

### 4.2 Carrera — 0 → 20 km en ~30 semanas

Sin fecha de carrera ni cronómetro; todo fácil ("poder hablar", 3-4/10).
Días recomendados: **martes + jueves + domingo**. Hitos: 30 min seguidos
(S10) · 60 min (S17) · 10 km (S21) · **20 km (S30)**.

- **F1 (S1-S10)**: intervalos correr/caminar — 6×1′ → 6×1½′ → 6×2′ → 5×3′ →
  4×5′ → 3×7′ → 3×8′ → 2×12′ → 2×15′ → 25′/25′/30′ seguidos.
- **F2 (S11-S18)**, por minutos: cortas 30-40′ y larga del domingo
  35→40→45→35↓→50→55→60→45↓.
- **F3 (S19-S30)**, por km: cortas 5-8 km y larga 8→9→10→8↓→11→12,5→14→10↓
  →16→18→12↓→**20 km**.

Reglas: nunca dos días seguidos corriendo; una semana que pesa SE REPITE
(existe un control para recolocar el plan); el dolor manda; sin
series/HIIT/tempo. Registro: intervalos = solo "hecha" (+notas); continuas =
km y minutos (la app calcula ritmo y veredictos).

### 4.3 Dieta — 4 fases (se registra en Fitia; la app es la chuleta)

| Fase | Fechas | kcal | P/H/G |
|------|--------|------|-------|
| Mini-cut fuerte | 26 ago-1 sep | ~1 700 | 195/105/55 |
| Mini-cut moderado | 2-8 sep | ~1 850 | 195/130/60 |
| Mantenimiento (comprobar) | 9-15 sep | ~2 400 | 185/258/70 |
| Volumen limpio | desde 16 sep | ~2 500-2 550 | 185/283-295/70 |

Por comida (horario fijo 09:00/13:00/17:30/21:00), con tabla exacta por fase
(ej. mini-cut: desayuno 45/40/15 · comida post 55/45/10 · merienda 40/10/10 ·
cena 55/10/20). Hidratos concentrados en desayuno y post-entreno. Reglas:
creatina 5 g siempre, agua y sal normales, nada de deshidratar; el progreso
se juzga con **media de peso de 7 días + cintura + fotos** (fechas: 26 y
29-ago, 4, 8 y 15-sep). Días visuales (29-ago y 4-sep) con protocolo propio
(pump ligero, hidratos antes, sin cambiar kcal). En volumen: ganar solo
100-200 g/semana, con algoritmo de ajuste de ±100 kcal.

### 4.4 Postura

Diaria (8-10 min): basculación pélvica (solo 4 primeras semanas) · extensión
torácica en foam roller 1×8 · chin tuck 2×8 (5 s) · wall slide 2×8-10 ·
cobra baja 2×20-30 s · colocación de pie 3×20 s ("rodillas suaves →
costillas sobre pelvis → cuello largo"). Extras 3 días/sem: pectoral en
puerta 30 s/lado (+ flexor de cadera opcional). Mini-reset 3-5 veces/día.
Test de la pared cada 6 semanas. Foto de perfil comparable cada lunes.

---

## 5. Datos que guarda la app (lo que el rediseño debe conservar)

- **Sesiones de gym**: fecha, sesión, duración; y cada serie con ejercicio,
  peso, repeticiones y RIR.
- **Carreras**: fecha, tipo (intervalos/corta/larga), km (si aplica),
  minutos, notas, semana del plan.
- **Peso**: un valor por día.
- **Postura**: por día, qué ejercicios se completaron; resultados del test
  de la pared; fotos de perfil.
- **Diario**: correcciones manuales de los checks y nota libre por día.
- **Ajustes**: fecha de inicio, desfase de semana de carrera, tema, color,
  avisos, fecha de última copia.

Todo exportable/importable en un solo fichero (copia de seguridad manual).

---

## 6. REQUISITO CENTRAL DEL REDISEÑO — Flexibilidad de días

**Este es el cambio más importante que debe incorporar la nueva versión.**
Hoy la app asigna entrenos a fechas concretas y eso descuadra todo cuando
un día no se puede entrenar. Debe pasar a funcionar así:

1. **Los días del calendario son RECOMENDACIONES, no obligaciones.** El
   usuario decide cuándo entrena; la app responde "según tu historial, esto
   es lo que te toca ahora".
2. **Fuerza: la fuente de verdad es el ÚLTIMO ENTRENAMIENTO COMPLETADO**,
   nunca el día de la semana. La secuencia Torso A → Pierna A → Torso B →
   Pierna B se preserva siempre: si lo último completado fue Torso A, lo
   siguiente es Pierna A, se haga el día que se haga.
3. **Nada se salta solo**: si pasa la fecha recomendada, la sesión queda
   PENDIENTE hasta que el usuario la haga o la omita explícitamente. Nunca
   marcar "fallado" automáticamente.
4. Acciones necesarias en cada sesión: **ENTRENAR HOY** (carga el siguiente
   pendiente de la secuencia) · **MOVER** (elegir otro día; el resto se
   reajusta visualmente) · **NO PUEDO HOY** (mantener pendiente — por
   defecto —, mover a mañana, elegir fecha, u omitir manualmente).
5. **Dos días de gym seguidos se permiten** (con aviso de recuperación,
   sin bloquear).
6. **Running, misma filosofía pero con matiz**: la sesión que toca sale de
   la progresión real completada (si tenía pendiente una sesión CaCo y la
   hace dos días más tarde, hace ESA); pero **una carrera perdida NO se
   recupera**: se puede mover, omitir o dejar pasar, sin amontonar carreras
   ni forzar días seguidos.
7. **Conflictos: hipertrofia > running.** Si mover el gym pisa una carrera,
   se sugiere mantener el gym y mover/omitir el running (3 gym + 2 carreras
   una semana está bien).
8. **Historial**: guardar entrenamiento, fecha real, fecha recomendada
   original y estado (PENDIENTE / PROGRAMADO / COMPLETADO / COMPLETADO
   PARCIALMENTE / OMITIDO MANUALMENTE).
9. **Pantalla principal deseada**: dos bloques claros —
   "PRÓXIMO ENTRENAMIENTO DE FUERZA: [sesión]" (Entrenar hoy · Programar ·
   Ver rutina) y "PRÓXIMA CARRERA: [sesión CaCo]" (Correr hoy · Programar ·
   Ver sesión). El calendario ideal se puede seguir enseñando, etiquetado
   como "plan recomendado".

**Todo lo demás (nutrición, kcal, macros, fases, postura, ejercicios,
series, repeticiones, RIR, progresiones, estadísticas) se mantiene tal cual.**

---

## 7. Otras oportunidades de mejora para el rediseño (opinión)

- Unificar los duplicados: una sola fuente visual para "qué toca hoy".
- Dar a la postura un sitio de primer nivel (hoy está enterrada en Cuerpo).
- Separar mejor "plan/consulta" (dieta, planes, reglas) de "acción/registro"
  (entrenar, correr, pesarse): son dos modos de uso distintos.
- Las notas largas del entrenador podrían vivir plegadas ("ver más") para no
  competir con los datos.
- Revisar la pestaña Diario: la adherencia es útil, pero el mapa de calor de
  30+ semanas ocupa mucho y se consulta poco.
- Estados temporales (protocolo del día visual, rampa de vuelta, mini-cut)
  funcionan bien como tarjetas que aparecen/desaparecen solas por fecha:
  mantener ese patrón, pero con una jerarquía visual consistente.
