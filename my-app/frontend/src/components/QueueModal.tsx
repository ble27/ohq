// Need to pass in the queue id to know which queue to open the modal
// Only open a queue once a user clicks on join queue
// If a queue is closed, that queue cannot be opened
// a Join creates a QueueTicket into the current queue

import { useEffect, useState } from 'react'
import type { Queue, QueueTicket, QueueTicketsListResponse } from '../../../shared/types'
import { QueueTicketComp } from './QueueTicketComp';
import axios from 'axios'
import { useSocket } from '@/context/SocketProvider';

interface ModalProps {
    queue: Queue | null
    ticket: QueueTicket | null
    isModalOpen: boolean;
    setModalOpen: (value: boolean) => void;
}

// Local queue for each instance
export const QueueModal = ({ queue, ticket, isModalOpen, setModalOpen }: ModalProps) => {
    // All the tickets for each queue
    const [tickets, setTickets] = useState<QueueTicket[]>([]);
    const [curTicket] = useState<QueueTicket | null>(ticket);

    const socket = useSocket();

    const deleteTicketById = async () => {
        try {
            if (!curTicket) {      
                console.log('No ticket available to delete');
                return;
            }
            const response = await axios.patch(`/api/queueticket/${curTicket.id}`, { status: 'LEFT' });
            if (response.status !== 200) {
                console.log(`Failed to delete ticket ${curTicket.id}`);
                return;
            }
        }
        catch (error) {
            console.log(`Failed to delete a ticket ${error}`);
        }
    }

    // Fetch multiple tickets by queue id
    const fetchMultipleTicketsById = async (queueId: string) => {
        try {
            // Extract from a QueueTicketsListResponse
            const response = await axios.get<QueueTicketsListResponse>(`/api/queueticket/queues/${queueId}`);
            if (response.status !== 200) {
                console.log('Failed to fetch multiple tickets by id')
                return;
            }
            const queueTickets: QueueTicket[] = response.data.tickets;

            // Update state
            setTickets((prevTickets) => [...prevTickets, ...queueTickets]);
            
            return queueTickets;
        }
        catch (error) {
            console.error('Failed to fetch tickets', error);
        }
    }

    // Load this queue's tickets whenever the modal is opened for a queue (Optimize later)
    useEffect(() => {
        if (!isModalOpen || !queue) return;
        
        socket?.emit('join-queue', queue.id);

        // Mount: component loaded into DOM
        let isMounted = true;
        const loadTicketsData = async () => {
            if (isMounted) {
                await fetchMultipleTicketsById(queue?.id);  
            }
        }
        loadTicketsData();

        // Clean up to prevent memory leak
        return () => { isMounted = false; } 
    }, [isModalOpen, queue, socket]);

    if (!isModalOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            {/* Backdrop Overlay */}
            <div onClick={() => setModalOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md"></div>
            
            {/* Modal Content */}
            <div className="relative z-10 flex h-[55vh] w-full max-w-md flex-col rounded-2xl bg-white p-5 shadow-xl">
                <div className="shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">Queue</h3>
                    <p className="mt-1 text-xs text-gray-500">Location: {queue?.location}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                        {/* Joining a queue auto updaets positition  */}
                        Your position: {curTicket ? curTicket.position ?? '—' : '—'}
                    </p>
                </div>

                {/* Ticket list */}
                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                    {tickets.length !== 0 ? (
                        <QueueTicketComp queueTickets={tickets} />
                    ) : (
                        <p className="text-sm text-gray-400">No one in queue yet.</p>
                    )}
                </div>

                {/* Leaving disconnects the socket connection */}
                <div className="mt-3 flex shrink-0 justify-end gap-2">
                    <button
                        onClick={async () => {
                            if (curTicket) {
                                try {
                                    await deleteTicketById();
                                    setModalOpen(false);
                                    socket?.emit('leave-queue', queue?.id);
                                }
                                catch (error) {
                                    console.log('Failed to delete ticket', error);
                                }
                            }
                        }}
                        className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
                    >
                        Leave
                    </button>
                    {/* Closing doesn't leave the queue */}
                    <button
                        onClick={() => setModalOpen(false)}
                        className="rounded-md bg-blue-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-900"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
