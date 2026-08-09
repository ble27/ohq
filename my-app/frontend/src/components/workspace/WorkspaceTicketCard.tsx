import type { ReactNode } from 'react'
import type { QueueTicket, QueueTicketWithStudent } from '@shared/types'

interface WorkspaceTicketCardProps {
    ticket: QueueTicketWithStudent
    accent?: 'next' | 'session' | 'done'
    action?: ReactNode
    time?: number
}

const formatJoinedAt = (joinedAt: string | Date) => {
    const date = new Date(joinedAt)
    if (Number.isNaN(date.getTime())) return String(joinedAt)

    return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    })
}

const accentStyles = {
    next: 'border-blue-200 bg-blue-50/60',
    session: 'border-amber-200 bg-amber-50/60',
    done: 'border-emerald-200 bg-emerald-50/40',
} as const

export const WorkspaceTicketCard = ({
    ticket,
    accent = 'next',
    action,
    time
}: WorkspaceTicketCardProps) => {
    const mins = time ? Math.floor(time / 60).toLocaleString().padStart(2, '0') : null;
    const secs = time ? (time % 60).toLocaleString().padStart(2, '0') : null
    return (
        <div
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 ${accentStyles[accent]}`}
        >
            {/* Wrapped this container in flex to align left and right sides */}
            <div className="flex flex-1 items-center justify-between min-w-0 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        {ticket.position != null && (
                            <span className="text-xs font-semibold tabular-nums text-slate-700">
                                #{ticket.position}
                            </span>
                        )}
                        <p className="truncate text-sm font-medium text-slate-900">
                            {ticket.student?.name ?? ticket.student?.email}
                        </p>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Joined {formatJoinedAt(ticket.joinedAt)}
                    </p>
                </div>
                
                {time && (
                    <div className="text-xs text-black shrink-0">
                        Session length: {mins}:{secs}
                    </div>
                )}
            </div>

            {action && <div className="shrink-0">{action}</div>}
        </div>
    )
}
