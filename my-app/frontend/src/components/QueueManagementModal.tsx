import React from 'react';
import type { Queue } from '@shared/types';
import { useState } from 'react'
import axios from 'axios';
import { LuX } from 'react-icons/lu';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface QueueManagementModalProps {
    queue: Queue | null
    setIsViewingManagementModal: (value : boolean) => void
}

export const QueueManagementModal = ({ queue, setIsViewingManagementModal } : QueueManagementModalProps) => {
    // Has 3 tabs - Settings, Waitlist (QueueTicketModal), Workspace
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(true);
    const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

    const handleQueueStatus = async () => {
        try {
            const queueId = queue?.id as string;
            // API call to queue based on queue id
            const response = await axios.patch(`/api/queues/${queueId}/${!queue?.isOpen}`);
            if (response.status !== 200) {
                console.log('Failed to change queue status');
                return false;
            }
            console.log('Queue status changed to', queue?.isOpen);
            return true;
        }
        catch (error) {
            console.log(`Failed to change queue status ${error}`);
            return false;
        }
    }

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center w-screen h-screen gap-3 bg-slate-300 text-black z-100">
            <div className='bg-white rounded-lg w-screen max-w-[684px] h-[684px] max-h-[1000px] overflow-hidden'>
                <nav className='relative flex flex-row pt-5 pl-5 text-xl h-[50px] w-full gap-5'>
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
                <div className='mt-5 pl-5 p-3 flex flex-col text-lg text-gray-500 h-full gap-10'>

                    {/* Open / Close queue */}
                    <div className='flex flex-row gap-10 items-center'>
                        Queue Status:
                        
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="status-toggle" 
                                checked={queue?.isOpen}
                                onCheckedChange={handleQueueStatus}
                            />
                            <Label htmlFor="status-toggle" className={`font-semibold ${queue?.isOpen ? 'text-green-500' : 'text-red-500'}`}>
                                {queue?.isOpen ? "Open" : "Closed"}
                            </Label>

                        </div>
                    </div>


                    {/* Change room location  */}
                    <div className=''>
                        Room Location: {queue?.location}
                        
                    </div>
                    {/* Start / end time manual configuration */}
                    <div >
                       
                    </div>


                </div>
            </div>
            
        </div>
    )
}
