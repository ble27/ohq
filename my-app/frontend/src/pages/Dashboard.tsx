import { useState, useEffect, useCallback, useRef } from 'react'
import { ClassSelector } from '../components/DashboardClassSelector'
import { Home } from '@/components/DashboardHome';
import { Sidebar, MOBILE_BREAKPOINT } from '../components/Sidebar'
import { useLocation } from 'react-router-dom';
import { QueueManager, type CreateQueueInput } from '@/components/DashboardQueueManager';
import { VerifyTA, DASHBOARD_MAIN_PANE_ID } from '@/components/TAVerification';
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { InstructionsPanel } from '@/components/notifications/InstructionsPanel'
import { getDashboardView, VIEW_INSTRUCTIONS } from '@/data/viewInstructions'
import { LuBell, LuPanelLeft, LuScrollText } from 'react-icons/lu'
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

const headerIconButtonClass =
    'inline-flex size-[38px] shrink-0 items-center justify-center rounded-full text-neutral-800 transition-colors [&_svg]:block [&_svg]:shrink-0';

export const Dashboard = () => {
    const location = useLocation();
    const isDashboardClass = location.pathname === '/dashboard/class';
    const isDashboardHome = location.pathname === '/dashboard' || location.pathname === '/dashboard/home';
    const isDashboardQueueManager = location.pathname === '/dashboard/queuemanager';
    const isDashboardSettings = location.pathname === '/dashboard/settings';
    const currentView = getDashboardView(location.pathname);
    const currentInstructions = VIEW_INSTRUCTIONS[currentView];
    // Supabase user
    const { user, prismaUser } = useAuth();

    const userId = user?.id;
    const socket = useSocket();

    // Sidebar remains open when above mobile breakpoint
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT);
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT);
    const Classes: string[] = [
        'ENGR 102', 'ENGR 216', 'ENGR 217', 
        'CSCE 120', 'CSCE 221', 'CSCE 313', 'CSCE 314', 
        'ECEN 248', 'ECEN 214', 'ECEN 314', 'ECEN 350'
    ];
   
    // Class currently being selected
    const [selectedClass, setSelectedClass] = useState(Classes[0]);
    const [createdQueues, setCreatedQueues] = useState<Queue[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoadingQueues, setIsLoadingQueues] = useState(true);

    // Inbox lives on Dashboard so it stays mounted across Class / Home / Queue Manager
    const [isOpenAlert, setIsOpenAlert] = useState(false);
    const [isOpenScroll, setIsOpenScroll] = useState(false);
    const [isTaVerificationPending, setIsTaVerificationPending] = useState(false);
    
    // This include ticket.student and queue.ta from forward relations
    const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);

    // Computed fresh per call (not per render) so toasts always show the time the
    // event actually arrived, not whatever time it was when the socket listener
    // effect below last ran.
    const getFormattedNotificationTime = () => {
        const formattedDynamicDate = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(new Date());

        // Inserts the word "at" naturally into the string
        return formattedDynamicDate.replace(/,([^,]*)$/, ' at$1');
    };

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
    const playNotificationsSound = useCallback((unlockOnly = false) => {
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
    }, [prismaUser?.notifySound]);

    useEffect(() => {
        if (!socket) return;
        const onCreated = (n: NotificationWithDetails) => {
            setNotifications((prev) => [n, ...prev]);
            const description = getFormattedNotificationTime();
            if (n.type === 'JOIN') {
                toast(`student ${n.ticket?.student?.name ?? n.ticket?.student?.email ?? ''} just joined your queue.`, 
                    { description }
                );
            }
            else if (n.type === 'LEAVE') {
                toast(`student ${n.ticket?.student?.name ?? n.ticket?.student?.email ?? ''} just left your queue.`, 
                    { description }
                );
            }
            else if (n.type === 'ASSIST') {
                const zoomHint = n.queue?.zoomLink ? ` or join Zoom` : '';
                toast(
                    `TA ${n.queue?.ta?.name} is ready to assist you. Please head to location ${n.queue?.location}${zoomHint}!`,
                    { description },
                )
            }
            else if (n.type === 'CLOSE') {
                const taName = n.queue?.ta?.name ?? n.queue?.ta?.email;
                const minutesLeft = n.queue?.endsAt
                    ? Math.max(0, Math.round((new Date(n.queue.endsAt).getTime() - Date.now()) / 60000))
                    : null;
                const closesIn = minutesLeft === null
                    ? 'soon'
                    : `in ${minutesLeft} ${minutesLeft === 1 ? 'min' : 'mins'}`;
                toast(`TA ${taName}'s Queue closes ${closesIn}!`, 
                    { description }
                )
            }
            playNotificationsSound();
        };
        // socket auto pass in params to onCreated
        // Each notification is already routed to a specific id in the backend using .to().emit()
        socket.on('notification-created', onCreated);
        return () => {
            // onCreated(n);
            socket.off('notification-created', onCreated);
        };
    }, [socket, playNotificationsSound]);

    useEffect(() => {
        if (!socket) return;

        // Destructuring with type annotation
        const onTaQueuesClosed = ({ queueIds }: { queueIds: string[] }) => {
            const closedIds = new Set(queueIds);
            setCreatedQueues((previousQueues) =>
                previousQueues.map((queue) =>
                    closedIds.has(queue.id) ? { ...queue, isOpen: false } : queue,
                ),
            );
        };

        socket.on('ta-queues-closed', onTaQueuesClosed);
        return () => {
            socket.off('ta-queues-closed', onTaQueuesClosed);
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
        // Fetch-on-mount: refreshNotifications is async and updates state after
        // awaiting the network call, not synchronously within the effect body.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void refreshNotifications();
    }, [refreshNotifications]);

    useEffect(() => {
        if (!isDashboardQueueManager || !userId) return;

        let cancelled = false;
        const loadQueueManagerData = async () => {
            try {
                const [queuesResponse, coursesResponse] = await Promise.all([
                    axios.get<QueuesListResponse>('/api/queues/mine'),
                    axios.get<CoursesListResponse>('/api/courses'),
                ]);
                if (!cancelled) {
                    setCreatedQueues(queuesResponse.data.queues);
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

    useEffect(() => {
        const syncViewport = () => {
            setIsDesktop(window.innerWidth >= MOBILE_BREAKPOINT);
        };
        syncViewport();
        window.addEventListener('resize', syncViewport);
        return () => window.removeEventListener('resize', syncViewport);
    }, []);

    // Landing/privacy use document scroll; reset so the dashboard shell starts at the top.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        // Closing these popovers on navigation/verification-gate changes, not
        // synchronizing with an external system — runs once per dependency
        // change rather than every render, so it doesn't cascade.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpenAlert(false);
        setIsOpenScroll(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isTaVerificationPending) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpenAlert(false);
        setIsOpenScroll(false);
    }, [isTaVerificationPending]);

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

    // Paint html/body gutters to match the active dashboard pane background.
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
    <div className={`flex h-dvh w-full overflow-hidden m-0 p-0 ${paneBackgroundClass}`} onPointerDown={() => playNotificationsSound(true)}>
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}/>
        <div
            id={DASHBOARD_MAIN_PANE_ID}
            className={`relative flex min-h-0 min-w-0 flex-1 flex-col ${paneBackgroundClass} ${
                isSidebarOpen && !isDesktop
                    ? 'overflow-hidden'
                    : 'overflow-y-auto overscroll-y-contain'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            <header className={`sticky top-0 flex h-14 shrink-0 items-start overflow-visible px-2 pt-[23px] sm:px-3 ${
                isTaVerificationPending ? 'bg-transparent z-[60]' : `${paneBackgroundClass} z-30`
            }`}>
                {!isDesktop && (
                    <button
                        type="button"
                        aria-label="Open menu"
                        onClick={() => setIsSidebarOpen(true)}
                        className={`${headerIconButtonClass} ${
                            isTaVerificationPending
                                ? 'text-white hover:bg-white/10'
                                : 'hover:bg-black/5'
                        }`}
                    >
                        <LuPanelLeft size={22} strokeWidth={2} className="translate-y-px" />
                    </button>
                )}

                {/* Icon buttons — hidden while TA verification gate is active */}
                {!isTaVerificationPending && (
                    <div className="relative flex flex-1 items-end justify-end h-full w-full gap-4 pr-2 mt-2">
                        <div className="relative">
                            <button
                                type="button"
                                aria-label="Instructions"
                                aria-expanded={isOpenScroll}
                                onClick={() => {
                                    setIsOpenAlert(false);
                                    setIsOpenScroll((prev) => !prev);
                                }}
                                className={headerIconButtonClass}
                            >
                                <LuScrollText size={22} />
                            </button>
                            {isOpenScroll && (
                                <InstructionsPanel instruction={currentInstructions} />
                            )}
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                aria-label="Notifications"
                                aria-expanded={isOpenAlert}
                                onClick={() => {
                                    setIsOpenScroll(false);
                                    setIsOpenAlert((prev) => !prev);
                                }}
                                className={headerIconButtonClass}
                            >
                                <LuBell size={22} strokeWidth={2} />
                            </button>
                            {isOpenAlert && (
                                <NotificationPanel
                                    notifications={notifications}
                                    onClearAll={clearAllNotifications}
                                />
                            )}
                        </div>
                    </div>
                )}

            </header>
            {isDashboardClass && <ClassSelector Classes={Classes} selectedClass={selectedClass} setSelectedClass={setSelectedClass}/>}
            {isDashboardHome && <Home />}
            {isDashboardQueueManager && (
                <VerifyTA
                    onPendingChange={setIsTaVerificationPending}
                >
                    <QueueManager
                        onCreateQueue={handleCreateQueue}
                        onDeleteQueue={handleDeleteQueue}
                        onUpdateQueue={handleQueueUpdated}
                        createdQueues={createdQueues}
                        courses={courses}
                        isLoading={isLoadingQueues}
                        onCloseSidebar={() => setIsSidebarOpen(false)}
                    />
                </VerifyTA>
            )}
            
            { isDashboardSettings && <DashboardSettings prismaUser={prismaUser} supabaseUser={user}/>}
        </div>
    </div>
    </>
)
}
