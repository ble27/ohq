import type { ReactNode } from 'react'
import type { Queue, QueueTicket } from '@shared/types'

export type NotificationAccent = 'join' | 'leave' | 'assist' | 'close'

interface NotificationBannerProps {
    queue?: Queue
    ticket?: QueueTicket
    accent?: NotificationAccent
    time?: number
    message?: string
    action?: ReactNode
}

const accentStyles = {
    join: 'border-blue-400 bg-blue-300',
    leave: 'border-slate-400 bg-slate-300',
    assist: 'border-emerald-400 bg-emerald-300',
    close: 'border-red-500 bg-red-400',
} as const

const defaultMessages: Record<NotificationAccent, string> = {
    join: 'Student Name joined your queue',
    leave: 'Student Name left your queue',
    assist: 'Please head to Location. TA is ready to assist you.',
    close: 'Queue is closing in 5 mins.',
}

const formatTime = (time?: number) => {
    if (time == null) return '00:00'
    const mins = Math.floor(time / 60).toString().padStart(2, '0')
    const secs = (time % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
}

export const NotificationBanner = ({
    accent = 'join',
    time,
    message,
    action,
}: NotificationBannerProps) => {
    return (
        <div
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 ${accentStyles[accent]}`}
        >
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                <p className="min-w-0 text-sm font-normal text-slate-900">
                    {message ?? defaultMessages[accent]}
                </p>
                <span className="shrink-0 text-xs tabular-nums text-slate-500">
                    {formatTime(time)}
                </span>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    )
}
