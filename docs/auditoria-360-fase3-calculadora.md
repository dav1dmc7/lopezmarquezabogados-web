# Auditoría 360º — Fase 3: calculadora de indemnización

## Producto añadido

Se incorpora una calculadora orientativa en `/laboral/indemnizacion-despido` para convertir una duda de alta intención en una herramienta útil y una ruta clara hacia revisión profesional.

## Qué calcula

- Despido objetivo: 20 días de salario por año y máximo de 12 mensualidades en el escenario modelado.
- Despido improcedente: 33 días de salario por año y máximo de 24 mensualidades en el escenario modelado.
- Contratos formalizados antes del 12 de febrero de 2012: cálculo transitorio 45/33 para improcedencia y límites correspondientes al régimen transitorio.
- Prorrateo por meses de los periodos inferiores a un año.

## Qué no calcula

La herramienta no decide la procedencia o improcedencia del despido, no calcula automáticamente el salario regulador de todos los supuestos, no incluye finiquito, salarios pendientes, vacaciones, preaviso u otros conceptos y no sustituye una revisión profesional.

## Base normativa

Estatuto de los Trabajadores, Real Decreto Legislativo 2/2015, especialmente artículos 53 y 56 y disposición transitoria undécima:

https://www.boe.es/eli/es/rdlg/2015/10/23/2/con

La guía legal y jurisprudencial de la herramienta del CGPJ explica también el cómputo por meses y el tratamiento del periodo transitorio.

## Analítica preparada

- `calculator_complete`
- `calculator_error`
- `calculator_contact`


## ZIP correction v2
- Fixed duplicate localized-path key in `src/lib/site.ts`.
- Fixed relative imports in the nested English resource pages.
- Removed a stray full stop from the English arraigo resource title.
