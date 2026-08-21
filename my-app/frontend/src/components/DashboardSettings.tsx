import { useState, useEffect } from "react" 
import { useAuth } from "@/context/AuthContextProvider"
import { DeleteUserAccountConfirmation } from "./DeleteUserAccountConfirmation";
import { deleteAccount, signOut } from "@/services/authService";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import type { User as PrismaUser } from "@shared/types";
import type { User  as SupabaseUser } from "@supabase/supabase-js";
import { Spinner } from "./ui/spinner";
interface DashboardSettingsProps {
    prismaUser: PrismaUser | null
    supabaseUser: SupabaseUser | null
    onUpdateSaveChanges: () => Promise<void>     // refreshUser from Context Provider which updates both Prisma and Supabase models
}
export const DashboardSettings = ({ prismaUser, supabaseUser, onUpdateSaveChanges }: DashboardSettingsProps) => {
    // useState only use the inital prop once and doesn't refresh
    const [displayName, setDisplayName] = useState(prismaUser?.name ?? '');
    const [defaultLocation, setDefaultLocation] = useState(prismaUser?.defaultLocation ?? '')
    const [studentAlertQueueClosing, setStudentAlertQueueClosing] = useState(prismaUser?.notifyClose ?? null)
    const [studentAlertYourTurn, setStudentAlertYourTurn] = useState(prismaUser?.notifyAssist ?? null)
    const [taAlertStudentJoinQueue, setTaAlertStudentJoinQueue] = useState(prismaUser?.notifyJoin ?? null)
    const [taAlertStudentLeaveQueue, setTaAlertStudentLeaveQueue] = useState(prismaUser?.notifyLeave ?? null)
    const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(prismaUser?.notifySound ?? true)
    const [isDeleteUserAccountModalOpen, setIsDeleteUserAccountModalOpen] = useState(false);
    const [pending, setPending] = useState(false);

    // Update state every time prismaUser changes
    useEffect(() => {
        if (!prismaUser) return;
        setDisplayName(prismaUser?.name ?? '');
        setStudentAlertYourTurn(prismaUser?.notifyAssist ?? null);
        setStudentAlertQueueClosing(prismaUser?.notifyClose ?? null);
        setTaAlertStudentJoinQueue(prismaUser?.notifyJoin ?? null);
        setTaAlertStudentLeaveQueue(prismaUser?.notifyLeave ?? null);
        setNotificationSoundEnabled(prismaUser?.notifySound ?? true);
        setDefaultLocation(prismaUser?.defaultLocation ?? '');
    }, [prismaUser])

    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    // Permanently delete user account
    const handleDeleteAccount = async () => {
        const id = prismaUser?.id ?? supabaseUser?.id;
        if (!id) {
            throw new Error('No user id available to delete');
        }
        await deleteAccount(id);
        await signOut();
        navigate('/', { replace: true });
        await refreshUser();
    }

    const handleSignout = async () => {
        await signOut();
        navigate('/', { replace: true });
        await refreshUser();
    }

    const handleSaveChanges = async () => {
        setPending(true);
        try {
            const id = prismaUser?.id;
            // Name
            if (displayName !== prismaUser?.name) {
                await axios.patch(`/api/users/${id}/name`, {
                    name: displayName })
            }
            // Student
            if (prismaUser?.notifyAssist !== studentAlertYourTurn) {
                await axios.patch(`/api/users/${id}/notifications/type/ASSIST`, {status: studentAlertYourTurn});
            }
            if (prismaUser?.notifyClose !== studentAlertQueueClosing) {
                await axios.patch(`/api/users/${id}/notifications/type/CLOSE`, {status: studentAlertQueueClosing});
            }
            // TA
            if (prismaUser?.role === 'TA') {
                if (prismaUser.notifyJoin !== taAlertStudentJoinQueue) {
                    await axios.patch(`/api/users/${id}/notifications/type/JOIN`, {status: taAlertStudentJoinQueue});
                }
                if (prismaUser.notifyLeave !== taAlertStudentLeaveQueue) {
                    await axios.patch(`/api/users/${id}/notifications/type/LEAVE`, {status: taAlertStudentLeaveQueue});
                }
            }
            if (prismaUser?.notifySound !== notificationSoundEnabled) {
                await axios.patch(`/api/users/${id}/notifications/sound`, { status: notificationSoundEnabled });
            }
            // Default location (TA)
            if (prismaUser?.role === 'TA' && prismaUser.defaultLocation !== defaultLocation) {
                await axios.patch(`/api/users/${id}/defaultlocation`, { defaultLocation });
            }
            await onUpdateSaveChanges();
        } finally {
            setPending(false);
        }
    }

    const handleCancelChanges = async () => {
        if (prismaUser?.name) {
            setDisplayName(prismaUser?.name);
        }
        if (prismaUser?.role === 'TA') {
            if (prismaUser.notifyJoin) {
                setTaAlertStudentJoinQueue(prismaUser.notifyJoin);
            }
            if (prismaUser.notifyLeave) {
                setTaAlertStudentLeaveQueue(prismaUser.notifyLeave);
            }
        }
        if (prismaUser?.notifyAssist) {
            setStudentAlertYourTurn(prismaUser.notifyAssist);
        }
        if (prismaUser?.notifyClose) {
            setStudentAlertQueueClosing(prismaUser.notifyClose);
        }
        setNotificationSoundEnabled(prismaUser?.notifySound ?? true);
        setDefaultLocation(prismaUser?.defaultLocation ?? '');
    }

    return (
        <>
            <div className="flex min-h-full w-full flex-col bg-white px-6 pb-10 pt-10 sm:px-8 md:px-10">
                {/* Settings and below layout */}
                <div className='flex flex-col gap-5 md:gap-6 lg:gap-7'>
                    <h1 className='text-xl md:text-2xl font-semibold'>Settings</h1>
                    <div className='flex flex-col gap-4 md:gap-5 lg:gap-6 text-sm md:text-md lg:text-lg'>

                        {/* General settings */}
                        <div className='flex flex-col gap-2'> 
                            <h2 className='text-base font-medium text-gray-600'> General </h2>
                            
                            {/* General setting tabs */}
                            <div className='flex flex-col bg-neutral-300 px-3 py-3 gap-5 rounded-sm'> 
                                <div className='flex flex-row items-center gap-3 rounded-lg'>
                                    <label htmlFor="display_name" className='font-medium text-sm md:text-md'>Change display name (Real Name): </label>
                                    <input 
                                        className='border-1 border-neutral-400 rounded-sm px-2 py-1 text-xs
                                        md:text-sm lg:text-md w-24 focus:outline-none focus:border-blue-500 overflow-hidden'
                                        placeholder={prismaUser?.name ?? displayName ?? supabaseUser?.email}
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                    />
                                </div> 
                                {/* Account Role  */}
                                <span className='flex flex-row font-medium gap-2 items-center text-sm md:text-md'>
                                    Current role: 
                                    <span className='font-normal text-md text-neutral-600'>
                                        {prismaUser?.role === 'TA' ? 'Teaching Assistant (TA)' : prismaUser?.role}
                                    </span>      
                                </span>
                                {/* Default queue location */}
                                {prismaUser?.role === 'TA' &&  <div className='flex flex-row gap-2 items-center'>
                                    <label htmlFor="display_name" className='font-medium text-sm md:text-md'>Default Queue Location: </label>
                                    <input 
                                        className='border-1 border-neutral-400 rounded-sm px-2 py-1 text-xs
                                        md:text-sm lg:text-md w-24 focus:outline-none focus:border-blue-500 overflow-hidden'
                                        placeholder={prismaUser?.defaultLocation ?? 'e.g. Zach 420'}
                                        value={defaultLocation}
                                        onChange={e => setDefaultLocation(e.target.value)}
                                    />
                                </div>}
                            </div>
                        </div>

                        {/* Notification settings */}
                        <div className='flex flex-col gap-2'>
                            <h2 className='text-base font-medium text-gray-600'> Notifications </h2>

                            {/* Notification tabs */}
                            <div className='flex flex-col bg-neutral-300 px-3 pt-3 pb-4 gap-3 rounded-sm'> 
                                <h3 className='font-semibold text-sm md:text-base lg:text-md'> Student </h3>
                                <div className='flex flex-col gap-2 text-sm'>
                                    <div className='flex flex-row justify-between bg-neutral-400 px-2 py-2 rounded-lg'>
                                        Alert when it is your turn next in a queue
                                        <button 
                                            className='pr-3'
                                            onClick={() => setStudentAlertYourTurn(!studentAlertYourTurn)}> 
                                         {studentAlertYourTurn ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                    <div className='flex flex-row justify-between bg-neutral-400 px-2 py-2 rounded-lg'>
                                        Alert when a joined queue is closing
                                        <button 
                                            className='pr-3'
                                            onClick={() => setStudentAlertQueueClosing(!studentAlertQueueClosing)}
                                            >     
                                            {studentAlertQueueClosing ? 'ON' : 'OFF'} 
                                        </button>
                                    </div>
                                </div>
                            
                                {prismaUser?.role === 'TA' && <h3 className='font-semibold text-sm md:text-base lg:text-md'> TA/PT </h3>}
                                {prismaUser?.role === 'TA' &&  <div className='flex flex-col gap-2 text-sm'>
                                    <div className='flex flex-row justify-between bg-neutral-400 px-2 py-2 rounded-lg'>
                                        Alert when a student joins your queue
                                        <button 
                                            className='pr-3'
                                            onClick={() => setTaAlertStudentJoinQueue(!taAlertStudentJoinQueue)}> 
                                            {taAlertStudentJoinQueue ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                    <div className='flex flex-row justify-between bg-neutral-400 px-2 py-2 rounded-lg'>
                                        Alert when a student leaves your queue
                                        <button 
                                            className='pr-3'
                                            onClick={() => setTaAlertStudentLeaveQueue(!taAlertStudentLeaveQueue)}> 
                                            {taAlertStudentLeaveQueue ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                </div>}
                                <h3 className='font-semibold text-sm md:text-base lg:text-md'> Sound </h3>
                                <div className='flex flex-col gap-2 text-sm'>
                                    <div className='flex flex-row justify-between bg-neutral-400 px-2 py-2 rounded-lg'>
                                        Play sound when a notification arrives
                                        <button
                                            className='pr-3'
                                            onClick={() => setNotificationSoundEnabled(!notificationSoundEnabled)}
                                        >
                                            {notificationSoundEnabled ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Account settings */}
                        <div className='flex flex-col gap-2'>
                            <h2 className='text-base md:text-md lg:text-lg font-medium text-gray-600'> Account </h2>

                            <div className='flex flex-col gap-2 bg-neutral-300 px-3 py-3 rounded-sm'>
                                {/* Sign out */}
                                <div className='flex flex-row items-center justify-between'>
                                    <span className='font-medium text-sm md:text-base lg:text-md'> Sign out </span>
                                    <button 
                                        className='flex justify-center w-30 text-xs text-black md:text-sm
                                        font-medium bg-neutral-400 hover:bg-red-700 hover:text-white px-1 py-2 rounded-lg
                                        hover:opacity-80'
                                        onClick={handleSignout}
                                    > Sign out </button>        

                                </div>
                                <div className='flex flex-row items-center justify-between'>
                                    <span className="font-medium text-sm md:text-base lg:text-md">Permanently delete account</span>    
                                    {/* Delete Account */}
                                    <button 
                                        className='flex justify-center w-30 text-xs md:text-sm 
                                        font-medium bg-neutral-400 hover:bg-red-700 hover:text-white px-1 py-2 rounded-lg
                                        hover:opacity-80'
                                        onClick={() => setIsDeleteUserAccountModalOpen(true)}
                                    > Delete Account </button>                   
                                </div> 
                                {isDeleteUserAccountModalOpen && <DeleteUserAccountConfirmation onClose={() => setIsDeleteUserAccountModalOpen(false)} onConfirm={handleDeleteAccount}/>}
                            </div>   
                        </div>
                    </div>
                       {/* Save changes button */}
                       <div className='flex flex-row justify-end gap-3'>
                        <button 
                            onClick={handleSaveChanges}
                            className="bg-green-600 text-white px-3 py-1 text-sm rounded-sm
                                        hover:opacity-80"
                            >
                            <div className='flex flex-row items-center gap-2'>
                                {pending ? 'Saving' : 'Save'}
                                {pending && <Spinner />}
                            </div>
                            
                        </button>
                        {/* Cancel changes button */}
                        <button
                            onClick={handleCancelChanges}
                            className="bg-neutral-300 text-black border border-neutral-400/30 px-3 py-1 text-sm rounded-sm
                                        hover:opacity-80"
                            >
                           Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}