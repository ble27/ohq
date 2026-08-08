import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import type { QueueTicket } from '@shared/types'
import { QueueTicketComp } from './QueueTicketComp'
import { useAuth } from '@/context/AuthContextProvider'
import { LuBell } from 'react-icons/lu'
import { NotificationPanel } from './notifications/NotificationPanel'
import type { NotificationWithDetails } from '@shared/types'

export const Home = () => {
    // Home owns the tickets for the current user
    const [tickets, setTickets] = useState<QueueTicket[]>([])
    const { user } = useAuth()
    const [isOpenAlert, setIsOpenAlert] = useState(false)
    const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);

    useEffect(() => {
        const handleActiveTickets = async () => {
            const studentId = user?.id
            if (!studentId) {
                console.log(`No student id provided`)
                return
            }
            const response = await axios.get(`/api/queueticket/user/${studentId}`)
            if (!response.data.tickets) {
                console.log(`No tickets fetched from ${studentId}`)
                return
            }

            setTickets(response.data.tickets)
        }
        void handleActiveTickets()
    }, [user?.id]) // rerun when user.id changes
    
    // Notifications
    // Require a resync to fetch notifications in real time due to not updating
    // useCallback recreate the function when the dep array changes
     const refreshNotifications = useCallback(async (): Promise<NotificationWithDetails[]> => {
        const response = await axios.get(`/api/notifications/user/${user?.id}`);
        const notifications: NotificationWithDetails[] = response.data.notifications;
        setNotifications(notifications);
        return notifications;
    }, [user?.id])

    const clearAllNotifications = async () => {
        // /api/notifications/user/:userId
        console.log('Calling clearAllNotis');
        const userId = user?.id;
        const response = await axios.delete(`/api/notifications/user/${userId}`);

        // Sync new state
        await refreshNotifications();

        return response;
    }

    // useEffect executes the function from useCallback
    useEffect(() => {
        void refreshNotifications();
    }, [refreshNotifications]) // run once on mount

    return (
        <div className="flex min-h-full w-full flex-col px-4 py-8 sm:px-6 md:px-8 lg:pr-12">
            <div className="flex w-full flex-row items-center justify-between p-3 text-xl font-semibold sm:text-2xl">
                My Tickets
                <LuBell
                    size={35}
                    className="p-2 hover:rounded-full hover:bg-gray-100 hover:opacity-80"
                    onClick={() => setIsOpenAlert((prev) => !prev)}
                />
            </div>

            {/* Notis */}
            {/* Panel accepts notification array and clearAll callback */}
            {/* Banner accepts queue, ticket, time, type, message, action */}
            {isOpenAlert && <NotificationPanel notifications={notifications} onClearAll={clearAllNotifications}/>}

            {tickets.length === 0 && (
                <span className="mt-8 flex items-center justify-center px-3 text-center text-sm italic text-gray-500 sm:mt-10 sm:text-base">
                    No active tickets to display, navigate to Class to find live office hour sessions
                </span>
            )}

            <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {tickets.map((ticket) => (
                    <QueueTicketComp key={ticket.id} ticket={ticket} />
                ))}
            </div>
        </div>
    )
}
