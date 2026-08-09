import { useState, useEffect, type ReactNode } from 'react'
import type { QueueTicket } from '../../../shared/types'
import axios from 'axios'
import { MapPin } from 'lucide-react'

interface QueueTicketProps {
    ticket: QueueTicket
    location?: string
    taName?: string
    className?: string
    footer?: ReactNode
    onLeave?: (ticket: QueueTicket) => void | Promise<void>
}

const formatJoinedDate = (joinedAt: string | Date) => {
    const date = new Date(joinedAt)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

const formatJoinedTime = (joinedAt: string | Date) => {
    const date = new Date(joinedAt)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toUpperCase()
}

const shortId = (id: string) => id.slice(0, 8).toUpperCase()

// Meta label (e.g. Date, Time, Status,)
const MetaCell = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-[#e8c97a]">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-white sm:text-[0.95rem]">{value}</p>
    </div>
)

const TicketNotches = () => (
    <>
        {[12, 36, 60, 84].map((top) => (
            <span
                key={top}
                aria-hidden
                className="pointer-events-none absolute -left-2 z-20 size-4 rounded-full bg-white"
                style={{ top: `${top}%`, transform: 'translateY(-50%)' }}
            />
        ))}
    </>
)

export const QueueTicketComp = ({
    ticket,
    location: locationProp,
    taName: taNameProp,
    className = '',
    footer,
    onLeave,
}: QueueTicketProps) => {
    const [fetchedLocation, setFetchedLocation] = useState('')
    const [fetchedTaName, setFetchedTaName] = useState('')
    const [fetchedTaId, setFetchedTaId] = useState('')
    const [isLeaving, setIsLeaving] = useState(false)

    useEffect(() => {
        let cancelled = false

        const fetchNameLocationFromQueueID = async () => {
            try {
                const response = await axios.get(`/api/queues/${ticket.queueId}`)
                const queue = response.data?.queue
                if (!queue || cancelled) {
                    if (!queue) console.log('No queue fetched back from fetchNameLocationFromQueueID')
                    return
                }
                if (locationProp == null) {
                    setFetchedLocation(queue.location as string)
                }
                if (taNameProp == null) {
                    setFetchedTaName(
                        (queue.ta?.name as string) || (queue.ta?.email as string) || '',
                    )
                }
                if (queue.taId) {
                    setFetchedTaId(queue.taId as string)
                }
            } catch (error) {
                if (!cancelled) console.log('Failed to fetch queue location/TA', error)
            }
        }

        void fetchNameLocationFromQueueID()
        return () => {
            cancelled = true
        }
    }, [ticket.queueId, locationProp, taNameProp])

    const location = locationProp ?? fetchedLocation
    const taName = taNameProp ?? fetchedTaName
    const canLeave = ticket.status === 'WAITING'
    const positionLabel =
        ticket.position != null ? `#${ticket.position}` : ticket.status === 'HELPING' ? 'NOW' : '—'

    const handleLeave = async () => {
        if (!canLeave || isLeaving) return
        setIsLeaving(true)
        try {
            // Notify TA while ticket still exists, then soft-leave (LEFT)
            if (fetchedTaId) {
                await axios.post(
                    `/api/notifications/queues/${ticket.queueId}/user/${fetchedTaId}/type/LEAVE`,
                    { ticketId: ticket.id },
                )
            }
            await axios.patch(`/api/queueticket/${ticket.id}`, { status: 'LEFT' })
            await onLeave?.(ticket)
        } catch (error) {
            console.log('Failed to leave queue from Home', error)
        } finally {
            setIsLeaving(false)
        }
    }

    return (
        <article
            className={[
                'group relative flex w-full overflow-hidden text-white',
                'rounded-xl shadow-[0_12px_40px_-12px_rgba(80,0,20,0.55)]',
                'bg-[#6b1024]',
                'min-h-[9.5rem] sm:min-h-[10.5rem]',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <TicketNotches />

            {/* Gold inner frame */}
            <div className="pointer-events-none absolute inset-2 rounded-lg border border-[#e8c97a]/40 sm:inset-2.5" />

            {/* Left stub — position */}
            <div className="relative z-10 flex w-14 shrink-0 flex-col items-center justify-center border-r border-dashed border-[#e8c97a]/35 px-1 sm:w-16 xl:w-14">
                <p className="text-[0.6rem] font-semibold tracking-[0.18em] text-[#e8c97a]">POS</p>
                <p
                    className="mt-1 text-xl font-bold leading-none text-[#f3e6c0] sm:text-2xl"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                    {positionLabel}
                </p>
            </div>

            {/* Main body */}
            <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between gap-2.5 px-2.5 py-3 sm:gap-3 sm:px-3 sm:py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="min-w-0">
                        <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-white/80">
                            OFFICE HOURS
                        </p>
                        <h3
                            className="mt-0.5 text-lg font-bold tracking-wide text-[#f3e6c0] sm:text-xl"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        >
                            QUEUE TICKET
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                        <MetaCell label="DATE" value={formatJoinedDate(ticket.joinedAt)} />
                        <MetaCell label="TIME" value={formatJoinedTime(ticket.joinedAt)} />
                        <MetaCell label="STATUS" value={ticket.status} />
                    </div>
                </div>

                <div className="border-t border-dotted border-[#e8c97a]/35" />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <MetaCell label="TA" value={taName || '—'} />
                    <MetaCell
                        label="LOCATION"
                        value={
                            <span className="inline-flex max-w-full items-center gap-1">
                                <MapPin className="size-3.5 shrink-0 text-[#e8c97a]" aria-hidden />
                                <span className="truncate">{location || '—'}</span>
                            </span>
                        }
                    />
                    <MetaCell label="TICKET" value={shortId(ticket.id)} />
                </div>

                {footer ? <div className="min-w-0">{footer}</div> : null}

                {/* Mobile leave — stub is tight on small screens */}
                {canLeave && (
                    <button
                        type="button"
                        onClick={() => void handleLeave()}
                        disabled={isLeaving}
                        className="mt-1 w-full rounded-md border border-[#e8c97a]/50 bg-[#4a0b18] px-3 py-1.5 text-xs font-semibold tracking-widest text-[#f3e6c0] transition hover:bg-[#3a0812] disabled:opacity-60 sm:hidden"
                    >
                        {isLeaving ? 'LEAVING…' : 'LEAVE'}
                    </button>
                )}
            </div>

            {/* Right tear-off stub — desktop leave (hidden below sm; narrow at xl 3-up) */}
            <div className="relative z-10 hidden w-14 shrink-0 flex-col items-center justify-center border-l border-dashed border-[#e8c97a]/35 px-1.5 sm:flex sm:w-16 xl:w-14">
                {canLeave ? (
                    <button
                        type="button"
                        onClick={() => void handleLeave()}
                        disabled={isLeaving}
                        className="rounded-md border border-[#e8c97a]/55 bg-[#4a0b18] px-2.5 py-6 text-[0.7rem] font-bold tracking-[0.2em] text-[#f3e6c0] transition hover:bg-[#3a0812] hover:text-white disabled:opacity-60"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                        aria-label={`Leave queue ticket ${shortId(ticket.id)}`}
                    >
                        {isLeaving ? '…' : 'LEAVE'}
                    </button>
                ) : (
                    <p
                        className="text-[0.65rem] font-semibold tracking-[0.18em] text-[#e8c97a]/70"
                        style={{ writingMode: 'vertical-rl' }}
                    >
                        ADMIT ONE
                    </p>
                )}
            </div>
        </article>
    )
}
