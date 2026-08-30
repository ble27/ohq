import { useState, useEffect } from 'react'
import axios from 'axios'
import type { QueueTicket, QueueWithTA } from '@shared/types'
import { QueueTicketComp } from './QueueTicketComp'
import { useAuth } from '@/context/AuthContextProvider'

const ACTIVE_TICKET_STATUSES = new Set(['WAITING', 'HELPING'])

type HomeTicket = QueueTicket & { queue?: QueueWithTA }

export const Home = () => {
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
        <div className="flex min-h-full w-full flex-col bg-white px-4 pb-8 pt-3 sm:px-6 sm:pb-8 md:px-8">
            <div className="mx-auto w-full max-w-5xl">
            <div className="flex w-full flex-row items-center p-2 text-xl font-semibold sm:text-2xl">
                My Tickets
            </div>

            {tickets.length === 0 && (
                <span className="mt-8 flex items-center h-full justify-center px-3 text-center text-sm italic text-gray-500 sm:mt-10 sm:text-base">
                    No active tickets to display, navigate to Class to find live office hour sessions
                </span>
            )}

            {/* 1 col on small screens; 2 cols from lg so each ticket has enough room for full details */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:gap-6 lg:grid-cols-2">
                {tickets.map((ticket) => (
                    <QueueTicketComp
                        key={ticket.id}
                        ticket={ticket}
                        location={ticket.queue?.location}
                        zoomLink={ticket.queue?.zoomLink}
                        taName={ticket.queue?.ta?.name ?? ticket.queue?.ta?.email}
                        onLeave={handleLeaveTicket}
                    />
                ))}
            </div>
            </div>
        </div>
    )
}
