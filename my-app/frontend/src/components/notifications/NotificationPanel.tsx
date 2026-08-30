import type { NotificationWithDetails } from '@shared/types'
import { NotificationBanner } from './NotificationBanner'

interface NotificationPanelProps {
    notifications: NotificationWithDetails[]
    onClearAll?: () => void
}

export const NotificationPanel = ({
    notifications,
    onClearAll,
}: NotificationPanelProps) => {
    // GET method uses include to get both ticket and queue so each notification can access
    // notification.ticket and notification.queue
    return (
        <div
            className="absolute top-full right-4 z-40 mt-2 flex h-[min(320px,60dvh)] w-[min(320px,calc(100vw-1.5rem))] min-h-0 flex-col overflow-x-hidden overflow-y-auto
                rounded-lg border border-black/20 bg-white px-4 shadow-xl backdrop-blur-lg
                xl:h-96 xl:w-96"
        >
            <div className="sticky top-0 z-10 flex h-14 shrink-0 flex-row items-center justify-between bg-white/95 backdrop-blur-lg">
                <span className="text-lg font-semibold">Notifications</span>
                <button
                    type="button"
                    onClick={onClearAll}
                    className="rounded-full bg-gray-200 px-3 py-2 text-xs font-normal hover:opacity-80"
                >
                    Clear all
                </button>
            </div>

            <div className="flex flex-col gap-3 pb-4">
                {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-500">
                        No notifications yet
                    </p>
                ) : (
                    notifications.map((item) => (
                        <NotificationBanner
                            key={item.id}
                            queue={item.queue}
                            ticket={item.ticket}
                            time={item.createdAt}
                            type={item.type}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
