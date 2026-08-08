import type { Notification } from '@shared/types'
import { NotificationBanner } from './NotificationBanner'

interface NotificationPanelProps {
    notifications?: Notification[]
    onClearAll?: () => void
}

const placeholderNotifications: Notification[] = [
    {
        id: '1',
        userId: '',
        type: 'JOIN',
        queueId: '',
        ticketId: null,
        createdAt: new Date(),
        readAt: null,
        clearedAt: null,
    },
    {
        id: '2',
        userId: '',
        type: 'LEAVE',
        queueId: '',
        ticketId: null,
        createdAt: new Date(),
        readAt: null,
        clearedAt: null,
    },
    {
        id: '3',
        userId: '',
        type: 'ASSIST',
        queueId: '',
        ticketId: null,
        createdAt: new Date(),
        readAt: null,
        clearedAt: null,
    },
    {
        id: '4',
        userId: '',
        type: 'CLOSE',
        queueId: '',
        ticketId: null,
        createdAt: new Date(),
        readAt: null,
        clearedAt: null,
    },
]

export const NotificationPanel = ({
    notifications = placeholderNotifications,
    onClearAll,
}: NotificationPanelProps) => {
    return (
        <div
            className="fixed top-20 right-10 z-20 m-0 h-[280px] w-[280px] min-h-0 overflow-x-hidden
                rounded-lg border border-black/10 bg-gray-50/20 px-4 shadow-xl backdrop-blur-lg
                scrollbar-none lg:right-15 xl:right-20 xl:h-80 xl:w-80"
        >
            <div className="flex h-15 flex-row items-center justify-between">
                <span className="text-lg font-semibold">Notifications</span>
                <button
                    type="button"
                    onClick={onClearAll}
                    className="rounded-full bg-gray-200 px-3 py-2 text-xs font-normal hover:opacity-80"
                >
                    Clear all
                </button>
            </div>

            <div className="flex flex-col gap-2 pb-3">
                {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-500">
                        No notifications yet
                    </p>
                ) : (
                    notifications.map((item) => (
                        <NotificationBanner
                            key={item.id}
                            type={item.type}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
