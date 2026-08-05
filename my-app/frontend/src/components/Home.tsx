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
        <>
        {/* Ticket header */}
        <div className='flex flex-col w-full min-h-full ml-8 mt-10 pr-20 bg-b'>
            <div className='p-3 text-2xl bg-gray-500/20 rounded-full font-semibold'>My Tickets:</div>
            {tickets.length === 0 && <span className='italic h-100 flex items-center justify-center mt-5 text-gray-500 ml-3'>No active tickets to display</span>}
            <div className='relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-10 pl-3 min-h-screen'> 
            {tickets.map((ticket) => (
                <QueueTicketComp key={ticket.id} ticket={ticket}/>
            ))}
            </div> 
        </div>
        </>
    )
}
