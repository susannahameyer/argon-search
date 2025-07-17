import { useState } from 'react'
import { SearchResults, Trial } from '../components/SearchResults'
import {
    Box,
    FormLabel,
    Input,
    Stack,
    Switch,
    Text,
    Button,
    Tooltip,
    HStack
} from '@chakra-ui/react'
import { InfoOutlineIcon } from '@chakra-ui/icons'

const DEFAULT_FILTERS = {
    matchAll: false,
    synonymExpansion: false,
}

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Trial[]>([])
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState(DEFAULT_FILTERS)
    const [total, setTotal] = useState(0)

    const fetchResults = async ({
        page,
        sortBy,
        sortDir,
        extraFilters = {},
    }: {
        page: number
        sortBy: keyof Trial
        sortDir: 'asc' | 'desc'
        extraFilters?: Record<string, any>
    }) => {
        setLoading(true)
        const res = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filters: query.includes(',')
                    ? query.split(',').map((w) => w.trim()).filter(Boolean)
                    : [query.trim()],
                page,
                sortBy,
                sortDir,
                ...extraFilters,
            }),
        })

        const data = await res.json()
        setResults(data.results)
        setTotal(data.total)
        setLoading(false)
    }

    const handleToggle = (key: keyof typeof DEFAULT_FILTERS) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: !prev[key] }
            if (query.trim()) {
                fetchResults({
                    page: 1,
                    sortBy: 'startDate',
                    sortDir: 'asc',
                    extraFilters: newFilters,
                })
            }
            return newFilters
        })
    }

    return (
        <Box p={8}>
            <Text fontSize="2xl" fontWeight="bold" mb={4}>
                Clinical Trials Search
            </Text>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    fetchResults({
                        page: 1,
                        sortBy: 'startDate',
                        sortDir: 'asc',
                        extraFilters: filters,
                    })
                }}
            >
                {/* Search Bar */}
                <Stack spacing={4} mb={6}>
                    <HStack spacing={4} align="end">
                        <Input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter global search terms, e.g. 'NSCLC, immunotherapy'"
                        />
                        <Button type="submit" colorScheme="blue">
                            Search
                            <Tooltip
                                label="Separate multiple terms with commas. Use 'AND Match' to require all terms."
                                fontSize="sm"
                            >
                                <InfoOutlineIcon boxSize="3" marginLeft={2} />
                            </Tooltip>
                        </Button>
                    </HStack>

                    {/* Search Options */}
                    <Box bg="gray.50" borderRadius="md" p={4}>
                        <Text fontWeight="bold" mb={2}>
                            Search Options
                        </Text>
                        <HStack spacing={10} align="start" wrap="wrap">
                            <Box>
                                <FormLabel htmlFor="matchAll" fontSize="sm" mb={1}>
                                    <HStack spacing={1} align="center">
                                        <Text>AND Match</Text>
                                        <Tooltip
                                            label="Require all terms to be present (logical AND). E.g. 'nsclc,immunotherapy' → both terms must be matched."
                                            fontSize="sm"
                                        >
                                            <InfoOutlineIcon boxSize="3" />
                                        </Tooltip>
                                    </HStack>
                                </FormLabel>
                                <Switch
                                    id="matchAll"
                                    isChecked={filters.matchAll}
                                    onChange={() => handleToggle('matchAll')}
                                    size="sm"
                                />
                            </Box>
                            <Box>
                                <FormLabel htmlFor="synonymExpansion" fontSize="sm" mb={1}>
                                    <HStack spacing={1} align="center">
                                        <Text>Synonyms</Text>
                                        <Tooltip
                                            label="Expand terms using medical synonyms. E.g. NSCLC → non-small cell lung cancer"
                                            fontSize="sm"
                                        >
                                            <InfoOutlineIcon boxSize="3" />
                                        </Tooltip>
                                    </HStack>
                                </FormLabel>
                                <Switch
                                    id="synonymExpansion"
                                    isChecked={filters.synonymExpansion}
                                    onChange={() => handleToggle('synonymExpansion')}
                                    size="sm"
                                />
                            </Box>
                        </HStack>
                    </Box>
                </Stack>
            </form>

            {/* Search Results Table */}
            <SearchResults
                results={results}
                isLoading={loading}
                hasSearched={true}
                fetchResults={fetchResults}
                totalCount={total}
            />
        </Box >
    )
}
