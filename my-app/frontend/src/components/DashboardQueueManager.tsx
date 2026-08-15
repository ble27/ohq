import { useState, useEffect, type FormEvent } from 'react'
import { MapPin, Plus, Settings2, Trash2 } from 'lucide-react'
import type { Course, Queue, QueueTicketsListResponse, QueueTicketWithStudent } from '@shared/types'
import { useAuth } from '@/context/AuthContextProvider'
import { DeleteConfirmation } from './DeleteConfirmationModal'
import { QueueManagementModal } from './QueueManagementModal'
import axios from 'axios'

// Date requires hour, min, s, ms
function parseTimeOnToday(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number) // ['14', '30'] -> [14, 30]
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
}

function formatQueueTime(value: string | Date | null | undefined): string {
    if (!value) return ''
    return new Date(value).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

export interface CreateQueueInput {
    courseId: string
    taId:     string
    location: string
    isOpen:   boolean
    startsAt: Date
    endsAt: Date
}

interface QueueManagerProps {
    createdQueues: Queue[]
    courses: Course[]
    isLoading: boolean
    // onCreateQueue is a prop for a function in the parent component
    onCreateQueue: (input: CreateQueueInput) => void | Promise<void>
    onDeleteQueue: (queueId: string) => void | Promise<void>
    onUpdateQueue: (updated: Queue) => void | Promise<void>
}

export const QueueManager = ({
    createdQueues,
    courses,
    isLoading,
    onCreateQueue,
    onDeleteQueue,
    onUpdateQueue
}: QueueManagerProps) => {
    const [courseId, setCourseId] = useState('')
    const [location, setLocation] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [deletingQueueId, setDeletingQueueId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isViewingDeletionModal, setIsViewingDeletionModal] = useState(false);

    // Queue Start and End Times
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('09:00');
    // TA workspace
    const [isViewingManagementModal, setIsViewingManagementModal] = useState(false);
    const [currentQueue, setCurrentQueue] = useState<Queue | null>(null);
    const [tickets, setTickets] = useState<QueueTicketWithStudent[]>([]);

    const { user } = useAuth();

    const handleCreateQueue = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!courseId || !location.trim() || !user) return

        try {
            setIsCreating(true)
            setError(null)
            if (endTime <= startTime) {
                setError('End time cannot be before start time.')
                return;
            }
            await onCreateQueue({
                courseId,
                taId: user.id,
                location: location.trim().toUpperCase(),
                isOpen: true,
                startsAt: parseTimeOnToday(startTime),
                endsAt: parseTimeOnToday(endTime),
            })
            setCourseId('')
            setLocation('')
        } catch {
            setError('Unable to create the queue due to failed input validation or another queue of the same course already exists. Please try again.')
        } finally {
            setIsCreating(false)
        }
    }

    const handleConfirmDeleteQueue = async () => {
        try {
            if (!deletingQueueId) {
                console.log('No deleting queue ID present');
                return;
            }
            setError(null)
            // From dashboard
            await onDeleteQueue(deletingQueueId);
        } catch {
            setError('Unable to delete the queue. Please try again.')
        } finally {
            setDeletingQueueId(null)
        }
    }

    // Set the deleting queue id and open the confirmation modal
    const handleOpenDeleteModal = async (queueId: string) => {
        setDeletingQueueId(queueId);
        setIsViewingDeletionModal(true);
    }

    // Queue Management Modal
    const handleOpenManagementModal = async (queue: Queue) => {
        setCurrentQueue(queue);
        setIsViewingManagementModal(true);
    }

    // When queue management modal is closed
    // Remove all tickets currently waiting and in session, essentially deleting them
    // Don't persist
    const removeTicketsWhenClosed = async () => {
        console.log('Calling removeTicketsWhenClosed');
        const queueId = currentQueue?.id;
        // deleted tickets
        await axios.delete(`/api/queueticket/queues/${queueId}/status/closed`);
    }

    /* QueueManager will manage all tickets for each queue
        Fetch all current tickets for a queue based on queue ID
      And Pass to the QueueManagementModal  
    */

    useEffect(() => {
        if (!isViewingManagementModal || !currentQueue) {
            setTickets([]);
            return;
        }

        let cancelled = false;
        const fetchTickets = async () => {
            try {
                const response = await axios.get<QueueTicketsListResponse>(
                    `/api/queueticket/queues/${currentQueue.id}`,
                );
                if (!cancelled) {
                    setTickets(response.data.tickets);
                }
            } catch (error) {
                console.log('Failed to fetch all active tickets from id', currentQueue.id, error);
                if (!cancelled) {
                    setTickets([]);
                }
            }
        };

        void fetchTickets();
        return () => {
            cancelled = true;
        };
    }, [isViewingManagementModal, currentQueue]);

    // One timeout per open queue — fires at endsAt (or immediately if already past).
    useEffect(() => {
        const timers: number[] = [];

        for (const queue of createdQueues) {
            if (!queue.isOpen || !queue.endsAt) continue;
            const delay = new Date(queue.endsAt).getTime() - Date.now();

            const closeQueue = async () => {
                try {
                    const response = await axios.patch(`/api/queues/${queue.id}/status/false`);
                    const updated = response.data?.queue;
                    if (updated) await onUpdateQueue(updated); // call onUpdate to update the queue opening / closing status for all created queues
                } catch (err) {
                    console.error(`Failed to auto-close queue ${queue.id}`, err);
                }
            };

            if (delay <= 0) {
                void closeQueue();
            } else {
                timers.push(window.setTimeout(() => { void closeQueue(); }, delay));
            }
        }

        return () => {
            for (const id of timers) window.clearTimeout(id);
        };
    }, [createdQueues, onUpdateQueue]);

    const handleUpdateQueueTime = async (start: string, end: string) => {
        const queueId = currentQueue?.id;
        try {
            if (end <= start) {
                console.log('End time cannot be before start time');
                return;
            }
            const formattedStartTime = parseTimeOnToday(start);
            const formattedEndTime = parseTimeOnToday(end);
    
            const response = await axios.patch(`/api/queues/${queueId}/time`, {
                startsAt: formattedStartTime, endsAt: formattedEndTime
            })
            if (!response.data) {
                console.log('Unable to update queue\'s time');
                return;
            }
            await onUpdateQueue(response.data.queue);
        } catch (error) {
            setError(error as string);
        }
    }

    return (
        <main className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 md:px-8">
            {/* Delete confirmation modal */}
            {isViewingDeletionModal && (
                <DeleteConfirmation
                    onClose={() => setIsViewingDeletionModal(false)}
                    onConfirm={handleConfirmDeleteQueue}
                />
            )}

            {/* Queue management modal */}
            {isViewingManagementModal && (
                <QueueManagementModal
                    setTickets={setTickets}
                    tickets={tickets}
                    onUpdateQueue={onUpdateQueue}
                    queue={currentQueue}
                    setIsViewingManagementModal={setIsViewingManagementModal}
                    onQueueClosing={removeTicketsWhenClosed}
                    onTimeChange={handleUpdateQueueTime}
                />
            )}

            <div className="mx-auto w-full max-w-5xl">
                <header className="mb-6 sm:mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                        Manage queues
                    </h1>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
                        Create queues for your courses and remove ones you no longer need.
                    </p>
                </header>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 md:p-6">
                    <p className="text-sm font-medium tracking-tight text-slate-900 sm:text-base">
                        Create a queue
                    </p>

                    {error && (
                        <p role="alert" className="mt-3 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <form
                        className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
                        onSubmit={handleCreateQueue}
                    >
                        <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-600">
                            Course
                            <input
                                list="active-courses"
                                value={courseId}
                                onChange={(event) => setCourseId(event.target.value)}
                                placeholder="Select or enter a course code"
                                className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                            />
                            {/* List of currently active seeded courses */}
                            <datalist id="active-courses">
                                {courses.map((course) => (
                                    <option key={course.id} value={course.code}>
                                        {course.semester}
                                    </option>
                                ))}
                            </datalist>
                        </label>

                        <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-600">
                            Location
                            <input
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                                placeholder="e.g. Zachary - Room 240"
                                className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                            />
                            
                        </label>
                        {/* Start Time */}
                        <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-600">
                            Start Time
                            <input
                                type='time'
                                value={startTime}
                                onChange={(event) => setStartTime(event.target.value)}
                                placeholder="e.g. Zachary - Room 240"
                                className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                            />
                            
                        </label>

                        {/* End Time */}
                        <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-600">
                            End Time
                            <input
                                type='time'
                                value={endTime}
                                onChange={(event) => setEndTime(event.target.value)}
                                placeholder="e.g. Zachary - Room 240"
                                className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={isCreating || !courseId || !location.trim() || !user}
                            className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 lg:col-span-1 lg:w-auto"
                        >
                            <Plus className="size-4 shrink-0" />
                            <span className="truncate">{isCreating ? 'Creating…' : 'Create queue'}</span>
                        </button>
                    </form>
                </section>

                <section className="mt-8">
                    <div className="mb-4 flex items-baseline justify-between gap-3">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Your queues
                        </h2>
                        <span className="text-sm tabular-nums text-slate-400">
                            {createdQueues.length}
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
                            Loading queues…
                        </div>
                    ) : createdQueues.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <Plus className="size-5" />
                            </div>
                            <p className="mt-4 font-medium text-slate-900">No queues yet</p>
                            <p className="mt-1 text-sm text-slate-500">
                                Use the form above to create your first queue.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                            {createdQueues.map((queue) => (
                                <article
                                    key={queue.id}
                                    className="flex flex-col rounded-2xl border border-black/20 bg-white p-6"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-xl font-semibold tracking-tight text-neutral-900">
                                                {courses.find((course) => course.id === queue.courseId)?.code ?? queue.courseId}
                                            </h3>
                                            <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm text-neutral-500">
                                                <MapPin color='red' className="size-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} aria-hidden />
                                                <span className="truncate">Location: {queue.location}</span>
                                            </div>
                                            <span className="mt-1 block text-sm text-neutral-500">
                                                Time: {formatQueueTime(queue.startsAt)}
                                                {queue.endsAt ? ` – ${formatQueueTime(queue.endsAt)}` : ''}
                                            </span>
                                        </div>
                                        <span
                                            className={`shrink-0 text-xs font-medium tracking-wide ${
                                                queue.isOpen
                                                    ? 'text-emerald-700'
                                                    : 'text-neutral-400'
                                            }`}
                                        >
                                            {queue.isOpen ? 'Open' : 'Closed'}
                                        </span>
                                    </div>

                                    <div className="mt-8 flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenManagementModal(queue)}
                                            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-green-900 px-3 py-2.5 text-sm font-medium text-green-900 transition duration-100 ease-in-out hover:bg-green-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Settings2 className="size-4 shrink-0" />
                                            <span>Manage</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenDeleteModal(queue.id)}
                                            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-500 px-3 py-2.5 text-sm font-medium text-red-600 transition duration-100 ease-in-out hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Trash2 className="size-4 shrink-0" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}
