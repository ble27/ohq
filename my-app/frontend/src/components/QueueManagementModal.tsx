import React from 'react';
import type { Queue } from '@shared/types';
import { useState } from 'react'
import axios from 'axios';
import { LuX } from 'react-icons/lu';
import { Button } from './ui/button';

interface QueueManagementModalProps {
    queue: Queue | null
    setIsViewingManagementModal: (value : boolean) => void
}

export const QueueManagementModal = ({ queue, setIsViewingManagementModal } : QueueManagementModalProps) => {
    // Has 3 tabs - Settings, Waitlist (QueueTicketModal), Workspace
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(true);
    const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

    // Save all these settings at once
    const [isQueueOpen, setIsQueueOpen] = useState(queue?.isOpen ?? true);
    const [roomLocation, setRoomLocation] = useState(queue?.location ?? '');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('09:00');

    const handleQueueStatus = async () => {
        if (queue?.isOpen === isQueueOpen) return true;
        try {
            const queueId = queue?.id;
            // API call to queue based on queue id
            const response = await axios.patch(`/api/queues/${queueId}/status/${isQueueOpen}`);
            if (response.status !== 200) {
                console.log('Failed to change queue status');
                return false;
            }
            console.log('Queue status changed to', isQueueOpen);
            return true;
        }
        catch (error) {
            console.log(`Failed to change queue status ${error}`);
            return false;
        }
    }

    const handleChangeRoomLocation = async () => {
        const trimmedLocation = roomLocation.trim();
        if (!trimmedLocation || queue?.location === trimmedLocation) return true;
        try {
            const response = await axios.patch(
                `/api/queues/${queue?.id}/location/${encodeURIComponent(trimmedLocation)}`
            );
            if (response.status !== 200) return false;
            console.log(`SUCCESSFULLY changed queue location to ${trimmedLocation}`);
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }

    const handleOpenQueue = () => {
        // Queue is already closed -> set to open
        if (!isQueueOpen) {
            setIsQueueOpen(true);
        }
    }

    const handleCloseQueue = () => {
        // Queue is already open -> set to close
        if (isQueueOpen) {
            setIsQueueOpen(false);
        }
    }

    const handleSaveChanges = async () => {
        // Check if time is valid
        if (endTime < startTime) {
            console.log('Invalid start and end time.');
            setStartTime('08:00');
            setEndTime('09:00');
            return;
        }

        const trimmedLocation = roomLocation.trim();

        // Call only when location doesn't match new location (API)
        if (trimmedLocation && queue?.location !== trimmedLocation) {
            try {
                const roomResponse = await handleChangeRoomLocation();
                if (!roomResponse) {
                    console.log('Failed to change queue location');
                    return;
                }
                console.log('SUCCESSFULLY CHANGED queue location');
            } catch (error) {
                console.log('Unable to change queue location', error);
                return;
            }
        }
        
        // Change queue status only when queue's original status doesn't equal new status (API)
        if (queue?.isOpen !== isQueueOpen) {
            try {
                const queueResponse = await handleQueueStatus();
                if (!queueResponse) {
                    console.log('Failed to change queue status');
                    return;
                }
                console.log('SUCCESSFULLY CHANGED queue status');
            } catch (error) {
                console.log('Unable to change queue status', error);
                return;
            }
        }
    }

    const handleCancelChanges = () => {
        setIsQueueOpen(queue?.isOpen ?? true);
        setRoomLocation(queue?.location ?? '');
        setStartTime('08:00');
        setEndTime('09:00');
        setIsViewingManagementModal(false);
    }
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center w-screen h-screen gap-3 bg-black/40 text-black z-100">
            <div className='relative bg-white rounded-lg w-[500px] max-w-[700px] h-[684px] max-h-[1000px] overflow-hidden'>
                <nav className='relative flex flex-row pt-5 pl-5 text-lg h-[50px] w-full gap-5'>
                    <div className='flex flex-row justify-between gap-5 w-2/3'>
                        {/* Settings */}
                        <button 
                            className={`${isSettingsOpen ? 'text-black' : 'text-gray-500/70'} hover:opacity-80`}
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
                            className={`${isQueueModalOpen ? 'text-black' : 'text-gray-500/70'} hover:opacity-80`}
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
                            className={`${isWorkspaceOpen ? 'text-black' : 'text-gray-500/70'} hover:opacity-80`}
                            onClick={() => {
                                setIsSettingsOpen(false);
                                setIsQueueModalOpen(false);
                                setIsWorkspaceOpen(true);
                            }}
                        >
                            <span> Workspace </span>
                        </button>
                    </div>
                   
                    <LuX onClick={() => setTimeout(() => setIsViewingManagementModal(false), 100)} className='flex absolute items-center right-3 hover:opacity-80'color='black' size={25}/>
                </nav>

                {/* Settings tab */}
                {isSettingsOpen && <div className='mt-5 pl-5 p-3 w-screen flex flex-col text-lg text-gray-500 h-full gap-10 z-200'>

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
                            className='outline-none text-gray-500 ml-3 w-35'
                            value={roomLocation}
                            onChange={(e) => setRoomLocation(e.target.value)}
                            placeholder="e.g. Room 101"
                        />
                    </div>
                    {/* Start / end time manual configuration */}
                    <div className='flex lfex-row items-center gap-5'>
                        <label htmlFor="start_time">Start:</label>
                       <input 
                        type="time" 
                        onChange={e => {setStartTime(e.target.value)}}
                        value={startTime}
                        className='outline-none'
                        />

                       <label htmlFor="end_time">End: </label>
                       <input 
                        type="time" 
                        onChange={e => {setEndTime(e.target.value)}}
                        value={endTime}
                        className='outline-none'
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
                
            </div>
            
        </div>
    )
}
