import { useState, useEffect, type ReactNode } from 'react'
import type { QueueTicket } from '../../../shared/types'
import axios from 'axios'

interface QueueTicketProps {
    ticket: QueueTicket
    location?: string
    taName?: string
    className?: string
    footer?: ReactNode
}

const formatJoinedAt = (joinedAt: string | Date) => {
    const date = new Date(joinedAt)
    if (Number.isNaN(date.getTime())) return String(joinedAt)

    return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

const shortId = (id: string) => id.slice(0, 8)

const TicketMetaRow = ({
    label,
    value,
    muted = false,
}: {
    label: string
    value: ReactNode
    muted?: boolean
}) => (
    <div
        className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 break-words ${
            muted ? 'text-gray-50/50' : 'text-white'
        }`}
    >
        <span className="shrink-0 font-medium opacity-90">{label}:</span>
        <span className="min-w-0">{value}</span>
    </div>
)

const TicketGlow = () => (
    <>
        <div className="pointer-events-none absolute -top-10 -left-10 h-24 w-24 rounded-lg bg-red-500 blur-3xl sm:h-32 sm:w-32" />
        <div className="pointer-events-none absolute -top-20 -left-20 h-20 w-20 rounded-lg bg-white/30 blur-3xl sm:h-25 sm:w-25" />
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-24 w-24 rounded-lg bg-red-500 blur-3xl sm:h-32 sm:w-32" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-24 w-24 rounded-full bg-black blur-3xl sm:h-32 sm:w-32" />
        <div className="pointer-events-none absolute -bottom-15 -left-15 h-24 w-24 rounded-full bg-black blur-3xl sm:h-32 sm:w-32" />
    </>
)

export const QueueTicketComp = ({
    ticket,
    location: locationProp,
    taName: taNameProp,
    className = '',
    footer,
}: QueueTicketProps) => {
    const [currentDate] = useState(() => new Date())
    const readableDate = currentDate.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
    const [fetchedLocation, setFetchedLocation] = useState('')
    const [fetchedTaName, setFetchedTaName] = useState('')

    useEffect(() => {
        if (locationProp != null && taNameProp != null) return

        const fetchNameLocationFromQueueID = async () => {
            const queueId = ticket.queueId
            try {
                const response = await axios.get(`/api/queues/${queueId}`)
                if (!response.data?.queue) {
                    console.log('No queue fetched back from fetchNameLocationFromQueueID')
                    return
                }
                if (locationProp == null) {
                    setFetchedLocation(response.data.queue.location as string)
                }
                if (taNameProp == null) {
                    setFetchedTaName(response.data.queue.taId as string)
                }
            } catch (error) {
                console.log('Failed to fetch queue location/TA', error)
            }
        }

        void fetchNameLocationFromQueueID()
    }, [ticket.queueId, locationProp, taNameProp])

    const location = locationProp ?? fetchedLocation
    const taName = taNameProp ?? fetchedTaName

    return (
        <article
            className={[
                'relative flex h-full min-h-[12rem] w-full flex-col justify-between overflow-hidden',
                'rounded-2xl border border-white/15 bg-red-950/90 text-white',
                'px-4 py-4 text-sm sm:min-h-[14rem] sm:px-5 sm:py-5 sm:text-base lg:min-h-[15rem] lg:text-lg',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <TicketGlow />

            <div className="relative z-10 flex min-w-0 flex-col gap-1.5 sm:gap-2">
                <TicketMetaRow
                    label="Date"
                    value={formatJoinedAt(ticket.joinedAt) || readableDate}
                />
                <TicketMetaRow label="Ticket ID" value={shortId(ticket.id)} />
                <TicketMetaRow label="Status" value={ticket.status} />
                <TicketMetaRow label="Location" value={location || '—'} muted />
                <TicketMetaRow label="TA" value={taName || '—'} muted />
            </div>

            {footer ? (
                <div className="relative z-10 mt-3 w-full min-w-0 sm:mt-4">{footer}</div>
            ) : null}
        </article>
    )
}
