import { useState } from "react" 
import { useAuth } from "@/context/AuthContextProvider"

export const DashboardSettings = () => {
    const { user, prismaUser } = useAuth();
    return (
        <>
            <div className="flex h-full w-full flex-col bg-neutral-50 px-6 pb-10 pt-10 sm:px-8 md:px-10">
                <h1 className='text-xl font-semibold'>Settings</h1>
                <div className='flex flex-col flex-1'> 
                    <h2 className='text-lg font-medium'> General </h2>
                    <div> 
                        Change Display Name: {prismaUser?.name ?? user?.email}
                    </div>

                </div>
            </div>

        </>
    )
}