import { useState, type FormEvent } from 'react'
import { MapPin, Plus, Settings2, Trash2 } from 'lucide-react'
import type { Course, Queue } from '@shared/types'
import { useAuth } from '@/context/AuthContextProvider'
import { DeleteConfirmation } from './DeleteConfirmationModal'
import { QueueManagementModal } from './QueueManagementModal'

export interface CreateQueueInput {
    courseId: string
    taId:     string
    location: string
    isOpen:   boolean
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
    // TA workspace
    const [isViewingManagementModal, setIsViewingManagementModal] = useState(false);
    const [currentQueue, setCurrentQueue] = useState<Queue | null>(null);

    const { user } = useAuth();

    const handleCreateQueue = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!courseId || !location.trim() || !user) return

        try {
            setIsCreating(true)
            setError(null)
            await onCreateQueue({
                courseId,
                taId: user.id,
                location: location.trim().toUpperCase(),
                isOpen: true,
            })
            setCourseId('')
            setLocation('')
        } catch {
            setError('Unable to create the queue. Please try again.')
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

    // Queue Management
    const handleOpenManagementModal = async (queue: Queue) => {
        setCurrentQueue(queue);
        setIsViewingManagementModal(true);
    }

    return (
        <main className="min-h-full bg-slate-50 px-5 py-8 sm:px-8">
            {/* Delete confirmation modal */}
            { isViewingDeletionModal && (
                    <DeleteConfirmation 
                        onClose={() => setIsViewingDeletionModal(false)}
                        onConfirm={handleConfirmDeleteQueue} 
                    />
                )}
            
            {/* Queue management modal */}
            { isViewingManagementModal && (
                <QueueManagementModal onUpdateQueue={onUpdateQueue} queue={currentQueue} setIsViewingManagementModal={setIsViewingManagementModal}/>
            )}

            <div className={`mx-auto max-w-5xl`}>
                <header className="mb-8">
                    <p className="text-sm font-medium text-blue-600">Queue management</p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                        Manage queues
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Create queues for your courses and remove queues you no longer need.
                    </p>
                </header>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Create a queue</h2>

                    {error && (
                        <p role="alert" className="mt-3 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <form
                        className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                        onSubmit={handleCreateQueue}
                    >
                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                            Course
                            <input
                                list="active-courses"
                                value={courseId}
                                onChange={(event) => setCourseId(event.target.value)}
                                placeholder="Select or enter a course code"
                                className="h-10 rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                            Location
                            <input
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                                placeholder="e.g. Zachary - Room 240"
                                className="h-10 rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={isCreating || !courseId || !location.trim() || !user}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="size-4" />
                            {isCreating ? 'Creating…' : 'Create queue'}
                        </button>
                    </form>
                </section>

                <section className="mt-8">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Your queues</h2>
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {createdQueues.length} {createdQueues.length === 1 ? 'queue' : 'queues'}
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
                            <h3 className="mt-4 font-medium text-slate-900">No queues yet</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Use the form above to create your first queue.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {createdQueues.map((queue) => (
                                <article
                                    key={queue.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">
                                                {courses.find((course) => course.id === queue.courseId)?.code ?? queue.courseId}
                                            </h3>
                                            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                                                <MapPin className="size-4" />
                                                {queue.location}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                queue.isOpen
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {queue.isOpen ? 'Open' : 'Closed'}
                                        </span>
                                    </div>
                                    {/* Manage queue */}
                                    <button
                                        type="button"
                                        onClick={() => handleOpenManagementModal(queue)}
                                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-900 px-3 py-2 
                                            transition-background duration-100 ease-in-out hover:bg-green-900 hover:text-white text-sm font-medium text-green-900 transition disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Settings2 className="size-4" />
                                        <span>Manage</span>
                                    </button>

                                    {/* Delete queue */}
                                    <button
                                        type="button"
                                        onClick = {() => handleOpenDeleteModal(queue.id)}
                                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500 px-3 py-2 
                                        duration-100 transition-background ease-in-out text-sm font-medium text-red-600 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Trash2 className="size-4" />
                                        <span>Delete</span>
                                    </button>

                                   
                                </article>
                            ))}
                            
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}
