import type { ReactNode } from 'react'
import type { NotificationType, QueueTicketWithStudent, QueueWithTA } from '@shared/types'
import { getSafeZoomLink } from '@/lib/utils'

interface NotificationBannerProps {
    queue: QueueWithTA | null
    ticket?: QueueTicketWithStudent | null
    type: NotificationType
    time?: Date | string // when the notification was created
    message?: string
    action?: ReactNode
}

const formatCreatedAt = (time?: Date | string) => {
    if (!time) return ''
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const NotificationBanner = ({
    queue,
    ticket,
    type,
    time,
    message,
    action,
}: NotificationBannerProps) => {
    const accentStyles: Record<NotificationType, string> = {
        JOIN: 'border-blue-400 bg-blue-300',
        LEAVE: 'border-slate-400 bg-slate-300',
        ASSIST: 'border-emerald-400 bg-emerald-300',
        CLOSE: 'border-red-500 bg-red-400',
    }

    const safeZoomLink = getSafeZoomLink(queue?.zoomLink)
    const defaultMessages: Record<NotificationType, string> = {
        JOIN: `Student ${ticket?.student?.name} joined your queue`,
        LEAVE: `Student ${ticket?.student?.name} left your queue`,
        ASSIST: `Please head to ${queue?.location}${safeZoomLink ? ' or join Zoom (see queue details)' : ''}. TA ${queue?.ta?.name} is ready to assist you.`,
        CLOSE: 'Queue is closing in 5 mins.',
    }

    return (
        <div
            className={`flex w-full shrink-0 items-start gap-3 rounded-xl border px-3.5 py-3.5 ${accentStyles[type]}`}
        >
            <p className="min-w-0 flex-1 text-sm leading-snug font-normal text-slate-900">
                {message ?? defaultMessages[type]}
            </p>
            <span className="shrink-0 text-xs tabular-nums text-slate-500">
                {formatCreatedAt(time)}
            </span>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    )
}
