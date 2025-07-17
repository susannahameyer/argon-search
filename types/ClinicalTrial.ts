export type ClinicalTrial = {
    id: string
    url?: string
    title: string
    conditions: string[]
    interventions: string[]
    sponsor: string
    phase?: string
    status?: string
    locations?: string[]
    startDate?: string // Null if trial hasn't begun or is pending
    endDate?: string // Null if ongoing or pending
}
