import React from 'react'
import { Header } from '../components/Header'
export const Dashboard = () => {
  return (
    <>
    <Header />
    {/* Background */}
    <div class="w-full h-[850px] m-0 p-0">
        {/* Actual sidebar */}
        <div className='flex w-50 h-full pl-8 pt-10 border-r-1 border-gray-200 shadow bg-[#500000] text-white font-bold'>
            <ul className='flex text-lg flex-col gap-5 pointer-events-auto w-full'>
                <li className='hover:opacity-90 w-full'>Home</li>
                <li className='hover:opacity-90 w-full'>Class</li>
            </ul>
        </div>
    </div>
    </>
    )
}
