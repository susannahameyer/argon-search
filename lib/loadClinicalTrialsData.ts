import fs from 'fs'
import path from 'path'
import { ClinicalTrial } from '@/types/ClinicalTrial'

// Load clinical trials data from data/ctg-studies.json (1000 rows) and map to ClinicalTrial type
export function loadClinicalTrialsData(): {
    trials: ClinicalTrial[]
    statuses: string[]
} {
    const filePath = path.join(process.cwd(), 'data', 'ctg-studies.json')
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const trialsJson = JSON.parse(rawData)

    const trials: ClinicalTrial[] = []
    const statusSet = new Set<string>()

    for (const trial of trialsJson) {
        const protocolSection = trial.protocolSection
        const nctId = protocolSection?.identificationModule?.nctId
        const title = protocolSection?.identificationModule?.briefTitle

        if (!nctId || !title) {
            // Skip without essential info, but don't fail the entire load
            continue
        }

        const status = protocolSection?.statusModule?.overallStatus
        if (status) {
            statusSet.add(status)
        }

        trials.push({
            id: nctId,
            title,
            conditions: protocolSection?.conditionsModule?.conditions ?? [],
            interventions:
                protocolSection?.armsInterventionsModule?.interventions?.map((i: any) => i.name) ?? [],
            sponsor: protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name ?? 'Unknown Sponsor',
            phase: protocolSection?.designModule?.phases?.[0],
            status,
            locations:
                protocolSection?.contactsLocationsModule?.locations?.map((l: any) => l.city).filter(Boolean) ??
                [],
            startDate: protocolSection?.statusModule?.startDateStruct?.date,
            endDate: protocolSection?.statusModule?.completionDateStruct?.date,
            url: `https://clinicaltrials.gov/study/${nctId}`,
        })
    }

    return {
        trials,
        statuses: Array.from(statusSet).sort(), // just demonstration of collecting unique statuses
    }
}
