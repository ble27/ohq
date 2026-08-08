import { useState, useEffect, useCallback } from 'react'
import { ClassSelector } from '../components/DashboardClassSelector'
import { Home } from '@/components/DashboardHome';
import { Sidebar, MOBILE_BREAKPOINT } from '../components/Sidebar'
import { useLocation } from 'react-router-dom';
import { QueueManager, type CreateQueueInput } from '@/components/DashboardQueueManager';
import { VerifyTA } from '@/components/TAVerification';
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { LuBell } from 'react-icons/lu'
import type {
    ApiMessageResponse,
    Course,
    CoursesListResponse,
    NotificationWithDetails,
    Queue,
    QueueResponse,
    QueuesListResponse,
} from '@shared/types';
import axios from 'axios'
import { useAuth } from '@/context/AuthContextProvider';
import { useSocket } from '@/context/SocketProvider';

export const Dashboard = () => {
    const location = useLocation();
    const isDashboardClass = location.pathname === '/dashboard/class';
    const isDashboardHome = location.pathname === '/dashboard' || location.pathname === '/dashboard/home';
    const isDashboardQueueManager = location.pathname === '/dashboard/queuemanager';
    const { user } = useAuth();
    const userId = user?.id;
    const socket = useSocket();

    // Sidebar remains open when above mobile breakpoint
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT);
    const CSCEClasses: string[] = ['csce-221', 'csce-313', 'csce-350'];
   
    // Class currently being selected
    const [selectedClass, setSelectedClass] = useState(CSCEClasses[0]);
    const [createdQueues, setCreatedQueues] = useState<Queue[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoadingQueues, setIsLoadingQueues] = useState(true);

    // Inbox lives on Dashboard so it stays mounted across Class / Home / Queue Manager
    const [isOpenAlert, setIsOpenAlert] = useState(false);
    const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);

    useEffect(() => {
        if (!socket) return;
        const onCreated = (n: NotificationWithDetails) => {
            setNotifications((prev) => [n, ...prev]);
        };
        socket.on('notification-created', onCreated);
        return () => {
            socket.off('notification-created', onCreated);
        };
    }, [socket]);

    const refreshNotifications = useCallback(async (): Promise<NotificationWithDetails[]> => {
        if (!userId) return [];
        const response = await axios.get(`/api/notifications/user/${userId}`);
        const next: NotificationWithDetails[] = response.data.notifications;
        setNotifications(next);
        return next;
    }, [userId]);

    const clearAllNotifications = async () => {
        if (!userId) return;
        await axios.delete(`/api/notifications/user/${userId}`);
        await refreshNotifications();
    };

    useEffect(() => {
        void refreshNotifications();
    }, [refreshNotifications]);

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

    const handleQueueUpdated = async (updated: Queue) => {
        // if queue is updated the old queue becomes updated else remaining queues
        setCreatedQueues((prev) => 
            prev.map((q) => updated.id === q.id ? updated : q)
        )
    }
    
return (
    <>
    <div className="flex w-full h-screen m-0 p-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}/>
        <div className="relative flex-1 min-w-0 overflow-y-auto">
            {/* Fixed overlay — no layout whitespace. Home places its own bell in the title row. */}
            {!isDashboardHome && (
                <LuBell
                    size={35}
                    className="fixed top-11 right-7 z-30 cursor-pointer p-2 hover:rounded-full hover:bg-gray-100 hover:opacity-80 sm:right-9 md:right-11 lg:right-15"
                    onClick={() => setIsOpenAlert((prev) => !prev)}
                />
            )}
            {isOpenAlert && (
                <NotificationPanel
                    notifications={notifications}
                    onClearAll={clearAllNotifications}
                />
            )}
            {isDashboardClass && <ClassSelector CSCEClasses={CSCEClasses} selectedClass={selectedClass} setSelectedClass={setSelectedClass}/>}
            {isDashboardHome && (
                <Home onToggleNotifications={() => setIsOpenAlert((prev) => !prev)} />
            )}
            {isDashboardQueueManager && (
                <VerifyTA>
                    <QueueManager
                        onCreateQueue={handleCreateQueue}
                        onDeleteQueue={handleDeleteQueue}
                        onUpdateQueue={handleQueueUpdated}
                        createdQueues={createdQueues}
                        courses={courses}
                        isLoading={isLoadingQueues}
                    />
                </VerifyTA>
            )}
        </div>
        {/* Class selector available at /dashboardc#class */}
    </div>
    </>
)
}
