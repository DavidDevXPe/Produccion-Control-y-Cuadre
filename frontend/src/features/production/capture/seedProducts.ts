import type { ProductionCatalogItem } from './productionCatalog'
import { normalizeProductName } from './productNormalizer'

const seedNames = [
    ['REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 70 cm - up 100% P.N.', 'REPRODUCTOR'],
    ['REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 50 cm - 70 cm 100% P.N.', 'REPRODUCTOR'],
    ['MANTO ESTANDAR CRUDO CONGELADO BLOCK S/TTO C/02 MEMB 2 KG - 4 KG SB 100% P.N.', 'MANTO'],
    ['MANTO ESTANDAR CRUDO CONGELADO BLOCK S/TTO C/02 MEMB 2 KG - 4 KG CH 100% P.N.', 'MANTO'],
    ['MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.', 'MANTO'],
    ['MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 1 KG - 2 KG SB 100% P.N.', 'MANTO'],
    ['ALETA CRUDA CONGELADA BLOCK S/TTO 1000 g - 2000 g (E) 100% P.N.', 'ALETA'],
    ['ALETA CRUDA CONGELADA BLOCK S/TTO 500 g - 1000 g 100% P.N.', 'ALETA'],
    ['ALETA CRUDA CONGELADA BLOCK S/TTO 2000 g - 3000 g 100% P.N.', 'ALETA'],
    ['REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 1-2 100% P.N.', 'REJOS'],
    ['REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 2-3 100% P.N.', 'REJOS'],
    ['REJOS CRUDOS SECCIONADOS 1-2 PARTE CORONA (EN TRATAMIENTO)', 'REJOS'],
    ['REJOS CRUDOS SECCIONADOS 1-2 PARTE MEDIA (EN TRATAMIENTO)', 'REJOS'],
    ['REJOS CRUDOS SECCIONADOS 1-2 PARTE TERMINAL (EN TRATAMIENTO)', 'REJOS'],
    ['BOTON USA SM CP ST (EN TRATAMIENTO)', 'BOTON'],
    ['REJOS CRUDOS CONGELADOS BLOCK S/TTO BAILARINA S/R 500 G - 1000 G SEMI LIMPIOS 100% P.N.', 'REJOS'],
    ['ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P POLAR SM SP ST MIXTA 100% P.N.', 'ANILLAS'],
    ['ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA SM 2DA MIXTA 100% P.N.', 'ANILLAS'],
    ['ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA CM 2DA MIXTA 100% P.N.', 'ANILLAS'],
    ['ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P CM SP ST MIXTA 100% P.N.', 'ANILLAS'],
    ['RECORTE CRUDO CONGELADO BLOCK S/TTO ANILLAS SM SP ST 100% P.N.', 'RECORTE_CRUDO'],
    ['RECORTE CRUDO CONGELADO BLOCK S/TTO ANILLAS CM SP ST 100% P.N.', 'RECORTE_CRUDO'],
    ['RECORTE CRUDO CONGELADO BLOCK S/TTO MANTO JAPONÉS 100% P.N.', 'RECORTE_CRUDO'],
    ['RECORTE CRUDO CONGELADO BLOCK S/TTO ALETA 100% P.N.', 'RECORTE_CRUDO'],
    ['RECORTES CRUDOS - LABIOS CONGELADOS BLOCK S/TTO 100% P.N.', 'RECORTE_CRUDO'],
    ['RECORTE COCIDO CONGELADO BLOCK S/TTO PB 100% P.N.', 'RECORTE_COCIDO'],
    ['CONOS CON PIEL CRUDOS CONGELADOS BLOCK S/TTO 100% P.N.', 'MANTO'],
    ['NUCAS CRUDAS CONGELADAS BLOCK S/TTO SEMI-LIMPIAS 300-UP 100% P.N.', 'NUCA_SEMILIMPIA'],
    ['MEMBRANAS COCIDAS CONGELADAS 100% P.N.', 'MEMBRANA'],
] as const

const seedIds = [
    'reproductor-70-up',
    'reproductor-50-70',
    'manto-estandar-crudo-2-4',
    'manto-estandar-crudo-2-4-ch',
    'manto-japones-crudo',
    'capture-seed-5',
    'capture-seed-6',
    'capture-seed-7',
    'capture-seed-8',
    'rejo-baa-1-2',
    'rejo-baa-2-3',
    'rejos-seccionados-1-2-corona-tratamiento',
    'rejos-seccionados-1-2-media-tratamiento',
    'rejos-seccionados-1-2-terminal-tratamiento',
    'boton-usa-sm-cp-st-tratamiento',
    'rejo-bailarina-500-1000',
    'anillas-espana-polar-mixta',
    'anillas-espana-segunda-mixta',
    'anillas-espana-cm-2da-mixta',
    'anillas-espana-p-cm-sp-st-mixta',
    'recorte-crudo-anillas-sm-sp-st',
    'recorte-crudo-anillas-cm-sp-st',
    'recorte-crudo-manto-japones',
    'recorte-crudo-aleta',
    'recortes-crudos-labios',
    'recorte-cocido-pb',
    'conos-con-piel-crudos',
    'nuca-semilimpia-codificada',
    'membranas-cocidas',
] as const

const familyMetadata = {
    ALETA: { familyId: 'aleta-cruda', familyName: 'ALETA CRUDA', summaryGroupId: 'ALETA' },
    MANTO: { familyId: 'manto-crudo', familyName: 'MANTO CRUDO', summaryGroupId: 'MANTO' },
    ANILLAS: { familyId: 'anillas', familyName: 'ANILLAS', summaryGroupId: 'ANILLAS' },
    BOTON: { familyId: 'boton', familyName: 'BOTON', summaryGroupId: 'BOTON' },
    NUCA_SEMILIMPIA: { familyId: 'nuca-semilimpia', familyName: 'NUCA SEMILIMPIA', summaryGroupId: 'NUCA_SEMILIMPIA' },
    REJOS: { familyId: 'rejos-crudo', familyName: 'REJOS CRUDO', summaryGroupId: 'REJOS' },
    REPRODUCTOR: { familyId: 'reproductor-crudo', familyName: 'REPRODUCTOR CRUDO', summaryGroupId: 'REPRODUCTOR' },
    MEMBRANA: { familyId: 'membrana', familyName: 'MEMBRANA', summaryGroupId: 'RECORTE_COCIDO'},
    RECORTE_CRUDO: { familyId: 'recorte-crudo', familyName: 'RECORTE CRUDO', summaryGroupId: 'RECORTE_CRUDO' },
    RECORTE_COCIDO: { familyId: 'recorte-cocido', familyName: 'RECORTE COCIDO', summaryGroupId: 'RECORTE_COCIDO',
},
} as const

function technicalClassification(canonicalName: string): NonNullable<ProductionCatalogItem['technicalClassification']> {
    if (!canonicalName.includes('ANILLAS')) return 'UNCLASSIFIED'
    if (canonicalName.includes('POLAR')) return 'POLAR'
    if (canonicalName.includes('USA')) return 'USA'
    return 'GENERAL'
}

export const SEED_CAPTURE_PRODUCTS: readonly ProductionCatalogItem[] = seedNames.map(
    ([canonicalName, family], index) => ({
        ...familyMetadata[family],
        productId: seedIds[index]!,
        productName: canonicalName,
        canonicalName,
        normalizedName: normalizeProductName(canonicalName),
        aliases: [],
        source: 'CAPTURE' as const,
        createdAt: '2026-09-15T00:00:00.000Z',
        active: true,
        technicalClassification: technicalClassification(canonicalName),
    }),
)