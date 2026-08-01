import React, { useState, useEffect } from 'react'
import { ClassSelector } from '../components/ClassSelector'
import { Home } from '@/components/Home';
import { Sidebar, MOBILE_BREAKPOINT } from '../components/Sidebar'
import { useLocation } from 'react-router-dom';


export const Dashboard = () => {
    const location = useLocation();
    const isDashboardClass = location.pathname === '/dashboard/class';

    // Sidebar remains open when above mobile breakpoint
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT);
    const CSCEClasses: string[] = ['csce-221', 'csce-313', 'csce-350'];
    const [selectedClass, setSelectedClass] = useState(CSCEClasses[0]);

    // Close sidebar on navigation in mobile only; desktop stays as-is
    useEffect(() => {
        if (window.innerWidth < MOBILE_BREAKPOINT) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

return (
    <>
    <div className="flex w-full h-screen m-0 p-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}/>
        <div className="flex-1 min-w-0 overflow-y-auto">
          {isDashboardClass ? <ClassSelector CSCEClasses={CSCEClasses} selectedClass={selectedClass} setSelectedClass={setSelectedClass}/> : <Home />}
        </div>
        {/* Class selector available at /dashboardc#class */}
    </div>
    </>
)
}
