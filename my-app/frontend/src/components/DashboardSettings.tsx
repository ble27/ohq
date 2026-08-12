import { useState } from "react" 
import { useAuth } from "@/context/AuthContextProvider"

export const DashboardSettings = () => {
    const { user, prismaUser } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const handleDeleteAccount = async () => {

    }
    const handleSignout = async () => {

    }
    return (
        <>
            <div className="flex h-full w-full flex-col bg-neutral-50 px-6 pb-10 pt-10 sm:px-8 md:px-10">
                <h1 className='text-xl font-semibold'>Settings</h1>
                
                <div className='flex flex-col flex-1'> 
                    <h2 className='text-lg font-medium text-gray-600'> General </h2>
                    <div className='flex flex-col bg-neutral-300 px-3 py-3 gap-5 rounded-lg'> 
                        <div className='flex flex-row items-center gap-5 rounded-lg'>
                            <label htmlFor="display_name" className='font-semibold'>Change display name: </label>
                            <input 
                                className='border-1 border-neutral-400 rounded-sm px-2 py-1 text-sm w-24 
                                        focus:outline-none focus:border-blue-500 overflow-hidden'
                                placeholder={prismaUser?.name ?? user?.email}
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                            />
                            
                        </div> 
                        {/* Account Role  */}
                        <span className='flex flex-row font-semibold gap-2 items-center'> Current role: <span className='font-normal text-neutral-600'>{prismaUser?.role === 'TA' ? 'Teaching Assistant (TA)' : prismaUser?.role}</span> </span>
                    </div>
                    <h2 className='text-lg font-medium text-gray-600'> Notifications </h2>

                    <div className='flex flex-col bg-neutral-300 px-3 py-3 gap-3'> 
                        <h3> Students </h3>
                        <div className='flex flex-col gap-2'>
                            <div className='flex flex-row justify-between bg-neutral-400 px-2 py-2 rounded-lg'>
                                Alert when it is your turn
                                <button className='pr-3'> ON </button>
                            </div>
                            <div className='flex flex-row justify-between bg-neutral-400 px-2 py-2 rounded-lg'>
                                Queue is closing
                                <button className='pr-3'> ON </button>
                            </div>
                        </div>
                    
                        {prismaUser?.role === 'TA' && <h3 className='font-xl'> TA/PT </h3>}
                        <div className='flex flex-col gap-2'>
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
                    <h2 className='text-lg font-medium text-neutral-600'> Account</h2>
                    <div className='flex flex-col gap-2'>
                        {/* Sign out */}
                        <button 
                            className='flex justify-center w-30 text-sm font-medium bg-red-800 text-white px-1 py-2 rounded-lg
                                        hover:opacity-80'
                            onClick={handleSignout}
                        > Sign out </button>        

                        {/* Delete Account */}
                        <button 
                            className='flex justify-center w-30 text-sm font-medium bg-red-500 text-white px-1 py-2 rounded-lg
                                        hover:opacity-80'
                            onClick={handleDeleteAccount}
                        > Delete Account </button>                   
                    </div>   

                </div>

            </div>

        </>
    )
}