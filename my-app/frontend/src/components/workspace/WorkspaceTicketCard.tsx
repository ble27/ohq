import type { ReactNode } from 'react'
import type { QueueTicketWithStudent } from '@shared/types'

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
            className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2.5 sm:gap-3 sm:px-3 sm:py-3 ${accentStyles[accent]}`}
        >
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:gap-4">
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                        {ticket.position != null && (
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-700">
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

                {time != null && time > 0 && (
                    <p className="shrink-0 text-xs tabular-nums text-slate-600">
                        {mins}:{secs}
                    </p>
                )}
            </div>

            {action && <div className="shrink-0">{action}</div>}
        </div>
    )
}
