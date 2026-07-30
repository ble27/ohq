// Need to pass in the queue id to know which queue to open the modal
// Only open a queue once a user clicks on join queue
// If a queue is closed, that queue cannot be opened
// a Join creates a QueueTicket into the current queue

import { useEffect, useState } from 'react'
import type { Queue, QueueTicket, QueueTicketResponse, QueueTicketsListResponse } from '../../../shared/types'
import { QueueTicketComp } from './QueueTicketComp';
import axios from 'axios'

interface ModalProps {
    // hasClickedJoin?: boolean | null
    // queueJoinedId?: string | null
    // The current queue
    queue: Queue
    // The list of tickets for this queue
    // queueTickets: QueueTicket[]
    isModalOpen: boolean;
    setModalOpen: (value: boolean) => void;
}

// Local queue for each instance
export const QueueModal = ({ queue, isModalOpen, setModalOpen }: ModalProps) => {
    const [tickets, setTickets] = useState<QueueTicket[]>([]);

    // const curQueue = queues.find((q: Queue) => q.id === queueJoinedId);

    const createTicket = async () => {
        try {
            await axios.post('/api/queueticket', { queueId: queue.id, status: 'WAITING' });
            console.log('Successfully created a new ticket');
        }
        catch (error) {
            console.log(`Failed to create a ticket ${error}`);
        }
    }

    // Need current ticket id
    const deleteTicketById = async (ticketId: string) => {
        try {
            const response = await axios.patch(`/api/queueticket/${ticketId}`, { status: 'LEFT' });
            if (response.status !== 200) {
                console.log('Failed to delete ticket id')
                return;
            }
        }
        catch (error) {
            console.log(`Failed to delete a ticket ${error}`);
        }
    }

    // Fetch tickets by Queue Id whenever the modal is active
    const fetchTicketByQueueId = async (queueId: string) => {
        try {
            // Returns a QueueTicketsListResponse
            const response = await axios.get<QueueTicketsListResponse>(`/api/queueticket/queues/${queueId}`);
            const queueTickets: QueueTicket[] = response.data.tickets;
            setTickets((prevTickets) => [...prevTickets, ...queueTickets]);
        }
        catch (error) {
            console.error('Failed to fetch tickets', error);
        }
    }

    const addTicketByQueueId = async (queueId: string, queueTicketId: string) => {
        try {
            const { data: ticketData } = await axios.get<QueueTicketResponse>(`/api/queueticket/${queueTicketId}`);
            // Add to current queue ticket state
            setTickets((prevTickets) => [...prevTickets, ticketData.ticket]);
        }
        catch (error) {
            console.log(`Failed to add a ticket ${queueTicketId} to queue ${queueId}`, error);
        }
    }

    // Load this queue's tickets whenever the modal is opened for a queue
    useEffect(() => {
        if (!isModalOpen) return;
        fetchTicketByQueueId(queue.id);
    }, [isModalOpen, queue.id]);

    if (!isModalOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            {/* <!-- 1. Backdrop Overlay (This blurs the background) --> */}
            <div onClick={() => setModalOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md"></div>

            {/* <!-- 2. Modal Content Card --> */}
            <div className="relative max-w-md w-full h-[50vh] bg-white rounded-2xl p-6 shadow-xl z-10">
                <h3 className="text-xl font-semibold text-gray-900">Test Queue</h3>

                <p className="mt-2 text-sm text-black">TA's ID: {queue.taId}</p>
                <p className="mt-2 text-sm text-black">Location: {queue.location}</p>

                {/* Real time updates */}
                <p className="mt-2 text-sm text-black">Your position in queue: {1}</p>
                <p className="mt-2 text-sm text-black">Estimated wait time: 10 mins</p>

                <div className="absolute bottom-6 right-6 mt-4 flex justify-end">
                    {/* Queue Ticket Section displaying all the tickets in queue */}
                    {tickets.length !== 0 ? <QueueTicketComp queueTickets={tickets} /> : null}

                    {/* Leave queue */}
                    <div className='flex flex-row gap-4'>
                        <button
                            onClick={() => setModalOpen(false)}
                            // TODO: also call deleteTicketById(myTicketId) once the current
                            // user's ticket id is tracked, so leaving actually removes it
                            className="px-4 py-2 items-end bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                        >
                            Leave
                        </button>
                        <button
                            onClick={() => setModalOpen(false)}
                            className="px-4 py-2 items-end bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
