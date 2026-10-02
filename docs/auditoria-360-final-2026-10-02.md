# Auditoría 360º final — López Márquez Abogados

**Fecha:** 2 de octubre de 2026  
**Proyecto auditado:** `lopezmarquezabogados-web` (ZIP aportado por el usuario)  
**Framework:** Astro 7.3.5 / salida estática  
**Estado del trabajo:** mejoras aplicadas en el árbol de trabajo; auditorías propias y comprobaciones estáticas en verde.

## 0. Resumen ejecutivo

La base técnica era buena antes de la auditoría: 41 páginas, `astro check` limpio, build estático y QA propio sin errores. El mayor margen no estaba en “arreglar código roto”, sino en convertir la arquitectura en un producto jurídico realmente orientado a intención de búsqueda y captación, especialmente para usuarios internacionales.

Tras la intervención, el proyecto pasa a **58 rutas Astro registradas, 50 rutas indexables y 8 rutas/noindex/sistema fuera del índice**, con una arquitectura inglesa mucho más completa. Las auditorías propias devuelven 0 errores, y las comprobaciones `node --check` de JS/MJS y `git diff --check` también pasan.

**Limitación crítica:** el `node_modules` incluido en el ZIP estaba incompleto/incompatible para ejecutar el binario nativo de Rolldown en este contenedor y la reinstalación no pudo completarse offline. Por ello, no se afirma aquí un `astro check/build` posterior como verificado en este entorno. El último `npm run verify` del Mac del usuario, previo al ZIP, sí estaba completamente limpio. La verificación final tras copiar estos cambios debe ejecutarse en el Mac.

## 1. Cambios de mayor impacto aplicados

- **Internacionalización real:** footer, navegación, logo, menú móvil, CTA, schema, descripciones, switch de idioma y enlaces ES/EN localizados.
- **Arquitectura English-first para captación:** nuevas landings de Employment y Business; nuevas rutas para salary claims, workplace accidents y regularisation; About, FAQs, Resources y Legal Updates en inglés.
- **Search intent:** títulos y contenidos ingleses formulados alrededor de búsquedas transaccionales reales (immigration lawyer, employment lawyer, dismissal, severance, residency, Spanish nationality, family reunification).
- **SEO internacional:** `hreflang` recíproco sólo cuando existe una equivalencia real; `x-default` a la home; sitemap actualizado; rutas antiguas redirigidas permanentemente.
- **SEO local:** señales coherentes de Barcelona + Spain y datos estructurados con `areaServed`, dirección, teléfono, email y contacto bilingüe.
- **Captación:** triage de inmigración y autodiagnóstico empresarial disponibles en español e inglés; tracking de inicio de formulario y enlaces/CTAs; CTA flotante corregido.
- **Calculadora laboral:** corregidos los topes legales de 12/24/42 mensualidades y localización ES/EN.
- **Migración:** redirects legacy convertidos a 301; `/laboral/asesoramiento-empresas` consolidada hacia `/empresas/asesoramiento-laboral`.
- **QA propio:** nueva auditoría de internacionalización integrada en `npm run audit`.

## 2. Primera impresión / test de 5 segundos

### Usuario normal
Debe poder entender: “Es un despacho en Barcelona que puede ayudarme en asuntos laborales, inmigración y empresas, y puedo contactar rápidamente”. La home ya se ha acercado a esto mediante el mensaje de siguiente paso y la distribución por áreas.

### Usuario de Google
La arquitectura tiene ahora más puntos de entrada de intención concreta: despido, indemnización, salarios, accidentes, residencia, nacionalidad, reagrupación, arraigo/regularisation y páginas equivalentes en inglés.

### Usuario internacional
La home inglesa y los hubs ingleses se han planteado como páginas de servicio, no como traducciones literales. “Barcelona / Spain”, área jurídica, problema y contacto aparecen antes de exigir una lectura larga.

### Lo que todavía hay que observar en producción
El verdadero test de 5 segundos debe hacerse con una captura/URL productiva en móvil y escritorio, porque la percepción visual no se puede certificar sólo leyendo Astro.

## 3. UX / usabilidad

### Confirmado y corregido
- Navegación EN ya no devuelve por error al home ES desde el logo.
- Footer EN ya no muestra las áreas y enlaces legales en español.
- El switch de idioma conserva siempre una salida útil y `hreflang` sólo se genera con pares reales.
- El CTA flotante ya no se presenta como email cuando abre WhatsApp.
- Los breadcrumbs ingleses de employment y páginas secundarias ya tienen padres semánticos coherentes.
- Se añaden eventos de navegación/CTA/formulario sin enviar PII.

### Recomendación
Hacer una prueba manual en iOS Safari/Android Chrome antes de publicar, especialmente menú, checkbox de privacidad, textarea, teléfono, WhatsApp, floating CTA y calculadora.

## 4. UX móvil

Se aplicaron pequeñas defensas de UX móvil: inputs de formulario a `font-size: 16px` para evitar zoom automático de iOS, safe-area en el CTA flotante, enlaces largos con `overflow-wrap` y `touch-action: manipulation`. La navegación ya tenía foco visible y objetivos táctiles razonables.

Pendiente de medición real: overflow visual en dispositivos concretos, teclado, sticky/floating overlap y Core Web Vitals móviles.

## 5. UI / diseño

La arquitectura visual existente es suficientemente sólida para el lanzamiento; el mayor riesgo no es “falta de decoración”, sino que la densidad de contenido jurídico haga perder jerarquía. El criterio aplicado ha sido no añadir tarjetas o adornos cuando no ayudan a la decisión.

La siguiente mejora visual con mayor retorno debería ser una revisión de la home y de las dos landings inglesas principales con capturas de escritorio/móvil, una vez desplegada una preview. No se ha fingido una auditoría visual de píxeles sin render del navegador.

## 6. Copywriting

### Principios aplicados
- Menos fórmulas institucionales y más “qué problema resolvemos / qué ocurre después”.
- CTA contextual por intención en lugar de repetir “Más información”.
- Inglés natural, comercial y jurídico sin calcos sintácticos del español.
- Barcelona + Spain cuando es útil para intención de búsqueda, no repetición artificial.
- Se evitan afirmaciones no verificadas sobre resultados, número de clientes, premios, reseñas o rapidez de respuesta.

### Copy que debe mantenerse bajo control
Toda promesa comercial de consulta gratuita, plazo de respuesta, modalidad, disponibilidad, idioma, presupuesto o canal debe reflejar la operativa real del despacho. El código no debe “optimizar” una promesa que el negocio no puede cumplir.

## 7. CRO / funnel

El funnel prioritario queda diseñado como:

**Google / referral → landing específica → prueba de encaje → reducción de riesgo → CTA → contacto → siguiente paso.**

En inglés, el objetivo es especialmente rápido: “am I in the right place?” → “do you handle my matter?” → “are you in Barcelona / Spain?” → “can I contact you now?”.

Las herramientas de triage y autodiagnóstico se utilizan como micro-conversiones y como ayuda a clasificar intención antes de pedir una conversación.

## 8. Psicología y persuasión

Presentes: autoridad profesional basada en información del despacho, especificidad, reducción de riesgo, claridad del siguiente paso y progresive disclosure. No se han introducido escasez/urgencia artificial ni testimonios inventados.

Oportunidad futura: si el despacho dispone de reseñas verificables, perfiles colegiales, casos publicables o credenciales concretas, integrarlos donde el usuario está evaluando si contactar.

## 9. SEO técnico e internacional

- 50 rutas declaradas como indexables tras la ampliación; 58 rutas Astro registradas en total.
- Sitemap regenerado con las rutas indexables reales.
- `hreflang` recíproco y `x-default` para la home.
- URLs legacy con 301.
- Se ha evitado mapear URLs duplicadas como si fueran equivalentes independientes.
- Legal notice/privacy/cookies EN quedan `noindex` hasta validar los datos legales definitivos del despacho.
- Schema localizado y área servida Barcelona + Spain.

Referencias externas usadas: Google Search Central — localized versions / hreflang; Organization; LocalBusiness; SEO Starter Guide. BOE — Estatuto de los Trabajadores, arts. 53, 56 y disposición transitoria undécima.

## 10. Search intent aplicado

La arquitectura inglesa queda orientada, entre otras, a intenciones como:
- immigration lawyer Barcelona / Spain
- residence lawyer Spain
- Spanish nationality lawyer
- family reunification Spain
- regularisation / arraigo Spain
- employment lawyer Barcelona / Spain
- dismissal lawyer Barcelona
- severance lawyer Spain
- unpaid salary lawyer Barcelona
- workplace accident lawyer Spain
- employment advice for companies Barcelona

No se afirma volumen de búsqueda concreto: no hay Search Console/Keyword Planner del proyecto en el ZIP.

## 11. SEO local Barcelona + España

La web comunica Barcelona como base física y Spain como ámbito de servicio. En schema se ha añadido `areaServed` para ciudad + país y contacto bilingüe. El contenido evita crear páginas locales artificiales por barrio.

Pendiente externo: verificar y optimizar Google Business Profile, categorías, reseñas, URL, NAP y perfiles profesionales reales. Sin acceso a ese panel no se puede afirmar su estado.

## 12. Formularios y herramientas de captación

### Formulario
- Autocomplete añadido en contacto ES.
- Checkbox de privacidad con nombre semántico.
- Tracking de `form_start` y razones de error.
- No se envían contenidos del mensaje al analytics.

### Immigration triage
- ES/EN.
- Resultados enlazados a páginas correctas del idioma.
- Email de seguimiento localizado.

### Company self-assessment
- ES/EN.
- Resultados y CTA localizados.

### Calculadora de indemnización
- ES/EN.
- Topes corregidos a 12/24/42 mensualidades.
- Conserva enlaces BOE/CGPJ.
- Presentada como estimación orientativa, no como dictamen.

## 13. Performance

Astro está generando HTML estático, por lo que la arquitectura es favorable. No se han medido LCP, INP, CLS, TTFB, peso de red ni caché en producción. Para cerrar esta parte se necesita una URL pública/preview y/o Lighthouse/PageSpeed/WebPageTest.

## 14. Accesibilidad WCAG 2.2

El código conserva focus-visible, labels y landmarks existentes; se han localizado aria-labels de la navegación y CTA. Las auditorías propias pasan. Quedan pendientes de test manual: teclado completo, lector de pantalla, contraste real de todos los estados, zoom 200%, 400% y comportamiento de formularios con errores.

## 15. Confianza

La arquitectura cuenta con dirección, teléfono, email, mapa y contacto. La gran oportunidad es añadir sólo credenciales que sean demostrables: colegiación, perfiles profesionales, idiomas, experiencia concreta, reseñas verificadas y/o metodología de trabajo.

## 16. Enlaces y navegación

Una comprobación estática sobre los href internos presentes en fuentes no detecta referencias internas rotas. La matriz de idioma final es simétrica (46 entradas / 23 pares). Los enlaces antiguos relevantes quedan redirigidos con 301.

## 17. Seguridad básica

No se realizaron ataques. Se revisó exposición visible de scripts/configuración, enlaces externos, formularios y ausencia de PII en analytics. Headers HTTP de producción, CSP efectiva, cookies reales y configuración TLS requieren URL desplegada para verificación.

## 18. Analytics / tracking

Eventos priorizados: `primary_cta_click`, `secondary_cta_click`, `email_click`, `whatsapp_click`, `phone_click`, `form_start`, `form_submit`, `form_error`, `tool_start`, `tool_result`, `tool_cta_click`. Deben configurarse como conversiones donde corresponda en la plataforma real de analítica.

No se envía el texto libre del usuario ni PII al tracking.

## 19. Benchmark de competencia

El benchmark externo muestra un patrón recurrente en despachos que compiten por búsquedas internacionales/locales: especialidad + Barcelona/Spain + población atendida + idiomas + explicación del proceso + CTA visible + reducción de riesgo. La mejora aplicada adopta ese patrón conceptual sin copiar claims ni textos de terceros.

## 20. Auditoría página por página

| Página | Objetivo | Problema/oportunidad | Recomendación |
|---|---|---|---|
| `/` | Captación principal | Aclarar propuesta de valor y vías Laboral/Extranjería/Empresas | Home ya orientada a siguiente paso; seguir reforzando prueba y contacto rápido |
| `/404` | Recuperación | Recuperar navegación tras URL incorrecta | Links claros a Home, áreas y contacto |
| `/actualidad-juridica` | Actualidad/autoridad | Mostrar actualización jurídica verificable | Enlazar fuente oficial y fecha; evitar contenido efímero sin contexto |
| `/administrativo` | Captación por área | Presentar alcance sin crear páginas thin | Mantener contenido útil y derivación a contacto |
| `/civil` | Captación por área | Presentar alcance sin crear páginas thin | Mantener contenido útil y derivación a contacto |
| `/contacto` | Conversión | Convertir intención en consulta | Mantener formulario corto, email/phone/WhatsApp y expectativas post-contacto |
| `/empresas` | Hub empresas | Captación B2B laboral | Diferenciar preventive advice vs retainer y CTA B2B |
| `/en` | Captación internacional | Responder immigration/employment lawyer Barcelona/Spain y facilitar contacto | Mantener copy nativo EN; reforzar idioma, ubicación, siguiente paso y casos |
| `/en/about` | Confianza | Responder “¿quién me atenderá?” | Aportar credenciales verificables, ubicación e idiomas sin claims no demostrados |
| `/en/business` | Hub business EN | Captación de empresas extranjeras/internacionales | Explicar scope, modalidad y CTA directo |
| `/en/business/employment-advice` | Captación B2B | Servicio laboral empresarial | Diferenciar prevención, soporte continuado y alcance |
| `/en/business/retainer` | Captación B2B | Servicio laboral empresarial | Diferenciar prevención, soporte continuado y alcance |
| `/en/contact` | Conversión | Convertir intención en consulta | Mantener formulario corto, email/phone/WhatsApp y expectativas post-contacto |
| `/en/cookies` | Cumplimiento | Información legal | Noindex hasta validar datos legales y tratamientos reales |
| `/en/employment` | Hub employment EN | Capturar intención employment lawyer Barcelona/Spain | Usar como puerta de entrada rápida a dismissal, severance, salary claims y accidents |
| `/en/employment-dismissal` | Captación laboral urgente | Resolver primera duda y derivar a abogado | CTA contextual, checklist/documentos, plazos y next step |
| `/en/employment-salary-claims` | Captación laboral | Reclamación de cantidades | Explicar documentación, plazos y representación sin prometer resultados |
| `/en/employment-severance` | Captación laboral transaccional | Calcular/revisar indemnización | Calculadora corregida; aclarar que es estimación y CTA a revisión |
| `/en/faqs` | Objeciones/SEO | Resolver dudas previas al contacto | Enfocar FAQ por intención y casos; revisar que cada afirmación coincida con práctica real |
| `/en/immigration` | Hub immigration EN | Capturar immigration lawyer Barcelona/Spain | Triage + contacto arriba; explicar casos y preparación |
| `/en/immigration/family-reunification` | Captación inmigración | Resolver reagrupación familiar | Explicar supuestos y documentación |
| `/en/immigration/regularisation` | Captación inmigración | Resolver arraigo/regularisation | Distinguir requisitos actuales y fecha de actualización |
| `/en/immigration/residency` | Captación inmigración | Resolver vías de residencia | Intent mapping, documentos y CTA |
| `/en/immigration/spanish-nationality` | Captación inmigración | Resolver nacionalidad española por residencia | Aclarar plazos según nacionalidad/origen y CTA |
| `/en/legal-notice` | Cumplimiento | Información legal | Noindex hasta validar datos legales y tratamientos reales |
| `/en/legal-updates` | Actualidad/autoridad | Mostrar actualización jurídica verificable | Enlazar fuente oficial y fecha; evitar contenido efímero sin contexto |
| `/en/privacy` | Cumplimiento | Información legal | Noindex hasta validar datos legales y tratamientos reales |
| `/en/resources` | Autoridad temática | Captar búsquedas informativas de alta intención | Enlazar cada guía a servicio y CTA; actualizar fechas sensibles |
| `/en/resources/arraigo-two-years-spain` | Captación inmigración | Resolver arraigo/regularisation | Distinguir requisitos actuales y fecha de actualización |
| `/en/resources/dismissal-deadline-spain` | Captación laboral urgente | Resolver primera duda y derivar a abogado | CTA contextual, checklist/documentos, plazos y next step |
| `/en/resources/first-hours-after-dismissal` | Captación laboral urgente | Resolver primera duda y derivar a abogado | CTA contextual, checklist/documentos, plazos y next step |
| `/en/resources/spanish-nationality-residence-period` | Captación inmigración | Resolver nacionalidad española por residencia | Aclarar plazos según nacionalidad/origen y CTA |
| `/en/workplace-accidents` | Captación laboral | Asistencia tras accidente laboral | Priorizar urgencia, conservación de pruebas y contacto |
| `/extranjeria` | Hub inmigración | Capturar immigration/extranjería y distribuir casos | Priorizar residencia, nationality, family reunification y regularisation |
| `/laboral` | Hub laboral SEO/comercial | Derivar a problemas laborales concretos | Ampliar cluster con salario, accidentes, despidos y empresa; evitar canibalización |
| `/otras-areas` | Captación por área | Presentar alcance sin crear páginas thin | Mantener contenido útil y derivación a contacto |
| `/penal` | Captación por área | Presentar alcance sin crear páginas thin | Mantener contenido útil y derivación a contacto |
| `/preguntas-frecuentes` | Objeciones/SEO | Resolver dudas previas al contacto | Enfocar FAQ por intención y casos; revisar que cada afirmación coincida con práctica real |
| `/recursos` | Autoridad temática | Captar búsquedas informativas de alta intención | Enlazar cada guía a servicio y CTA; actualizar fechas sensibles |
| `/sobre-nosotros` | Confianza | Responder “¿quién me atenderá?” | Aportar credenciales verificables, ubicación e idiomas sin claims no demostrados |

## 21. Matriz de prioridades

| Prioridad | Problema/oportunidad | Impacto | Esfuerzo | Solución aplicada/prevista |
|---|---|---:|---:|---|
| P0 | Errores de compilación / rutas rotas | Muy alto | — | 0 errores en auditorías; check/build final en Mac pendiente por entorno del ZIP. |
| P1 | Arquitectura EN insuficiente para intención comercial | Muy alto | Medio | Employment, Business, salary claims, accidents, regularisation y recursos EN añadidos. |
| P1 | Footer/nav EN mezclados con ES | Alto | Bajo | Layout internacionalizado. |
| P1 | Pares de idioma incompletos | Alto | Medio | 46 entradas / 23 pares + QA automático. |
| P1 | Redirects legacy no explícitamente 301 | Alto | Bajo | `public/_redirects` actualizado. |
| P1 | Canibalización laboral de empresas | Alto | Bajo | URL primaria en Empresas + 301 desde URL antigua. |
| P1 | Calculadora laboral con topes incoherentes | Alto | Medio | Topes 12/24/42 mensualidades corregidos. |
| P1 | CTA flotante con etiqueta incorrecta | Medio/alto | Bajo | Ahora identifica WhatsApp correctamente. |
| P2 | Herramientas de captación sólo en ES | Alto | Medio | Triage y autodiagnóstico EN añadidos. |
| P2 | Tracking de funnel insuficiente | Medio/alto | Bajo | form_start, form_error y href/contexto en CTAs. |
| P2 | Prueba social/certificaciones no estructuradas | Medio | Variable | Añadir sólo evidencia real verificable. |
| P2 | CWV/headers/TLS no medibles sin producción | Medio | Medio | Cerrar con Lighthouse/PageSpeed y headers reales. |
| P3 | Pulido visual de alto nivel | Medio | Medio | Revisión renderizada en preview. |

## 22. Quick wins aplicados

- Corregir CTA flotante WhatsApp.
- Localizar footer/nav/logo EN.
- Activar hreflang recíproco real.
- Actualizar sitemap.
- Convertir migraciones a 301.
- Añadir English Employment hub.
- Añadir English Business hub.
- Localizar triage inmigración.
- Localizar autodiagnóstico empresas.
- Localizar calculadora.
- Corregir topes legales de la calculadora.
- Añadir tracking de inicio/error de formulario.
- Añadir safe-area y 16px en inputs móviles.
- Eliminar asimetrías del language map con auditoría automática.
- Crear recursos EN de alta intención.

## 23. Grandes oportunidades

1. **Content cluster internacional de Immigration + Employment**: convertir las páginas EN en entradas transaccionales conectadas a guías y contacto.
2. **Google Business Profile + reputación verificable**: la web puede ser excelente y aún así perder tráfico/conversión local si la ficha y las reseñas están débiles.
3. **Sistema de captación por problema**: crear variantes de CTA y formularios según despido urgente, inmigración y B2B.
4. **Search Console-driven content expansion**: después del lanzamiento, crear/expandir páginas sólo donde aparezcan impresiones reales sin cubrir o con CTR bajo.
5. **CRO basado en eventos**: medir qué CTA, herramienta y página generan contactos reales y ajustar con datos, no con intuición.

## 24. 🚨 RED FLAGS

- Un claim jurídico/comercial no comprobado puede perjudicar más que un problema visual.
- No publicar reseñas, premios o credenciales “de decoración” si no son demostrables.
- No convertir cada barrio de Barcelona en una landing SEO casi idéntica.
- No dejar páginas EN como traducciones de estructura ES si la intención internacional es distinta.
- No mantener dos URLs que compiten por el mismo servicio empresarial.
- No depender sólo del formulario: teléfono/WhatsApp/email deben tener sentido para usuarios con urgencia.
- No pedir documentación sensible en exceso durante la primera conversión.
- No llamar “Email” a una acción que abre WhatsApp.

## 25. Lo que un creador habituado a la web puede no ver

El usuario no sabe la arquitectura del proyecto, no conoce la marca y no distingue entre “área jurídica” y “problema”. Busca una salida concreta. La estructura inglesa se ha rehecho precisamente para reducir esa traducción mental.

## 26. Test de usuario simulado

### Google — inmigración
- **Ve:** Landing de immigration/residency/nationality
- **Duda:** ¿Lleváis mi caso y estáis en Barcelona?
- **Puede abandonar:** Si no encuentra CTA/contacto o requisitos básicos arriba
- **Le convence:** Ubicación + caso concreto + pasos + contacto bilingüe
### Google — despido
- **Ve:** Dismissal / severance / first steps
- **Duda:** ¿Tengo plazo y qué debo hacer hoy?
- **Puede abandonar:** Si la página no prioriza urgencia y siguiente paso
- **Le convence:** Checklist + plazos + revisión del caso
### International referral
- **Ve:** Home EN → Employment/Immigration
- **Duda:** ¿Puedo comunicarme en inglés?
- **Puede abandonar:** Si el footer/nav siguen en español o el CTA no es claro
- **Le convence:** Inglés nativo + Barcelona/Spain + contacto visible
### Company decision maker
- **Ve:** Business EN → employment advice/retainer
- **Duda:** ¿Es para mi empresa y cómo funciona el soporte?
- **Puede abandonar:** Si sólo se listan servicios sin proceso
- **Le convence:** Scope + support model + CTA B2B
### Sceptical comparer
- **Ve:** About + service + contact
- **Duda:** ¿Qué prueba que sois el despacho adecuado?
- **Puede abandonar:** Si sólo hay adjetivos genéricos
- **Le convence:** Credenciales verificables + proceso + datos reales

## 27. Reconstrucción ideal

### Landing transaccional
**H1 claro → ubicación/idioma → CTA → casos que resolvemos → cómo ayudamos → qué preparar → proceso → confianza verificable → FAQ → CTA final.**

### Recurso
**Pregunta concreta → respuesta breve → detalle → fecha/fuente → cuándo necesitas ayuda profesional → servicio relacionado → CTA.**

## 28. Rediseño conceptual

La dirección no es “más premium visualmente”; es **más específica y más rápida**: menos lenguaje corporativo, más claridad sobre problema, jurisdicción, siguiente paso y evidencia. En inglés, especialmente, la página debe poder funcionar aunque el usuario no visite ninguna otra.

## 29. Puntuaciones de auditoría

Son **puntuaciones heurísticas de revisión de código/arquitectura**, no métricas de usuarios ni Lighthouse.

| Área | Puntuación | Motivo resumido |
|---|---:|---|
| UX | **88** | Arquitectura clara y CTAs contextuales; falta test presencial de usuarios. |
| UI | **84** | Base consistente; falta revisión visual renderizada exhaustiva. |
| Mobile | **86** | Defensas móviles y navegación correctas; falta prueba en dispositivos reales. |
| Copy | **88** | Mayor especificidad e intención; aún depende de credenciales/claims reales. |
| CRO | **87** | Funnel y herramientas reforzadas; faltan datos de conversiones. |
| SEO | **91** | Arquitectura, sitemap, hreflang e intención muy reforzados; falta evidencia de Search Console. |
| Performance | **86** | Astro estático es favorable; CWV reales no medidos. |
| Accesibilidad | **87** | Buenas bases y QA; falta lector de pantalla/contraste completo. |
| Confianza | **81** | Datos de contacto y ubicación; oportunidad clara en prueba social/credenciales verificables. |
| Branding | **84** | Identidad consistente; la diferenciación debe apoyarse en evidencia real. |
| Arquitectura | **94** | Clusters ES/EN y migración mucho más coherentes. |
| Calidad técnica | **92** | Auditorías propias en verde; check/build final pendiente en entorno Mac. |
| Conversión potencial | **89** | Rutas y herramientas fuertes; falta validación con tráfico real. |

Media simple orientativa: **87,9/100**.

## 30. Conclusión ejecutiva

### LAS 10 COSAS QUE CAMBIARÍA PRIMERO
1. Mantener la arquitectura EN por intención: Immigration / Employment / Business y páginas de problema.
2. Medir conversiones reales desde Search Console/analytics después del lanzamiento.
3. Verificar Google Business Profile y reputación local.
4. Añadir credenciales/proof verificable del despacho.
5. Crear contenido EN sólo donde exista intención comercial/informativa útil.
6. Revisar cada CTA y formulario por tipo de caso.
7. Hacer Lighthouse/PageSpeed en preview y corregir CWV reales.
8. Probar accesibilidad manual con teclado + lector de pantalla.
9. Revisar cada afirmación jurídica sensible con fecha/fuente antes de publicar.
10. Vigilar canibalización y páginas thin con Search Console tras la indexación.

### SI SOLO PUDIERA CAMBIAR 3 COSAS
**1. Intención + arquitectura EN.** Es la diferencia entre traducir la web y construir una puerta de entrada real para clientes internacionales.  
**2. Sistema de captación medible.** Sin datos de CTA/formulario/WhatsApp/teléfono no sabremos qué páginas generan negocio.  
**3. Confianza demostrable.** En servicios jurídicos, ubicación y diseño ayudan; la evidencia verificable es la capa que reduce la duda final.

## Diagnóstico final

**Principal fortaleza:** arquitectura técnica estática y ahora mucho más orientada a intención.  
**Principal debilidad:** todavía faltan datos reales de reputación, Search Console, conversiones y rendimiento de producción para cerrar el ciclo de optimización.  
**Mayor oportunidad:** convertir la presencia internacional en un verdadero funnel de Immigration/Employment in Barcelona/Spain.  
**Mayor riesgo:** publicar claims o información jurídica/operativa que no coincidan exactamente con la práctica actual del despacho.  
**Cambio de mayor impacto probable:** combinar páginas inglesas de intención concreta con contacto rápido y medición de conversiones.

## Comprobaciones realizadas en el árbol de trabajo

- `git diff --check` → **PASSED**
- `npm run audit` → **PASSED**, 58 páginas, 67 fuentes, 0 errores en todas las auditorías propias.
- `node --check` en JS/MJS → **PASSED**
- `package.json` JSON → **PASSED**
- Comprobación estática de href internos → **0 referencias rotas detectadas**
- Simetría `localizedPathMap` → **46 entradas / 23 pares, 0 asimetrías**

## Verificación final en el Mac

Después de copiar este árbol a `~/Desktop/lopezmarquezabogados-web`, ejecutar:

```bash
cd ~/Desktop/lopezmarquezabogados-web
git diff --check
rm -rf node_modules
npm ci
npm run verify
```

El resultado esperado es el mismo conjunto de QA propio (0 errores) más `astro check` y `astro build` en el entorno real del Mac.

## Fuentes de referencia

- Google Search Central — Localized versions / hreflang: https://developers.google.com/search/docs/specialty/international/localized-versions
- Google Search Central — Organization structured data: https://developers.google.com/search/docs/appearance/structured-data/organization
- Google Search Central — LocalBusiness structured data: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Google Search Central — SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- BOE — Estatuto de los Trabajadores, arts. 53 y 56 + disposición transitoria undécima: https://www.boe.es/eli/es/rdlg/2015/10/23/2/con



## ZIP correction v2
- Fixed duplicate localized-path key in `src/lib/site.ts`.
- Fixed relative imports in the nested English resource pages.
- Removed a stray full stop from the English arraigo resource title.
