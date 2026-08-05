import { useState, useEffect } from 'react'
import type { QueueTicket } from '../../../shared/types'
import axios from 'axios'

interface QueueTicketProps {
    ticket: QueueTicket
    location?: string
    taName?: string
}

const formatJoinedAt = (joinedAt: string | Date) => {
    const date = new Date(joinedAt);
    if (Number.isNaN(date.getTime())) return String(joinedAt);

    return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

const shortId = (id: string) => id.slice(0, 8);


export const QueueTicketComp = ({ ticket }: QueueTicketProps) => {
    const [currentDate] = useState(() => new Date());
    const readableDate = currentDate.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
    const [location, setLocation] = useState('');

    // replace with taname currently using taId
    const [taName, setTaName] = useState('');

    useEffect(() => {
            const fetchNameLocationFromQueueID = async () => {
            const queueId: string = ticket.queueId;
            const response = await axios.get(`/api/queues/${queueId}`);
            if (!response) {
                console.log(`No queue fetched back from fetchNameLocationFromQueueID`);
                return;
            }
            setLocation(response.data.queue.location as string);
            setTaName(response.data.queue.taId as string);
            console.log(`Successfully fetched Location and TA Id`);
        }
        fetchNameLocationFromQueueID();
    }, []);
    
    return (
        <div className='relative flex flex-col text-white text-xl bg-red-950/90 border border-white/15 h-80 w-full sm:w-70 md:w-80 rounded-2xl p-6 justify-between overflow-hidden'>
            {/* Subtle internal maroon glow tint */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-500 rounded-lg blur-3xl pointer-events-none"></div>
            <div className="absolute -top-20 -left-20 w-25 h-25 bg-white/30 rounded-lg blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-500 rounded-lg blur-3xl pointer-events-none"></div>
            <div className="absolute -top-20 -right-20 w-32 h-32 bg-black rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-15 -left-15 w-32 h-32 bg-black rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Content */}
            <div className='flex flex-col gap-4 relative z-10'>
                <div>Date: {formatJoinedAt(ticket.joinedAt) || readableDate}</div>
                <div>Ticket ID: {shortId(ticket.id)}</div>
                <div>Status: {ticket.status}</div>
                <div className='text-gray-50/50'>Location: {location ?? '—'}</div>
                <div className='text-gray-50/50'>TA: {taName ?? '—'}</div>
            </div>
        </div>
    )
}
