import type { NextApiRequest, NextApiResponse } from 'next'
import { loadClinicalTrialsData } from '@/lib/loadClinicalTrialsData'
import { ClinicalTrial } from '@/types/ClinicalTrial'
import { buildNormalizedSynonymMap, normalizeAndExpandQueryTerm } from '@/lib/synonymUtils'


const validSortKeys = ['startDate', 'endDate', 'title', 'sponsor', 'status'] as const

type SortKey = typeof validSortKeys[number]
type Comparison = '>=' | '<='

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }
    const data = loadClinicalTrialsData()
    const allTrials: ClinicalTrial[] = data.trials

    const {
        filters = [],
        matchAll = false,
        synonymExpansion = false,
        page = 1,
        sortBy = 'startDate',
        sortDir = 'asc',
        titleFilter = '',
        sponsorFilter = '',
        statusFilter = '',
        startDateFilter = '',
        startComparison = '>=',
        endDateFilter = '',
        endComparison = '<='
    } = req.body as {
        filters: string[]
        matchAll: boolean
        synonymExpansion: boolean
        page: number
        sortBy: SortKey
        sortDir: 'asc' | 'desc'
        titleFilter?: string
        sponsorFilter?: string
        statusFilter?: string
        startDateFilter?: string
        startComparison?: Comparison
        endDateFilter?: string
        endComparison?: Comparison
    }

    if (!validSortKeys.includes(sortBy)) {
        return res.status(400).json({ error: `Invalid sortBy key: ${sortBy}` })
    }

    const synonymMap = buildNormalizedSynonymMap()
    const expandedFilters: string[] = []

    for (const phrase of filters) {
        const expandedTerms = normalizeAndExpandQueryTerm(phrase, synonymMap)
        // Join separate search terms
        const phraseVariants = new Set<string>()
        for (const term of expandedTerms) {
            phraseVariants.add(term.toLowerCase())
        }
        // If original phrase had multiple words and wasn't in synonyms, include it directly
        phraseVariants.add(phrase.toLowerCase())
        expandedFilters.push(...phraseVariants)
    }

    let filtered = allTrials.filter((trial) => {
        const combinedText = [
            trial.title,
            trial.conditions?.join(' '),
            trial.interventions?.join(' '),
            trial.sponsor,
        ]
            .join(' ')
            .toLowerCase()

        const matchesFullText = filters.length === 0 || (
            matchAll
                ? filters.every((originalPhrase) => {
                    const expanded = synonymExpansion
                        ? normalizeAndExpandQueryTerm(originalPhrase, synonymMap).map(t => t.toLowerCase())
                        : [originalPhrase.toLowerCase()]

                    return expanded.some((term) => combinedText.includes(term))
                })
                : filters.some((originalPhrase) => {
                    const expanded = synonymExpansion
                        ? normalizeAndExpandQueryTerm(originalPhrase, synonymMap).map(t => t.toLowerCase())
                        : [originalPhrase.toLowerCase()]

                    return expanded.some((term) => combinedText.includes(term))
                })
        )

        const matchesTitle = !titleFilter || trial.title?.toLowerCase().includes(titleFilter.toLowerCase())
        const matchesSponsor = !sponsorFilter || trial.sponsor?.toLowerCase().includes(sponsorFilter.toLowerCase())
        const matchesStatus = !statusFilter || trial.status === statusFilter

        const matchesStart = !startDateFilter || compareDates(trial.startDate, startDateFilter, startComparison)
        const matchesEnd = !endDateFilter || compareDates(trial.endDate, endDateFilter, endComparison)

        return matchesFullText && matchesTitle && matchesSponsor && matchesStatus && matchesStart && matchesEnd
    })

    filtered = filtered.sort((a, b) => {
        const aVal = normalize(a[sortBy])
        const bVal = normalize(b[sortBy])
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
        return 0
    })

    const pageSize = 10
    const startIdx = (page - 1) * pageSize
    const paginated = filtered.slice(startIdx, startIdx + pageSize)

    return res.status(200).json({
        total: filtered.length,
        results: paginated,
    })
}

function normalize(value: any): string {
    if (typeof value === 'string') return value.toLowerCase()
    if (value instanceof Date) return value.toISOString()
    return value?.toString().toLowerCase?.() || ''
}

function compareDates(actual: string | undefined, filter: string, operator: Comparison): boolean {
    if (!actual) return false
    const trialDate = new Date(actual)
    const filterDate = new Date(filter)
    if (operator === '>=') return trialDate >= filterDate
    if (operator === '<=') return trialDate <= filterDate
    return true
}
