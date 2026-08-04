// Need to pass in the queue id to know which queue to open the modal
// Only open a queue once a user clicks on join queue
// If a queue is closed, that queue cannot be opened
// a Join creates a QueueTicket into the current queue

import { useEffect, useState } from 'react'
import type { Queue, QueueTicket, QueueTicketsListResponse } from '../../../shared/types'
import { QueueTicketModal } from './QueueTicketModal';
import axios from 'axios'
import { useSocket } from '@/context/SocketProvider';

interface ModalProps {
    queue: Queue
    ticket: QueueTicket | null
    isModalOpen: boolean;
    isViewingQueue: boolean;
    joinedQueueIds: Set<string>
    setModalOpen: (value: boolean) => void;
    onLeaveQueue: (queueId: string) => void;
}

// Local queue for each instance
export const QueueModal = ({
    queue,
    ticket,
    isModalOpen,
    isViewingQueue,
    joinedQueueIds,
    setModalOpen,
    onLeaveQueue,
}: ModalProps) => {
    // All the tickets for each queue
    const [tickets, setTickets] = useState<QueueTicket[]>([]);
    const curTicket = ticket;

    const socket = useSocket();

    const deleteTicketById = async () => {
        try {
            if (!curTicket) {      
                console.log('No ticket available to delete');
                return;
            }
            const response = await axios.delete(`/api/queueticket/${curTicket.id}`);
            // previouslly call patch
            // const response = await axios.patch(`/api/queueticket/${curTicket.id}`, { status: 'LEFT' });
            if (response.status !== 200) {
                console.log(`Failed to delete ticket ${curTicket.id}`);
                return;
            }
        }
        catch (error) {
            console.log(`Failed to delete a ticket ${error}`);
        }
    }

    // Load the current list and subscribe to future updates for this queue.
    useEffect(() => {
        if (!isModalOpen || !queue) return;

        const queueId = queue.id;
        let cancelled = false;
        const handleQueueUpdate = (updatedTickets: QueueTicket[]) => {
            if (!cancelled) {
                setTickets(updatedTickets);
            }
        };
        const handleQueueError = (error: { event: string; message: string }) => {
            console.error(`Queue socket error during ${error.event}: ${error.message}`);
        };

        socket?.on('queue-updated', handleQueueUpdate);
        socket?.on('queue-error', handleQueueError);
        socket?.emit('watch-queue', queueId);

        const loadTickets = async () => {
            try {
                const response = await axios.get<QueueTicketsListResponse>(
                    `/api/queueticket/queues/${queueId}`,
                );
                if (!cancelled) {
                    setTickets(response.data.tickets);
                }
            } catch (error) {
                console.error('Failed to fetch tickets', error);
            }
        };
        void loadTickets();

        return () => {
            cancelled = true;
            socket?.emit('unwatch-queue', queueId);
            socket?.off('queue-updated', handleQueueUpdate);
            socket?.off('queue-error', handleQueueError);
        };
    }, [isModalOpen, queue, socket]);

    if (!isModalOpen) return null;

    const hasJoined = joinedQueueIds.has(queue.id);

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            {/* Backdrop Overlay */}
            <div onClick={() => setModalOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md"></div>
            
            {/* Modal Content */}
            <div className="relative z-10 flex h-[55vh] w-full max-w-md flex-col rounded-2xl bg-white p-5 shadow-xl">
                <div className="shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">Queue</h3>
                    <p className="mt-1 text-xs text-gray-500">Location: {queue.location}</p>
                    {!isViewingQueue && (
                        <p className="mt-0.5 text-xs text-gray-500">
                            Your position: {curTicket ? curTicket.position ?? '—' : '—'}
                        </p>
                    )}
                </div>

                {/* Ticket list */}
                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                    {tickets.length !== 0 ? (
                        <QueueTicketModal queueTickets={tickets} />
                    ) : (
                        <p className="text-sm text-gray-400">No one in queue yet.</p>
                    )}
                </div>

                {/* Leaving disconnects the socket connection */}
                <div className="mt-3 flex shrink-0 justify-end gap-2">
                    {/* Show Leave when the user has already joined this queue (join or view) */}
                    {hasJoined && (
                        <button
                            onClick={async () => {
                                if (!curTicket) {
                                    console.log('No ticket available to delete');
                                    return;
                                }
                                try {
                                    await deleteTicketById();
                                    socket?.emit('refresh-queue', queue.id);
                                    onLeaveQueue(queue.id);
                                }
                                catch (error) {
                                    console.log('Failed to delete ticket', error);
                                }
                            }}
                            className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
                        >
                            Leave
                        </button>
                    )}
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
