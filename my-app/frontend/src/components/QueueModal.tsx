// Need to pass in the queue id to know which queue to open the modal
// Only open a queue once a user clicks on join queue
// If a queue is closed, that queue cannot be opened
// a Join creates a QueueTicket into the current queue

import React, { useState } from 'react'
import type { Queue } from '../../../shared/types'

interface ModalProps {
    // hasClickedJoin?: boolean | null
    // queueJoinedId?: string | null
    queue: Queue
    isModalOpen : boolean; 
    setModalOpen: (value: boolean) => void; 
}

export const QueueModal = ({ queue, isModalOpen, setModalOpen }: ModalProps) => {
    // const curQueue = queues.find((q: Queue) => q.id === queueJoinedId);
    if (!isModalOpen) return null;

    // Need current ticket id
    const deleteTicket = async () => {
        axios.patch('/api/id')
    }
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

                {/* Leave queue */}
                <div className='flex flex-row gap-4'>
                    <button onClick={() => (
                        // Close modal
                        setModalOpen(false))
                        // Delete the ticket

                        } className="px-4 py-2 items-end bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                        Leave
                    </button>
                    <button onClick={() => setModalOpen(false)} className="px-4 py-2 items-end bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        Close
                    </button>
                    </div>
                </div>
            </div>

        </div>
  )
}
