import type { Queue, QueueTicket, QueueTicketWithStudent } from '@shared/types';
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios';
import { LuX } from 'react-icons/lu';
import { Button } from './ui/button';
import { QueueTicketModal } from './QueueTicketModal';
import { QueueWorkspace } from './workspace/QueueWorkspace';
import type { NotificationType } from '@shared/types';

interface QueueManagementModalProps {
    queue: Queue | null
    tickets: QueueTicketWithStudent[]
    setTickets: (value: QueueTicket[]) => void
    setIsViewingManagementModal: (value : boolean) => void
    onUpdateQueue: (updated: Queue) => void | Promise<void>
    // remove tickets when closed
    onQueueClosing: () => | Promise<void>
    onTimeChange: (start: string, end: string) => void | Promise<void>
}

export const QueueManagementModal = ({
    queue,
    tickets,
    setTickets,
    onUpdateQueue,
    setIsViewingManagementModal,
    onQueueClosing, 
    onTimeChange,
}: QueueManagementModalProps) => {
    const toTimeInput = (value: Date | string | null | undefined) => {
    if (!value || value === 'null' || value === 'undefined') {
        return '';
    }
    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime()) || date.getTime() === 0) {
        return '';
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
    };

    // Has 3 tabs - Settings, Waitlist (QueueTicketModal), Workspace
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);

    // Save all these settings at once
    const [isQueueOpen, setIsQueueOpen] = useState(queue?.isOpen ?? true);
    const [roomLocation, setRoomLocation] = useState(queue?.location ?? '');
    const [zoomLink, setZoomLink] = useState(queue?.zoomLink ?? '');
    const [startTime, setStartTime] = useState(toTimeInput(queue?.startsAt) ?? '08:00');
    const [endTime, setEndTime] = useState(toTimeInput(queue?.endsAt) ?? '09:00');

    // Every time this refreshes it doesn't sync the state
    const [completedTickets, setCompletedTickets] = useState<QueueTicket[]>([]);

    // SETTINGS
    const handleQueueStatus = async (): Promise<Queue | null> => {
        if (!queue || queue.isOpen === isQueueOpen) return queue;
        try {
            const response = await axios.patch(`/api/queues/${queue.id}/status/${isQueueOpen}`);
            if (response.status !== 200) {
                console.log('Failed to change queue status');
                return null;
            }
            console.log('Queue status changed to', isQueueOpen);
            return response.data.queue as Queue;
        } catch (error) {
            console.log(`Failed to change queue status ${error}`);
            return null;
        }
    }

    const handleChangeRoomLocation = async (): Promise<Queue | null> => {
        const trimmedLocation = roomLocation.trim();
        if (!queue || !trimmedLocation || queue.location === trimmedLocation) return queue;
        try {
            const response = await axios.patch(
                `/api/queues/${queue.id}/location/${encodeURIComponent(trimmedLocation)}`
            );
            if (response.status !== 200) return null;
            console.log(`SUCCESSFULLY changed queue location to ${trimmedLocation}`);
            return response.data.queue as Queue;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    const handleChangeZoomLink = async (): Promise<Queue | null> => {
        const trimmedZoom = zoomLink.trim();
        const nextZoom = trimmedZoom || null;
        if (!queue || (queue.zoomLink ?? null) === nextZoom) return queue;
        try {
            const response = await axios.patch(`/api/queues/${queue.id}/zoomlink`, {
                zoomLink: nextZoom,
            });
            if (response.status !== 200) return null;
            return response.data.queue as Queue;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    const handleOpenQueue = () => {
        // Queue is already closed -> set to open
        if (!isQueueOpen) {
            setIsQueueOpen(true);
            return;
        }
    }

    // When the queue is closed, tickets in the waitlist will be removed (WAITING) 
    // and ticket in session (HELPING)
    // Open delete confirmation modal (later)
    const handleCloseQueue = () => {
        // Queue is already open -> set to close
        if (isQueueOpen) {
            setIsQueueOpen(false);
            return;
        }
    }
   
    const handleSaveChanges = async () => {
        // Time update
        // Compare only HH:MM format not Date format
        if (startTime !== toTimeInput(queue?.startsAt) || endTime !== toTimeInput(queue?.endsAt)) {
            await onTimeChange(startTime, endTime);
        }

        // Location and Room update
        const trimmedLocation = roomLocation.trim();
        let updatedQueue: Queue | null = queue;
        let didUpdate = false;

        // Call only when location doesn't match new location (API)
        if (trimmedLocation && queue?.location !== trimmedLocation) {
            try {
                updatedQueue = await handleChangeRoomLocation();
                if (!updatedQueue) {
                    console.log('Failed to change queue location');
                    return;
                }
                didUpdate = true;
                console.log('SUCCESSFULLY CHANGED queue location');
            } catch (error) {
                console.log('Unable to change queue location', error);
                return;
            }
        }

        const trimmedZoom = zoomLink.trim();
        const nextZoom = trimmedZoom || null;
        if ((queue?.zoomLink ?? null) !== nextZoom) {
            try {
                updatedQueue = await handleChangeZoomLink();
                if (!updatedQueue) {
                    console.log('Failed to change zoom link');
                    return;
                }
                didUpdate = true;
            } catch (error) {
                console.log('Unable to change zoom link', error);
                return;
            }
        }
        
        // Change queue status only when queue's original status doesn't equal new status (API)
        if (queue?.isOpen !== isQueueOpen) {
            try {
                updatedQueue = await handleQueueStatus();
                if (!updatedQueue) {
                    console.log('Failed to change queue status');
                    return;
                }
                didUpdate = true;
                console.log('SUCCESSFULLY CHANGED queue status');

                // Closing queue will delete all active tickets in the queue
                if (!isQueueOpen) {
                    console.log('Calling onQueueClosing here');
                    onQueueClosing();

                }
            } catch (error) {
                console.log('Unable to change queue status', error);
                return;
            }
        }

        // Sync the state call from dashboard here
        if (didUpdate && updatedQueue) {
            await onUpdateQueue(updatedQueue);
        }
        setIsViewingManagementModal(false);
    }

    const handleCancelChanges = () => {
        setIsQueueOpen(queue?.isOpen ?? true);
        setRoomLocation(queue?.location ?? '');
        setZoomLink(queue?.zoomLink ?? '');
        setStartTime(toTimeInput(queue?.startsAt));
        setEndTime(toTimeInput(queue?.endsAt));
        setIsViewingManagementModal(false);
    }

    // WORKSPACE
    // Sync live ticket every time a single ticket transitions state useful for Workspace and Waitlist
    // For WAITING & HELPING tickets
    const refreshActive = useCallback(async () => {
        const queueId = queue?.id;
        if (!queueId) return;
        const response = await axios.get(`/api/queueticket/queues/${queueId}`);   
        // Sync new states includes WAIITNG & HELPING tickets
        setTickets(response.data.tickets);
    }, [queue, setTickets]);

    // Sync completed ticket for queue ID
    // For COMPLETED tickets
    const refreshCompleted = useCallback(async () => {
        try {
            const queueId = queue?.id;
            if (!queueId) return;
            const response = await axios.get(`/api/queueticket/queues/${queueId}/status/completed`);
            setCompletedTickets(response.data.tickets);
        } catch (error) {
            console.log('Failed to fetch completed tickets', error);
        }
    }, [queue]);

    // Notification
    /* 
    This function creates a notification whenever the TA sets the student in session, 
    where the status changes from WAITING to HELPING.
    Sends an alert to the student
    Also need to pass the ticket here
    */
    const createNotificationForInSession = async (studentId: string, type: NotificationType, ticket: QueueTicket) => {
        const queueId = queue?.id;
        // Ticket is optional
        const response = await axios.post(`/api/notifications/queues/${queueId}/user/${studentId}/type/${type}`, 
            { ticketId: ticket.id }
        );
        return response;
    }

    useEffect(() => {
        // Fetch-on-mount: both refresh async data and update state after the network call resolves.
        void refreshActive();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void refreshCompleted();
    }, [refreshActive, refreshCompleted]);

    return (
        <div className="fixed inset-0 z-100 flex h-dvh w-screen flex-col items-center justify-center gap-3 bg-black/40 text-black">
            <div className="relative mx-4 flex h-[684px] max-h-[min(684px,calc(100dvh-5rem))] w-full max-w-[600px] flex-col overflow-hidden rounded-lg bg-white max-sm:mx-3 max-sm:max-h-[calc(100dvh-6rem)]">
                <nav className='flex h-[50px] w-full shrink-0 flex-row items-center gap-3 pt-5 pl-3 pr-3 text-lg sm:gap-5 sm:pl-5'>
                    <div className='flex min-w-0 flex-1 flex-row items-center gap-8 sm:gap-10'>
                        {/* Settings */}
                        <button 
                            className={`${isSettingsOpen ? 'text-black' : 'text-gray-500/70'} shrink-0 hover:opacity-80`}
                            onClick={() => {
                                setIsSettingsOpen(true);
                                setIsQueueModalOpen(false);
                                setIsWorkspaceOpen(false);
                            }}
                        >
                            <span> Settings </span>
                        </button>

                        {/* Waitlist */}
                        <button 
                            className={`${isQueueModalOpen ? 'text-black' : 'text-gray-500/70'} shrink-0 hover:opacity-80`}
                            onClick={() => {
                                setIsSettingsOpen(false);
                                setIsQueueModalOpen(true);
                                setIsWorkspaceOpen(false);
                            }}
                        >
                            <span> Waitlist </span>
                        </button>

                        {/* Workspace */}
                        <button 
                            className={`${isWorkspaceOpen ? 'text-black' : 'text-gray-500/70'} shrink-0 hover:opacity-80`}
                            onClick={() => {
                                setIsSettingsOpen(false);
                                setIsQueueModalOpen(false);
                                setIsWorkspaceOpen(true);
                            }}
                        >
                            <span> Workspace </span>
                        </button>
                    </div>

                    <LuX onClick={() => setTimeout(() => setIsViewingManagementModal(false), 100)} className='flex shrink-0 items-center hover:opacity-80' color='black' size={25}/>
                </nav>

                {/* Settings tab */}
                {isSettingsOpen && <div className='mt-5 flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto p-3 pb-20 pl-5 text-lg text-gray-500'>

                    {/* Open / Close queue */}
                    <div className='flex flex-row gap-5 items-center'>
                        Queue Status:
                        
                        <div className="flex items-center space-x-5">
                            <button
                                className={`${isQueueOpen ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-500/20 text-white hover:bg-gray-500/50'} font-semibold text-sm px-2 py-1 rounded-lg`}
                                onClick={handleOpenQueue}
                            >
                                OPEN
                            </button>

                            <button
                                className={`${!isQueueOpen ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-500/20 text-white hover:bg-gray-500/50'} font-semibold text-sm px-2 py-1 rounded-lg`}
                                onClick={handleCloseQueue}
                            >
                                CLOSED
                            </button>
                            

                        </div>
                    </div>


                    {/* Change room location  */}
                    <div className='flex flex-row items-center'>
                        <label htmlFor="room_location">Current Room Location: </label>
                        <input
                            type="text"
                            id="room_location"
                            className='text-gray-500 ml-3 w-35'
                            value={roomLocation}
                            onChange={(e) => setRoomLocation(e.target.value)}
                            placeholder="e.g. Room 101"
                        />
                    </div>

                    {/* Optional Zoom / remote link */}
                    <div className='flex flex-row items-center'>
                        <label htmlFor="zoom_link">Zoom link: </label>
                        <input
                            type="url"
                            id="zoom_link"
                            className=' text-gray-500 ml-3 min-w-0 flex-1 max-w-90 overflow-x-auto'
                            value={zoomLink}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === " " || value.startsWith("https://zoom.us/")) {
                                    setZoomLink(e.target.value)
                                }
                            }}
                            placeholder="https://zoom.us/j/… (optional)"
                        />
                    </div>
                    {/* Start / end time manual configuration */}
                    <div className='flex lfex-row items-center gap-5'>
                        <label htmlFor="start_time">Start:</label>
                        <input 
                            type="time" 
                            onChange={e => {setStartTime(e.target.value)}}
                            value={startTime}
                            />

                        <label htmlFor="end_time">End: </label>
                        <input 
                            type="time" 
                            onChange={e => {setEndTime(e.target.value)}}
                            value={endTime}
                            />
                    </div>

                    <div className='flex flex-row absolute bottom-5 right-5 gap-3'>
                        {/* Save changes*/}
                        <Button
                            onClick={handleSaveChanges}
                        >
                            Save
                        </Button>
                        {/* Cancel */}
                        <Button
                            className='bg-gray-200 text-black hover:bg-gray-300'
                            onClick={handleCancelChanges}    
                        >
                            Cancel
                        </Button>
                    </div>
                </div>}
                
                {/* Waitlist */}
                {isQueueModalOpen && (
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5">
                        {tickets.length > 0 
                            ? <QueueTicketModal queueTickets={tickets} queue={queue} /> 
                            : 'No tickets in the waitlist'}
                    </div>
                )}

                {/* Keep Workspace mounted so the session timer survives tab switches */}
                <div className={isWorkspaceOpen ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
                    <QueueWorkspace
                        queue={queue}
                        tickets={tickets}
                        onUpdateTickets={refreshActive}
                        completedTickets={completedTickets}
                        onUpdateCompleted={refreshCompleted}
                        onNotifyInSession={createNotificationForInSession}
                    />
                </div>
            </div>
            
        </div>
    )
}
