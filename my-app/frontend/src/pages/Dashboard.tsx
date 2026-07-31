import React, { useState } from 'react'
import { Header } from '../components/Header'
import { ClassSelector } from '../components/ClassSelector'
import { Home } from '@/components/Home';
import { QueueModal } from '../components/QueueModal';
import { Sidebar } from '../components/Sidebar'
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom';


export const Dashboard = () => {
    const location = useLocation();
    const isDashboardClass = location.pathname === '/dashboard/class';

    const CSCEClasses: string[] = ['csce-221', 'csce-313', 'csce-350'];
    const [selectedClass, setSelectedClass] = useState(CSCEClasses[0]);

return (
    <>
    <div className="flex w-screen h-screen m-0 p-0">
        {/* Sidebar */}
        <Sidebar />
        {isDashboardClass ? <ClassSelector CSCEClasses={CSCEClasses} selectedClass={selectedClass} setSelectedClass={setSelectedClass}/> : <Home />}
        {/* Class selector available at /dashboardc#class */}
    </div>
    </>
)
}