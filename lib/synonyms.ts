// TODO: Replace with a medical ontology (UMLS, SNOMED CT) or
// a preprocessing script that builds this from known synonyms in the persisted dataset.
// For demo purposes, hardcode a small set.
export const SYNONYM_MAP: Record<string, string[]> = {
    nsclc: [
        'non small cell lung cancer',
        'non-small cell lung cancer',
        'non small cell lung carcinoma',
        'carcinoma of the lungs, non small cell',
    ],
    cancer: ['carcinoma', 'tumor'],
    lung: ['pulmonary', 'respiratory'],
    immunotherapy: ['immune therapy', 'checkpoint inhibitors'],
}