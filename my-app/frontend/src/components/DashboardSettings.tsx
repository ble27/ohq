import { useState } from "react" 
import { useAuth } from "@/context/AuthContextProvider"

export const DashboardSettings = () => {
    const { user, prismaUser } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [studentAlertQueueClosing, setStudentAlertQueueClosing] = useState(true)
    const [studentAlertYourTurn, setStudentAlertYourTurn] = useState(true)
    const [taAlertStudentJoinQueue, setTaAlertStudentJoinQueue] = useState(true)
    const [taAlertStudentLeaveQueue, setTaAlertStudentLeaveQueue] = useState(true)


    const handleDeleteAccount = async () => {

    }
    const handleSignout = async () => {

    }
    return (
        <>
            <div className="flex inset-0 bg-white h-full w-full flex-col px-6 pb-10 pt-10 sm:px-8 md:px-10">

                <h1 className='text-xl font-semibold'>Settings</h1>
                <div className='flex flex-col gap-3 text-sm md:text-md lg:text-lg'>
                    {/* General settings */}
                    <div className='flex flex-col'> 
                        <h2 className='text-base font-medium text-gray-600'> General </h2>
                        
                        {/* General setting tabs */}
                        <div className='flex flex-col bg-neutral-300 px-3 py-3 gap-5 rounded-sm'> 
                            <div className='flex flex-row items-center gap-3 rounded-lg'>
                                <label htmlFor="display_name" className='font-medium'>Change display name: </label>
                                <input 
                                    className='border-1 border-neutral-400 rounded-sm px-2 py-1 text-xs
                                    md:text-sm lg:text-md w-24 focus:outline-none focus:border-blue-500 overflow-hidden'
                                    placeholder={prismaUser?.name ?? user?.email}
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                />
                            </div> 
                            {/* Account Role  */}
                            <span className='flex flex-row font-medium gap-2 items-center'> Current role: 
                                <span 
                                    className='font-normal text-md text-neutral-600'>
                                        {prismaUser?.role === 'TA' ? 'Teaching Assistant (TA)' : prismaUser?.role}
                                </span> 
                            </span>
                        </div>
                    </div>

                    {/* Notification settings */}
                    <div className='flex flex-col gap-2'>
                        <h2 className='text-base font-medium text-gray-600'> Notifications </h2>

                        {/* Notification tabs */}
                        <div className='flex flex-col bg-neutral-300 px-3 pt-3 pb-4 gap-3 rounded-sm'> 
                            <h3 className='flex items-center text-sm'> Students </h3>
                            <div className='flex flex-col gap-2 text-sm'>
                                <div className='flex flex-row justify-between bg-neutral-400 px-2 py-2 rounded-lg'>
                                    Alert when it is your turn
                                    <button className='pr-3'> ON </button>
                                </div>
                                <div className='flex flex-row justify-between bg-neutral-400 px-2 py-2 rounded-lg'>
                                    Queue is closing
                                    <button className='pr-3'> ON </button>
                                </div>
                            </div>
                        
                            {prismaUser?.role === 'TA' && <h3 className='text-sm'> TA/PT </h3>}
                            <div className='flex flex-col gap-2 text-sm'>
                                <div className='flex flex-row justify-between bg-neutral-400 px-2 py-2 rounded-lg'>
                                    Student joins your queue
                                    <button className='pr-3'> ON </button>
                                </div>
                                <div className='flex flex-row justify-between bg-neutral-400 px-2 py-2 rounded-lg'>
                                    Student leaves your queue
                                    <button className='pr-3'> ON </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Account settings */}
                    <div className='flex flex-col gap-2'>
                        <h2 className='text-base md:text-md lg:text-lg font-medium text-neutral-600'> Account</h2>

                        <div className='flex flex-col gap-2'>
                            {/* Sign out */}
                            <button 
                                className='flex justify-center w-30 text-xs text-black md:text-sm lg:text-lg 
                                font-medium bg-neutral-500 hover:bg-red-700 hover:text-white px-1 py-2 rounded-lg
                                hover:opacity-80'
                                onClick={handleSignout}
                            > Sign out </button>        

                            {/* Delete Account */}
                            <button 
                                className='flex justify-center w-30 text-xs md:text-sm lg:text-lg 
                                font-medium bg-neutral-500 hover:bg-red-700 hover:text-white px-1 py-2 rounded-lg
                                hover:opacity-80'
                                onClick={handleDeleteAccount}
                            > Delete Account </button>                   
                        </div>   
                    </div>

                </div>
            </div>
        </>
    )
}