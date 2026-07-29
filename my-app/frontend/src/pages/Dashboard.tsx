import React, { useState } from 'react'
import { Header } from '../components/Header'
import { ClassSelector } from '../components/ClassSelector'
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom';
import { QueueModal } from '../components/QueueModal';
export const Dashboard = () => {
    const location = useLocation();
    const isDashboardClass = location.pathname === '/dashboard/class';

    const CSCEClasses: string[] = ['csce-221', 'csce-313', 'csce-350'];
    const [selectedClass, setSelectedClass] = useState(CSCEClasses[0]);

return (
    <>
    <Header />
    <div className="flex flex-row w-full h-[850px] m-0 p-0">
        {/* Sidebar */}
        <div className='flex w-50 h-full pl-8 pt-10 border-r border-gray-200 shadow bg-[#500000] text-white font-bold'>
            <ul className='flex text-lg flex-col gap-5 pointer-events-auto w-full'>
                <Link to='/dashboard/home' className='hover:opacity-90 w-full'>Home</Link>
                <Link to='/dashboard/class' className='hover:opacity-90 w-full'>Class</Link>
            </ul>
        </div>
        {isDashboardClass ? <ClassSelector CSCEClasses={CSCEClasses} selectedClass={selectedClass} setSelectedClass={setSelectedClass}/> : null}
        {/* Class selector available at /dashboardc#class */}
        
        {/* Queue Modal */}
        <QueueModal/>
    </div>
    </>
)
}