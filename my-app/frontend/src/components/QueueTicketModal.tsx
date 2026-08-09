import type { QueueTicket, QueueTicketWithStudent } from '../../../shared/types'

interface QueueTicketModalProps {
    // chronological order
    queueTickets: QueueTicketWithStudent[]
}

const formatJoinedAt = (joinedAt: string | Date) => {
    const date = new Date(joinedAt);
    if (Number.isNaN(date.getTime())) return String(joinedAt);

    return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
};

const shortId = (id: string) => id.slice(0, 8);

export const QueueTicketModal = ({ queueTickets }: QueueTicketModalProps) => {
    if (queueTickets.length === 0) return null;

    return (
        <ul className="w-full space-y-2 overflow-y-auto">
            {queueTickets.map((qt) => (
                <li
                    key={qt.id}
                    className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5"
                >
                    <span className="text-sm font-semibold tabular-nums text-gray-900">
                        {qt.position != null ? `#${qt.position}` : '—'}
                    </span>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                            
                            {qt.student?.name ?? qt.student?.email}
                        </p>
                        <p className="text-xs text-gray-500">
                            Joined {formatJoinedAt(qt.joinedAt)}
                        </p>
                    </div>

                    <span className="text-[10px] font-medium uppercase tracking-wide text-black">
                        {qt.status.toLowerCase()}
                    </span>
                </li>
            ))}
        </ul>
    )
}
