import { useState, useEffect } from 'react'
import { ClassSelector } from '../components/ClassSelector'
import { Home } from '@/components/Home';
import { Sidebar, MOBILE_BREAKPOINT } from '../components/Sidebar'
import { useLocation } from 'react-router-dom';
import { QueueManager, type CreateQueueInput } from '@/components/QueueManager';
import type {
    ApiMessageResponse,
    Course,
    CoursesListResponse,
    Queue,
    QueueResponse,
    QueuesListResponse,
} from '@shared/types';
import axios from 'axios'
import { useAuth } from '@/context/AuthContextProvider';

export const Dashboard = () => {
    const location = useLocation();
    const isDashboardClass = location.pathname === '/dashboard/class';
    const isDashboardHome = location.pathname === '/dashboard' || location.pathname === '/dashboard/home';
    const isDashboardQueueManager = location.pathname === '/dashboard/queuemanager';
    const { user } = useAuth();
    const userId = user?.id;

    // Sidebar remains open when above mobile breakpoint
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT);
    const CSCEClasses: string[] = ['csce-221', 'csce-313', 'csce-350'];
    const [selectedClass, setSelectedClass] = useState(CSCEClasses[0]);
    const [createdQueues, setCreatedQueues] = useState<Queue[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoadingQueues, setIsLoadingQueues] = useState(true);

    useEffect(() => {
        if (!isDashboardQueueManager || !userId) return;

        let cancelled = false;
        const loadQueueManagerData = async () => {
            try {
                const [queuesResponse, coursesResponse] = await Promise.all([
                    axios.get<QueuesListResponse>('/api/queues'),
                    axios.get<CoursesListResponse>('/api/courses'),
                ]);
                if (!cancelled) {
                    setCreatedQueues(
                        queuesResponse.data.queues.filter((queue) => queue.taId === userId),
                    );
                    setCourses(coursesResponse.data.courses);
                }
            } catch (error: unknown) {
                console.error('Failed to load queue manager data', error);
            } finally {
                if (!cancelled) setIsLoadingQueues(false);
            }
        };

        void loadQueueManagerData();
        return () => {
            cancelled = true;
        };
    }, [isDashboardQueueManager, userId]);

    const handleCreateQueue = async (input: CreateQueueInput) =>  {
        try {
            const response = await axios.post<QueueResponse>('/api/queues', input);
            const newQueue = response.data.queue;
            setCreatedQueues((previousQueues) => {
                if (previousQueues.some((queue) => queue.id === newQueue.id)) {
                    return previousQueues;
                }
                return [...previousQueues, newQueue];
            });

        } catch (error: unknown) {
            console.error('Failed to create a new queue', error);
            throw error;
        }
    }

    const handleDeleteQueue = async (queueId: string) => {
        try {
            const response = await axios.delete<ApiMessageResponse>(`/api/queues/${queueId}`);
            if (response.status === 200) {
                setCreatedQueues((previousQueues) =>
                    previousQueues.filter((queue) => queue.id !== queueId),
                );
            }
        } catch (error: unknown) {
            console.error(`Failed to delete queue ${queueId}`, error);
            throw error;
        }
    }

return (
    <>
    <div className="flex w-full h-screen m-0 p-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}/>
        <div className="flex-1 min-w-0 overflow-y-auto">
            {isDashboardClass && <ClassSelector CSCEClasses={CSCEClasses} selectedClass={selectedClass} setSelectedClass={setSelectedClass}/>}
            {isDashboardHome && <Home />}
            {isDashboardQueueManager && (
                <QueueManager
                    onCreateQueue={handleCreateQueue}
                    onDeleteQueue={handleDeleteQueue}
                    createdQueues={createdQueues}
                    courses={courses}
                    isLoading={isLoadingQueues}
                />
            )}
        </div>
        {/* Class selector available at /dashboardc#class */}
    </div>
    </>
)
}
