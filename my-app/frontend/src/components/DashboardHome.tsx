import { useState, useEffect } from 'react'
import axios from 'axios'
import type { QueueTicket, QueueWithTA } from '@shared/types'
import { QueueTicketComp } from './QueueTicketComp'
import { useAuth } from '@/context/AuthContextProvider'
import { LuBell } from 'react-icons/lu'

const ACTIVE_TICKET_STATUSES = new Set(['WAITING', 'HELPING'])

type HomeTicket = QueueTicket & { queue?: QueueWithTA }

interface HomeProps {
    onToggleNotifications?: () => void
}

export const Home = ({ onToggleNotifications }: HomeProps) => {
    // Home owns the tickets for the current user
    const [tickets, setTickets] = useState<HomeTicket[]>([])
    const { user } = useAuth()

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

            setTickets(
                (response.data.tickets as HomeTicket[]).filter((t) =>
                    ACTIVE_TICKET_STATUSES.has(t.status),
                ),
            )
        }
        void handleActiveTickets()
    }, [user?.id]) // rerun when user.id changes

    const handleLeaveTicket = (ticket: QueueTicket) => {
        setTickets((prev) => prev.filter((t) => t.id !== ticket.id))
    }

    return (
        <div className="flex min-h-full w-full flex-col px-4 py-8 sm:px-6 md:px-8 lg:pr-12">
            <div className="flex w-full flex-row items-center justify-between p-3 text-xl font-semibold sm:text-2xl">
                My Tickets
                <LuBell
                    size={35}
                    className="cursor-pointer p-2 hover:rounded-full hover:bg-gray-100 hover:opacity-80"
                    onClick={onToggleNotifications}
                />
            </div>

            {tickets.length === 0 && (
                <span className="mt-8 flex items-center justify-center px-3 text-center text-sm italic text-gray-500 sm:mt-10 sm:text-base">
                    No active tickets to display, navigate to Class to find live office hour sessions
                </span>
            )}

            {/* 1 col < lg; 2 from lg (~content ≥720px with sidebar); 3 from xl */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {tickets.map((ticket) => (
                    <QueueTicketComp
                        key={ticket.id}
                        ticket={ticket}
                        location={ticket.queue?.location}
                        taName={ticket.queue?.ta?.name ?? ticket.queue?.ta?.email}
                        onLeave={handleLeaveTicket}
                    />
                ))}
            </div>
        </div>
    )
}
