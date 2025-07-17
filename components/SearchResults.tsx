import React, { useState, useEffect } from 'react'
import {
    Box,
    Spinner,
    Text,
    Link,
    Tooltip,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    HStack,
    Input,
    Select,
    IconButton,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverFooter,
    PopoverArrow,
    PopoverCloseButton,
    useDisclosure
} from '@chakra-ui/react'
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons'
import { FiFilter } from 'react-icons/fi'
import { STATUSES } from '@/lib/statuses'

export const PAGE_SIZE = 20

export type Trial = {
    id: string
    title: string
    sponsor: string
    status: string
    startDate: string
    endDate: string
}

type SortKey = keyof Trial

type Comparison = '>=' | '<='

type Props = {
    fetchResults: (params: {
        page: number
        sortBy: SortKey
        sortDir: 'asc' | 'desc'
        extraFilters?: Record<string, any>
    }) => void
    results: Trial[]
    totalCount: number
    isLoading: boolean
    hasSearched: boolean
}

export const SearchResults: React.FC<Props> = ({
    fetchResults,
    results,
    totalCount,
    isLoading
}) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [sortKey, setSortKey] = useState<SortKey>('startDate')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const [titleFilter, setTitleFilter] = useState('')
    const [sponsorFilter, setSponsorFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [startDateMin, setStartDateMin] = useState('')
    const [endDateMax, setEndDateMax] = useState('')


    useEffect(() => {
        fetchResults({
            page: currentPage,
            sortBy: sortKey,
            sortDir: sortDirection,
            extraFilters: {
                titleFilter,
                sponsorFilter,
                statusFilter,
                startDateMin,
                endDateMax,
            }

        })
    }, [currentPage, sortKey, sortDirection, titleFilter, sponsorFilter, statusFilter, startDateMin, endDateMax])
    console.log('results', results)
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

    const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
    const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDirection('asc')
        }
    }

    const FilterPopover = ({
        label,
        initialValue,
        onApply,
        isActive,
        childrenBuilder
    }: {
        label: string
        initialValue: string
        onApply: (value: string) => void
        isActive: boolean
        childrenBuilder: (
            value: string,
            setValue: React.Dispatch<React.SetStateAction<string>>
        ) => React.ReactNode
    }) => {
        const { onOpen, onClose, isOpen } = useDisclosure()
        const [value, setValue] = useState(initialValue)

        const handleApply = () => {
            onApply(value)
            onClose()
        }

        return (
            <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="bottom-start">
                <PopoverTrigger>
                    <IconButton
                        aria-label={`Filter ${label}`}
                        icon={<FiFilter />}
                        size={isActive ? 'sm' : 'xs'}
                        variant={isActive ? 'solid' : 'ghost'}
                        color={isActive ? 'blue' : 'gray'}
                    />
                </PopoverTrigger>
                <PopoverContent p={2} w="auto">
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>Filter {label}</PopoverHeader>
                    <PopoverBody>{childrenBuilder(value, setValue)}</PopoverBody>
                    <PopoverFooter>
                        <Button size="xs" colorScheme="blue" onClick={handleApply}>
                            Apply
                        </Button>
                    </PopoverFooter>
                </PopoverContent>
            </Popover>
        )
    }

    const SortableHeader = ({
        label,
        columnKey,
        filterUI
    }: {
        label: string
        columnKey: SortKey
        filterUI?: React.ReactNode
    }) => (
        <Th>
            <HStack spacing={1} alignItems="center">
                <Text cursor="pointer" onClick={() => handleSort(columnKey)} userSelect="none">
                    {label}
                </Text>
                {sortKey === columnKey &&
                    (sortDirection === 'asc' ? (
                        <TriangleUpIcon boxSize={3} />
                    ) : (
                        <TriangleDownIcon boxSize={3} />
                    ))}
                {filterUI}
            </HStack>
        </Th>
    )

    if (isLoading) {
        return (
            <Box mt={10} textAlign="center">
                <Spinner size="xl" />
            </Box>
        )
    }

    return (
        <Box mt={10}>
            <Box overflowX="auto">
                <Table variant="striped" size="md">
                    <Thead>
                        <Tr>
                            <SortableHeader
                                label="Title"
                                columnKey="title"
                                filterUI={
                                    <FilterPopover
                                        label="title"
                                        initialValue={titleFilter}
                                        onApply={setTitleFilter}
                                        isActive={!!titleFilter}
                                        childrenBuilder={(val, setVal) => (
                                            <Input
                                                placeholder="Filter title"
                                                value={val}
                                                onChange={(e) => setVal(e.target.value)}
                                                size="sm"
                                            />
                                        )}
                                    />
                                }
                            />
                            <SortableHeader
                                label="Sponsor"
                                columnKey="sponsor"
                                filterUI={
                                    <FilterPopover
                                        label="sponsor"
                                        initialValue={sponsorFilter}
                                        onApply={setSponsorFilter}
                                        isActive={!!sponsorFilter}
                                        childrenBuilder={(val, setVal) => (
                                            <Input
                                                placeholder="Filter sponsor"
                                                value={val}
                                                onChange={(e) => setVal(e.target.value)}
                                                size="sm"
                                            />
                                        )}
                                    />
                                }
                            />
                            <SortableHeader
                                label="Status"
                                columnKey="status"
                                filterUI={
                                    <FilterPopover
                                        label="status"
                                        initialValue={statusFilter}
                                        onApply={setStatusFilter}
                                        isActive={!!statusFilter}
                                        childrenBuilder={(val, setVal) => (
                                            <Select
                                                placeholder="All statuses"
                                                value={val}
                                                onChange={(e) => setVal(e.target.value)}
                                                size="sm"
                                            >
                                                {STATUSES.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </Select>

                                        )}
                                    />
                                }
                            />
                            <SortableHeader
                                label="Start"
                                columnKey="startDate"
                                filterUI={
                                    <FilterPopover
                                        label="start date"
                                        initialValue={startDateMin}
                                        onApply={setStartDateMin}
                                        isActive={!!startDateMin}
                                        childrenBuilder={(val, setVal) => (
                                            <Input
                                                placeholder="After (YYYY-MM-DD)"
                                                value={val}
                                                onChange={(e) => setVal(e.target.value)}
                                                size="sm"
                                            />
                                        )}
                                    />
                                }
                            />
                            <SortableHeader
                                label="End"
                                columnKey="endDate"
                                filterUI={
                                    <FilterPopover
                                        label="end date"
                                        initialValue={endDateMax}
                                        onApply={setEndDateMax}
                                        isActive={!!endDateMax}
                                        childrenBuilder={(val, setVal) => (
                                            <Input
                                                placeholder="Before (YYYY-MM-DD)"
                                                value={val}
                                                onChange={(e) => setVal(e.target.value)}
                                                size="sm"
                                            />
                                        )}
                                    />
                                }
                            />


                        </Tr>
                    </Thead>
                    <Tbody>
                        {results.length === 0 ? (
                            <Tr>
                                <Td colSpan={5} textAlign="center">
                                    No results found.
                                </Td>
                            </Tr>
                        ) : (
                            results.map((trial) => (
                                <Tr key={trial.id} _hover={{ bg: 'gray.50' }}>
                                    <Td maxW="300px">
                                        <Tooltip label={trial.title} hasArrow>
                                            <Link
                                                href={`https://clinicaltrials.gov/study/${trial.id}`}
                                                isExternal
                                                rel="noopener noreferrer"
                                                color="teal.600"
                                                fontWeight="semibold"
                                                _hover={{ textDecoration: 'underline' }}
                                            >
                                                {trial.title.length > 80 ? trial.title.slice(0, 77) + '...' : trial.title}
                                            </Link>
                                        </Tooltip>
                                    </Td>
                                    <Td>{trial.sponsor}</Td>
                                    <Td>{trial.status}</Td>
                                    <Td whiteSpace="nowrap">{trial.startDate}</Td>
                                    <Td whiteSpace="nowrap">{trial.endDate}</Td>
                                </Tr>
                            ))
                        )}
                    </Tbody>

                </Table>
            </Box>

            {totalPages > 1 && (
                <HStack justify="center" mt={4}>
                    <Button onClick={handlePrev} isDisabled={currentPage === 1}>
                        Previous
                    </Button>
                    <Text>
                        Page {currentPage} of {totalPages}
                    </Text>
                    <Button onClick={handleNext} isDisabled={currentPage === totalPages}>
                        Next
                    </Button>
                </HStack>
            )}
        </Box>
    )
};
