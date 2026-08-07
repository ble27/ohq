import { useState, useEffect } from 'react'
import axios from 'axios'
import type { QueueTicket } from '@shared/types'
import { QueueTicketComp } from './QueueTicketComp'
import { useAuth } from '@/context/AuthContextProvider'

export const Home = () => {
    // Home owns the tickets for the current user
    const [tickets, setTickets] = useState<QueueTicket[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        const handleActiveTickets = async () => {
            const studentId = user?.id;
            if (!studentId) {
                console.log(`No student id provided`);
                return;
            }
            const response = await axios.get(`/api/queueticket/user/${studentId}`);
            if (!response.data.tickets) {
                console.log(`No tickets fetched from ${studentId}`);
                return;
            }

            setTickets(response.data.tickets);
        };

        void handleActiveTickets();
    }, [user?.id]);

    return (
        <div className="flex min-h-full w-full flex-col px-4 py-8 sm:px-6 md:px-8 lg:pr-12">
            <div className="w-fit rounded-full bg-gray-500/20 p-3 text-xl font-semibold sm:text-2xl">
                My Tickets
            </div>

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
