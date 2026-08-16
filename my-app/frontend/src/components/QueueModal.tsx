// Need to pass in the queue id to know which queue to open the modal
// Only open a queue once a user clicks on join queue
// If a queue is closed, that queue cannot be opened
// a Join creates a QueueTicket into the current queue

import { useEffect, useState } from 'react'
import type { Queue, QueueTicketsListResponse } from '../../../shared/types'
import { QueueTicketModal } from './QueueTicketModal';
import type { QueueTicketWithStudent } from '../../../shared/types';
import axios from 'axios'
import { useSocket } from '@/context/SocketProvider';

interface ModalProps {
    queue: Queue
    ticket: QueueTicketWithStudent | null
    isModalOpen: boolean;
    isViewingQueue: boolean;
    joinedQueueIds: Set<string>
    setModalOpen: (value: boolean) => void;
    onLeaveQueue: (queueId: string) => void | Promise<void>;
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
    const [tickets, setTickets] = useState<QueueTicketWithStudent[]>([]);
    const curTicket = ticket;

    const socket = useSocket();

    // Soft leave — keep the ticket row (status LEFT) so LEAVE notifications can still include it
    const leaveTicketById = async () => {
        try {
            if (!curTicket) {
                console.log('No ticket available to leave');
                return;
            }
            const response = await axios.patch(`/api/queueticket/${curTicket.id}`, {
                status: 'LEFT',
            });
            if (response.status !== 200) {
                console.log(`Failed to leave ticket ${curTicket.id}`);
                return;
            }
        } catch (error) {
            console.log(`Failed to leave ticket ${error}`);
            throw error;
        }
    }

    // Load the current list and subscribe to future updates for this queue.
    useEffect(() => {
        if (!isModalOpen || !queue) return;

        const queueId = queue.id;
        let cancelled = false;
        const handleQueueUpdate = (updatedTickets: QueueTicketWithStudent[]) => {
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
                        <QueueTicketModal queueTickets={tickets} queue={queue}/>
                    ) : (
                        <p className="text-sm text-gray-400">No one in queue yet.</p>
                    )}
                </div>

                {/* Leaving disconnects the socket connection */}
                <div className="mt-4 flex shrink-0 flex-wrap justify-end gap-2">
                    {/* Show Leave when the user has already joined this queue (join or view) */}
                    {hasJoined && (
                        <button
                            type="button"
                            onClick={async () => {
                                if (!curTicket) {
                                    console.log('No ticket available to leave');
                                    return;
                                }
                                try {
                                    // Notify while ticket still exists, then soft-leave (LEFT)
                                    await onLeaveQueue(queue.id);
                                    await leaveTicketById();
                                    socket?.emit('refresh-queue', queue.id);
                                } catch (error) {
                                    console.log('Failed to leave queue', error);
                                }
                            }}
                            className="min-h-9 rounded-full border border-red-500 bg-white px-4 py-2 text-sm font-medium text-red-600 transition duration-100 ease-in-out hover:bg-red-500 hover:text-white"
                        >
                            Leave
                        </button>
                    )}
                    {/* Closing doesn't leave the queue */}
                    <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        className="min-h-9 rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition duration-100 ease-in-out hover:bg-neutral-800"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
