import { useState, useEffect } from 'react'
import axios from 'axios'
import type { QueueTicket } from '@shared/types'
import { QueueTicketComp } from './QueueTicketComp'
import { useAuth } from '@/context/AuthContextProvider'
import { LuBell, LuTrash2 } from 'react-icons/lu'

export const Home = () => {
    // Home owns the tickets for the current user
    const [tickets, setTickets] = useState<QueueTicket[]>([]);
    const { user } = useAuth();
    const [isOpenAlert, setIsOpenAlert] = useState(false);

    useEffect(() => {
        const handleActiveTickets = async () => {
            const studentId = user?.id;
            if (!studentId) {
                console.log(`No student id provided`);
                return;
            }
            const response = await axios.get(`/api/queueticket/user/${studentId}`);
            if (!response.data.tickets) {
                console.log(`No tickets fetched from ${studentId}`);
                return;
            }

            setTickets(response.data.tickets);
        };

        void handleActiveTickets();
    }, [user?.id]);

    return (
        <div className="flex min-h-full w-full flex-col px-4 py-8 sm:px-6 md:px-8 lg:pr-12">
            <div className="w-full flex flex-row items-center justify-between p-3 text-xl font-semibold sm:text-2xl">
                My Tickets
                <LuBell 
                    size={'35'}
                    className='hover:opacity-80 hover:rounded-full hover:bg-gray-100 p-2'
                    onClick={() => setIsOpenAlert((prev) => !prev)}    
                />
            </div>

            {/* Modal */}
            {isOpenAlert && <div className='fixed top-20 right-10 lg:right-15 xl:right-20 min-h-0 m-0 
                h-[280px] w-[280px] xl:h-80 xl:w-80 
                z-20 rounded-lg overflow-x-hidden px-4 
                bg-gray-50/20 backdrop-blur-lg border border-black/10 shadow-xl scrollbar-none'>

                <div className='flex flex-row justify-between items-center h-15'>
                    <span className='text-lg font-semibold '>Notifications</span>
                    <span className='text-xs font-normal px-3 py-2 rounded-full bg-gray-200 hover:opacity-80'> Clear all</span>
                </div>
                {/* Student joining alert */}
                <div className='flex h-20 w-full bg-[#E5E5EA] pt-2 pl-2 pr-2 mb-2 rounded-lg 
                    text-sm font-semibold border border-black/10 shadow-xl'>
                    <div className='flex flex-col flex-1'>
                        <span className='flex text-xs text-black/50 justify-end'> 00:00 </span>
                        <span className='font-normal'>Student Name joined your queue</span>
                    </div>
                </div>

                {/* Student leaving alert */}
                <div className='flex h-20 w-full bg-[#C7C7C7] pt-2 pl-2 pr-2 mb-1 rounded-lg
                    text-sm font-semibold border border-black/10 shadow-xl mb-2'>
                    <div className='flex flex-col flex-1'>
                        <span className='flex text-xs text-black/50 justify-end'> 00:00 </span>
                        <span className='font-normal'>Student Name left your queue</span>
                    </div>
                </div>

                {/* TA ready to help alert */}
                <div className='flex h-20 w-full bg-green-600/90 pt-2 pl-2 pr-2 mb-1 rounded-lg shadow-outer shadow-lg 
                    text-sm font-semibold border border-black/10 shadow-xl mb-2'>
                    <div className='flex flex-col flex-1'>
                        <span className='flex text-xs text-black/50 justify-end'> 00:00 </span>
                        <span className='font-normal'>Please head to Location. TA is ready to assist you.</span>
                    </div>
                </div>
                
                {/* Queue is closing in end time - now alert*/}
                <div className='flex h-20 w-full bg-red-600 pt-2 pl-2 pr-2 mb-1 rounded-lg shadow-outer shadow-lg 
                    text-sm font-semibold border border-black/10 shadow-xl mb-2'>
                    <div className='flex flex-col flex-1'>
                        <span className='flex text-xs text-black/50 justify-end'> 00:00 </span>
                        <span className='font-normal'>Queue is closing in 5 mins.</span>
                    </div>
                </div>
            </div>}

            {tickets.length === 0 && (
                <span className="mt-8 flex items-center justify-center px-3 text-center text-sm italic text-gray-500 sm:mt-10 sm:text-base">
                    No active tickets to display, navigate to Class to find live office hour sessions
                </span>
            )}

            <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {tickets.map((ticket) => (
                    <QueueTicketComp key={ticket.id} ticket={ticket} />
                ))}
            </div>
        </div>
    )
}
