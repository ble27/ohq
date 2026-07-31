// Need to pass in the queue id to know which queue to open the modal
// Only open a queue once a user clicks on join queue
// If a queue is closed, that queue cannot be opened
// a Join creates a QueueTicket into the current queue

import { useEffect, useState } from 'react'
import type { Queue, QueueTicket, QueueTicketResponse, QueueTicketsListResponse } from '../../../shared/types'
import { QueueTicketComp } from './QueueTicketComp';
import axios from 'axios'

interface ModalProps {
    queue: Queue | null
    ticket: QueueTicket | null
    ticketId: string | null
    isModalOpen: boolean;
    setModalOpen: (value: boolean) => void;
}

// Local queue for each instance
export const QueueModal = ({ queue, ticket, ticketId, isModalOpen, setModalOpen }: ModalProps) => {
    // All the tickets for each queue
    const [tickets, setTickets] = useState<QueueTicket[]>([]);
    const [curTicket, setCurTicket] = useState<QueueTicket | null>(ticket);

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

    // Fetch single ticket by ticket id passed from prop
    const fetchSingleTicketById = async (ticketId: string) => {
        try {
            if (!ticketId) {
                console.log('Missing required student and queue ID parameters');
                return;
            }

            const response  = await axios.get<QueueTicketResponse>(`/api/queueticket/${ticketId}`);
            if (response.status !== 200) {
                console.log('Failed to fetch ticket by id');
                return;
            }
            const queueTicket: QueueTicket = response.data.ticket;
            setCurTicket(queueTicket);

            // Return the actual ticket
            return queueTicket;
        }
        catch (error) {
            console.error(`Failed to fetch ticket with id ${ticketId}`, error);
        }
    }

    // Load this queue's tickets whenever the modal is opened for a queue (Optimize later)
    useEffect(() => {
        if (!isModalOpen || !queue) return;
        
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
    }, [isModalOpen, queue?.id]);

    if (!isModalOpen) return null;
    
    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            {/* <!-- 1. Backdrop Overlay (This blurs the background) --> */}
            <div onClick={() => setModalOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md"></div>

            {/* <!-- 2. Modal Content Card --> */}
            <div className="relative max-w-md w-full h-[50vh] bg-white rounded-2xl p-6 shadow-xl z-10">
                <h3 className="text-xl font-semibold text-gray-900">Test Queue</h3>

                <p className="mt-2 text-sm text-black">TA's ID: {queue?.taId}</p>
                <p className="mt-2 text-sm text-black">Location: {queue?.location}</p>

                {/* Real time updates */}
                <p className="mt-2 text-sm text-black">Your position in queue: {1}</p>
                <p className="mt-2 text-sm text-black">Estimated wait time: 10 mins</p>

                <div className="absolute bottom-6 right-6 mt-4 flex justify-end">
                    {/* Queue Ticket Section displaying all the tickets in queue */}
                    {tickets.length !== 0 ? <QueueTicketComp queueTickets={tickets} /> : null}

                    {/* Leave queue */}
                    <div className='flex flex-row gap-4'>
                        <button
                            onClick={ async () => {
                                if (curTicket) {
                                    try {
                                        deleteTicketById();
                                        setModalOpen(false);
                                    }
                                    catch (error) {
                                        console.log('Failed to delete ticket', error);
                                    }
                                }
                            }}
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
