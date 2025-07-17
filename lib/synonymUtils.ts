import { SYNONYM_MAP } from './synonyms'

function normalizeTerm(term: string): string {
    return term.toLowerCase().replace(/[^a-z0-9]/gi, '')
}

export function buildNormalizedSynonymMap() {
    const map: Record<string, Set<string>> = {}

    for (const [key, vals] of Object.entries(SYNONYM_MAP)) {
        const normalizedKey = normalizeTerm(key)
        if (!map[normalizedKey]) {
            map[normalizedKey] = new Set()
        }

        for (const val of vals) {
            const normalizedVal = normalizeTerm(val)
            // Bidirectional
            map[normalizedKey].add(normalizedVal)
            if (!map[normalizedVal]) map[normalizedVal] = new Set()
            map[normalizedVal].add(normalizedKey)
        }
    }
    const finalMap: Record<string, string[]> = {}
    for (const [k, v] of Object.entries(map)) {
        finalMap[k] = [...v]
    }
    return finalMap
}

export function normalizeAndExpandQueryTerm(term: string, synonymMap: Record<string, string[]>): string[] {
    const normalized = normalizeTerm(term)
    const expanded = synonymMap[normalized] || []
    return [normalized, ...expanded]
}
