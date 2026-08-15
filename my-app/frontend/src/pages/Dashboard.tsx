import { useState, useEffect, useCallback, useRef } from 'react'
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
import { DashboardSettings } from '@/components/DashboardSettings';
import { toast } from 'sonner';
import notificationAlert from '../sounds/notification_alert.mp3'

export const Dashboard = () => {
    const location = useLocation();
    const isDashboardClass = location.pathname === '/dashboard/class';
    const isDashboardHome = location.pathname === '/dashboard' || location.pathname === '/dashboard/home';
    const isDashboardQueueManager = location.pathname === '/dashboard/queuemanager';
    const isDashboardSettings = location.pathname === '/dashboard/settings';
    // Supabase user
    const { user, prismaUser, refreshUser } = useAuth();

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

    // This include ticket.student and queue.ta from forward relations
    const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);

    const liveDate = new Date();

    const formattedDynamicDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
    }).format(liveDate);

    // Inserts the word "at" naturally into the string
    const finalDisplayString = formattedDynamicDate.replace(/,([^,]*)$/, ' at$1');

    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
    const notificationSoundUnlockedRef = useRef(false);

    // Load on mount, setup, and teardown
    useEffect(() => {
        const audio = new Audio(notificationAlert);
        audio.preload = 'auto';
        audio.volume = 1;
        notificationAudioRef.current = audio;
        return () => {
            audio.pause();
            notificationAudioRef.current = null;
        };
    }, []);

    // First call with unlockOnly=true must happen from a user gesture (browser autoplay policy).
    // Later calls play the alert for real.
    const playNotificationsSound = (unlockOnly = false) => {
        const audio = notificationAudioRef.current;
        if (!audio) return;

        // Browser blocks by default
        if (unlockOnly) {
            if (notificationSoundUnlockedRef.current) return;
            notificationSoundUnlockedRef.current = true;
            void audio.play()
                .then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                })
                .catch(() => {
                    notificationSoundUnlockedRef.current = false;
                });
            return;
        }

        // Play the sound if unlocked already and user enabled sound in settings
        if (prismaUser?.notifySound === false) return;
        audio.currentTime = 0;
        void audio.play().catch((error) => {
            console.warn('Failed to play notification sound', error);
        });
    };

    useEffect(() => {
        if (!socket) return;
        const onCreated = (n: NotificationWithDetails) => {
            setNotifications((prev) => [n, ...prev]);
            if (n.type === 'JOIN') {
                toast(`student ${n.ticket?.student?.name ?? n.ticket?.student?.email ?? ''} just joined your queue.`, 
                    { description: finalDisplayString }
                );
            }
            else if (n.type === 'LEAVE') {
                toast(`student ${n.ticket?.student?.name ?? n.ticket?.student?.email ?? ''} just left your queue.`, 
                    { description: finalDisplayString }
                );
            }
            else if (n.type === 'ASSIST') {
                toast(`TA ${n.queue?.ta?.name} is ready to assist you. Please head to location ${n.queue?.location}!`, 
                    { description: finalDisplayString }
                )
            }
            else if (n.type === 'CLOSE') {
                const closesAt = n.queue?.endsAt
                    ? new Date(n.queue.endsAt).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    })
                    : 'soon';
                toast(`TA's ${n.queue?.ta?.name ?? n.queue?.ta?.email} closes at ${closesAt}!`, 
                    { description: finalDisplayString }
                )
            }
            playNotificationsSound();
        };
        // socket auto pass in params to onCreated
        // Each notification is already routed to a specific id on the backend using .to().emit()
        socket.on('notification-created', onCreated);
        return () => {
            // onCreated(n);
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

    // Replace Created queue with new instance 
    // Need to constantly pass down createdQueues to props that need this
    const handleQueueUpdated = useCallback(async (updated: Queue) => {
        // if queue is updated the old queue becomes updated else remaining queues
        setCreatedQueues((prev) => 
            prev.map((q) => updated.id === q.id ? updated : q)
        )
    }, []);

    const paneBackgroundClass = isDashboardHome || isDashboardSettings
        ? 'bg-white'
        : isDashboardClass
            ? 'bg-neutral-50'
            : isDashboardQueueManager
                ? 'bg-slate-50'
                : '';

    const paneBackgroundColor = isDashboardHome || isDashboardSettings
        ? '#ffffff'
        : isDashboardClass
            ? '#fafafa'
            : isDashboardQueueManager
                ? '#f8fafc'
                : '';

    // html/body stay max-width: 1500px; paint the xl gutters to match this view.
    useEffect(() => {
        if (!paneBackgroundColor) return;
        const html = document.documentElement;
        const previousHtml = html.style.backgroundColor;
        const previousBody = document.body.style.backgroundColor;
        html.style.backgroundColor = paneBackgroundColor;
        document.body.style.backgroundColor = paneBackgroundColor;
        return () => {
            html.style.backgroundColor = previousHtml;
            document.body.style.backgroundColor = previousBody;
        };
    }, [paneBackgroundColor]);

return (
    <>
    <div className={`flex h-screen w-full overflow-hidden m-0 p-0 ${paneBackgroundClass}`} onPointerDown={() => playNotificationsSound(true)}>
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}/>
        <div className={`relative min-h-0 min-w-0 flex-1 overflow-y-auto ${paneBackgroundClass}`}>
            {/* Fixed overlay — no layout whitespace. Home places its own bell in the title row. */}
            {!(isDashboardHome || isDashboardSettings) && (
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
            
            {/* Settings */}
            { isDashboardSettings && <DashboardSettings prismaUser={prismaUser} supabaseUser={user} onUpdateSaveChanges={refreshUser}/>}
        </div>
    </div>
    </>
)
}
