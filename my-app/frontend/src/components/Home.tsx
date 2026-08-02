import { useState } from 'react'
import type { QueueTicket } from '@shared/types'

export const Home = () => {
    const [tickets] = useState<QueueTicket | null>(null);
    const [currentDate] = useState(() => new Date());

    const readableDate = currentDate.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    return (
        <>
        <div className='flex flex-col w-full min-h-full ml-8 mt-10 pr-20'>
            <div className='p-3 text-2xl bg-gray-500/10 rounded-full font-semibold'>My Tickets:</div>
            <div className='relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mt-10 pl-3 h-screen'>
                {!tickets ? 'No tickets to display': 'There are tickets'}        
                {/* Ticket */}
                <div className='flex flex-col absolute text-white text-xl bg-red-900 h-60 w-full h-80 sm:w-70 md:w-80 md:h-90 rounded-lg pl-8 pt-6 gap-5'>
                    <div>Date: {readableDate}</div>
                    <div>Ticket ID: </div>
                    <div>Status: </div>
                    <div className='text-white/60 absolute bottom-20'>Location: </div>
                    <div className='text-white/60 absolute bottom-20 right-30'>TA: </div>
                </div>
            </div>
            {/* Tickets info */}
        </div>
        </>
    )
}