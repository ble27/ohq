import { useState, useEffect, type ReactNode } from 'react'
import type { QueueTicket } from '../../../shared/types'
import axios from 'axios'
import { MapPin } from 'lucide-react'
import { getSafeZoomLink } from '@/lib/utils'

interface QueueTicketProps {
    ticket: QueueTicket
    location?: string
    zoomLink?: string | null
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

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-start gap-x-2 gap-y-0.5 sm:grid-cols-[5rem_minmax(0,1fr)]">
        <p className="pt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[#e8c97a]">
            {label}
        </p>
        <div className="min-w-0 break-words text-xs font-medium leading-snug text-white sm:text-[0.8rem]">
            {value}
        </div>
    </div>
)

const TicketNotches = () => (
    <>
        {[12, 36, 60, 84].map((top) => (
            <span
                key={top}
                aria-hidden
                className="pointer-events-none absolute left-0 z-20 size-3 -translate-x-1/2 rounded-full bg-white"
                style={{ top: `${top}%`, transform: 'translate(-50%, -50%)' }}
            />
        ))}
    </>
)

export const QueueTicketComp = ({
    ticket,
    location: locationProp,
    zoomLink: zoomLinkProp,
    taName: taNameProp,
    className = '',
    footer,
    onLeave,
}: QueueTicketProps) => {
    const [fetchedLocation, setFetchedLocation] = useState('')
    const [fetchedZoomLink, setFetchedZoomLink] = useState<string | null>(null)
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
                if (zoomLinkProp == null) {
                    setFetchedZoomLink((queue.zoomLink as string | null) ?? null)
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
    }, [ticket.queueId, locationProp, zoomLinkProp, taNameProp])

    const location = locationProp ?? fetchedLocation
    const zoomLink = zoomLinkProp ?? fetchedZoomLink
    const taName = taNameProp ?? fetchedTaName
    const canLeave = ticket.status === 'WAITING'
    const positionLabel =
        ticket.position != null ? `#${ticket.position}` : ticket.status === 'HELPING' ? 'NOW' : '—'

    const handleLeave = async () => {
        if (!canLeave || isLeaving) return
        setIsLeaving(true)
        try {
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
                '@container relative flex w-full overflow-hidden text-white',
                'rounded-xl shadow-[0_12px_40px_-12px_rgba(80,0,20,0.55)]',
                'bg-[#6b1024]',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <TicketNotches />

            <div className="pointer-events-none absolute inset-2 rounded-lg border border-[#e8c97a]/40 sm:inset-2.5" />

            {/* Left stub — position */}
            <div className="relative z-10 ml-1.5 flex w-[3rem] shrink-0 flex-col items-center justify-center border-r border-dashed border-[#e8c97a]/35 py-3 pr-1.5 sm:ml-2 sm:w-[3.25rem]">
                <p className="w-full text-center text-[0.55rem] font-semibold tracking-[0.08em] text-[#e8c97a]">
                    POS
                </p>
                <p
                    className="mt-1 w-full text-center text-[0.7rem] font-bold leading-tight text-[#f3e6c0] sm:text-xs"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                    {positionLabel}
                </p>
            </div>

            {/* Main body */}
            <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-2.5 px-2.5 py-3 sm:px-3 sm:py-3.5">
                <div className="space-y-2">
                    <div>
                        <p className="text-[0.62rem] font-semibold tracking-[0.14em] text-white/80">
                            OFFICE HOURS
                        </p>
                        <h3
                            className="mt-0.5 text-base font-bold tracking-wide text-[#f3e6c0] sm:text-lg"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        >
                            QUEUE TICKET
                        </h3>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] font-medium text-white sm:text-xs">
                        <span>
                            <span className="text-[#e8c97a]">Date </span>
                            {formatJoinedDate(ticket.joinedAt)}
                        </span>
                        <span>
                            <span className="text-[#e8c97a]">Time </span>
                            {formatJoinedTime(ticket.joinedAt)}
                        </span>
                        <span>
                            <span className="text-[#e8c97a]">Status </span>
                            {ticket.status}
                        </span>
                    </div>
                </div>

                <div className="border-t border-dotted border-[#e8c97a]/35" />

                <div className="flex flex-col gap-2">
                    <DetailRow label="TA" value={taName || '—'} />
                    <DetailRow
                        label="Location"
                        value={
                            <span className="inline-flex items-start gap-1">
                                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#e8c97a]" aria-hidden />
                                <span>{location || '—'}</span>
                            </span>
                        }
                    />
                    <DetailRow
                        label="Zoom"
                        value={
                            getSafeZoomLink(zoomLink) ? (
                                <a
                                    href={getSafeZoomLink(zoomLink)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="break-all text-[#e8c97a] underline-offset-2 hover:underline"
                                >
                                    Join meeting
                                </a>
                            ) : (
                                '—'
                            )
                        }
                    />
                    <DetailRow label="Ticket" value={shortId(ticket.id)} />
                </div>

                {footer ? <div className="min-w-0">{footer}</div> : null}

                {canLeave && (
                    <button
                        type="button"
                        onClick={() => void handleLeave()}
                        disabled={isLeaving}
                        className="w-full rounded-md border border-[#e8c97a]/50 bg-[#4a0b18] px-3 py-2 text-xs font-semibold tracking-widest text-[#f3e6c0] transition hover:bg-[#3a0812] disabled:opacity-60 @sm:hidden"
                    >
                        {isLeaving ? 'LEAVING…' : 'LEAVE QUEUE'}
                    </button>
                )}
            </div>

            {canLeave && (
                <div className="relative z-10 hidden w-12 shrink-0 flex-col items-center justify-center border-l border-dashed border-[#e8c97a]/35 px-1 @sm:flex sm:w-14">
                    <button
                        type="button"
                        onClick={() => void handleLeave()}
                        disabled={isLeaving}
                        className="rounded-md border border-[#e8c97a]/55 bg-[#4a0b18] px-2 py-5 text-[0.65rem] font-bold tracking-[0.16em] text-[#f3e6c0] transition hover:bg-[#3a0812] hover:text-white disabled:opacity-60"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                        aria-label={`Leave queue ticket ${shortId(ticket.id)}`}
                    >
                        {isLeaving ? '…' : 'LEAVE'}
                    </button>
                </div>
            )}
        </article>
    )
}
