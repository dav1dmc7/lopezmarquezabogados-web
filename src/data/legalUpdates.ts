export interface LegalUpdate {
  date: string;
  effectiveDate?: string;
  category: 'Laboral' | 'Extranjería' | 'Empresa';
  title: string;
  summary: string;
  impact: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const legalUpdates: LegalUpdate[] = [
  {
    date: '15/09/2026',
    effectiveDate: '05/10/2026',
    category: 'Laboral',
    title: 'Nuevas reglas sobre información y transparencia de las condiciones de trabajo',
    summary: 'El Real Decreto 723/2026 desarrolla para España parte de la Directiva (UE) 2019/1152 y regula la información que debe recibir la persona trabajadora sobre los elementos esenciales del contrato y determinadas condiciones de ejecución.',
    impact: 'Interesa especialmente a empresas que revisen contratos, documentación laboral y procesos de incorporación o modificación de condiciones.',
    sourceLabel: 'BOE-A-2026-19200 · Real Decreto 723/2026',
    sourceUrl: 'https://www.boe.es/eli/es/rd/2026/09/09/723/con'
  },
  {
    date: '15/04/2026',
    effectiveDate: '16/04/2026',
    category: 'Extranjería',
    title: 'Modificaciones relevantes del Reglamento de Extranjería',
    summary: 'El Real Decreto 316/2026 modifica el Reglamento de Extranjería e introduce, entre otras novedades, cambios en determinadas autorizaciones y disposiciones específicas vinculadas a arraigo y familiares de personas de nacionalidad española.',
    impact: 'Puede ser relevante para expedientes de residencia y arraigo que deban analizarse con el texto vigente y la situación concreta de la persona solicitante.',
    sourceLabel: 'BOE-A-2026-8284 · Real Decreto 316/2026',
    sourceUrl: 'https://www.boe.es/eli/es/rd/2026/04/14/316'
  },
  {
    date: '02/09/2026',
    category: 'Extranjería',
    title: 'Catálogo de Ocupaciones de Difícil Cobertura · tercer trimestre de 2026',
    summary: 'El SEPE publicó en el BOE el catálogo correspondiente al tercer trimestre de 2026. La inclusión de una ocupación permite tramitar la autorización inicial de residencia temporal y trabajo por cuenta ajena en los términos previstos por la normativa.',
    impact: 'Puede afectar a determinadas contrataciones de personas extranjeras y debe comprobarse la ocupación y el ámbito territorial exactos del catálogo.',
    sourceLabel: 'BOE-A-2026-18504 · Resolución de 3/08/2026',
    sourceUrl: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-18504'
  }
];
