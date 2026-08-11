import React, { useState } from 'react'
import axios from 'axios'
import { ChevronDown, MapPin } from 'lucide-react'
import { QueueModal } from './QueueModal'
import type {
  NotificationResponse,
  NotificationType,
  Queue,
  QueueTicket,
  QueuesListResponse,
  QueueTicketResponse,
  QueueTicketsListResponse,
  QueueWithTA,
} from '@shared/types';
import { useAuth } from '@/context/AuthContextProvider';
import { InactiveQueueModal } from './InactiveQueueModal';

const ACTIVE_TICKET_STATUSES = new Set(['WAITING', 'HELPING']);

// Props type interface with setter
interface ClassSelectorProps { 
  CSCEClasses: string[]; 
  selectedClass: string; 
  setSelectedClass: (value: string) => void; 
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({ CSCEClasses, selectedClass, setSelectedClass }) => { 
    const { user } = useAuth();
    const [queue, setQueue] = useState<QueueWithTA[]>([]);
    // Load a modal only for selected queue
    const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [ticket, setTicket] = useState<QueueTicket | null>(null);
    const [isViewingQueue, setIsViewingQueue] = useState(false);
    const [joinedQueueIds, setJoinedQueueIds] = useState<Set<string>>(() => new Set());
    const [myTicketsByQueueId, setMyTicketsByQueueId] = useState<Map<string, QueueTicket>>(
        () => new Map(),
    );
    const [isInactiveModalOpen, setIsInactiveModalOpen] = useState(false);

    // Visible queues that will be displayed (will refresh every time queue changes)
    const visibleQueues = queue;

    // Membership must come from the server — client Set alone is lost on remount / Clear+Enter.
    const syncJoinedQueuesFromServer = async () => {
        if (!user?.id) return;

        // Return the list of tickets the current user has joined
        const response = await axios.get<QueueTicketsListResponse>(
            `/api/queueticket/user/${user.id}`,
        );
        const activeTickets = response.data.tickets.filter((t) =>
            ACTIVE_TICKET_STATUSES.has(t.status),
        );

        // Connect the queue id to the current ticket the user owns
        const nextMap = new Map(activeTickets.map((t) => [t.queueId, t]));
        setMyTicketsByQueueId(nextMap);
        setJoinedQueueIds(new Set(nextMap.keys()));
        setTicket((prev) => {
            if (prev) {
                // check if prev is in the newly refreshed map
                const refreshed = nextMap.get(prev.queueId);
                if (refreshed) return refreshed;
            }
            return null;
        });
    };

    // Pass in queue id of the ticket before even joining the queue
    const createTicket = async (queueId: string) =>  {
        try {
            // res: data: payload
            console.log('Calling createTicket from ClassSelector');
            const response = await axios.post<QueueTicketResponse>(`/api/queueticket/queues/${queueId}`, { status: 'WAITING' });
            console.log('Successfully created a new ticket');

            // Need to return ticket and ticket id to pass into QueueModal
            const ticket: QueueTicket = response.data.ticket;
            const ticketId: string = ticket.id;
            console.log(`My current ticket id ${ticketId}`);

            // Update ticket
            setTicket(ticket);
            setMyTicketsByQueueId((prev) => new Map(prev).set(queueId, ticket));
            return {ticket, ticketId};
        }
        catch (error) {
            console.log(`Failed to create a ticket ${error}`);
        }
    }

    // Fetch queue based on course ID
    const fetchQueue = async () => { 
        try { 
            // selectedClass = course code not courseId
            const courseId = (await axios.get(`/api/courses/${selectedClass}`)).data.courseId;

            // Remove previously selected class's that doesn't match new courseId
            // so that when user switches to a new class and refetches, the old class id doesn't persist
            setQueue((prev) => prev.filter((q) => q.courseId === courseId));
            
            const response = await axios.get<QueuesListResponse>(`/api/queues/course/${courseId}`); 
            if (response.data.queues.length === 0) {
              setQueue([]);
              setIsInactiveModalOpen(true);
              console.log('No active queues found');
              await syncJoinedQueuesFromServer();
              return;
            }

            const activeQueuesList: Queue[] = response.data.queues;

            // Set only active queues from course code
            setQueue((prevQueue) => {
                // Extract new items that do not exist in the current queue and match the new course idea
                const uniqueNewItems = activeQueuesList.filter(
                    (newItem) =>
                        !prevQueue.some((prevItem) => prevItem.id === newItem.id)
                );
 
                // Return original array if no new unique items exist
                if (uniqueNewItems.length === 0) return prevQueue;
                return [...prevQueue, ...uniqueNewItems];
            });
            // Rebuild Join/View from DB so Enter doesn't show Join after an existing membership
            await syncJoinedQueuesFromServer();
        } 
        catch (error) { 
            if (axios.isAxiosError(error)) { 
                console.error('Axios error message:', error.message); 
            } else { 
                console.error('Unexpected error:', error); 
            } 
        } 
    };

    const clearAllTickets = async (queueId: string) => {
      const response = await axios.delete(`/api/queueticket/queues/${queueId}`);
      if (response.status === 200) {
        console.log(`SUCCESSFULLY deleted all tickets from ${queueId}`);
        setJoinedQueueIds((prev) => {
          const next = new Set(prev);
          next.delete(queueId);
          return next;
        });
        setMyTicketsByQueueId((prev) => {
          const next = new Map(prev);
          next.delete(queueId);
          return next;
        });
        setTicket((prev) => (prev?.queueId === queueId ? null : prev));
        return;
      }
      console.log(`FAILED to delete all tickets from ${queueId}`);
    }

    const clearQueue = () => {
        setQueue([]);
    }

    // Create notification
    const createNotification = async (selectedQueue: Queue, type: NotificationType, ticketId: string) => {
      const queueId = selectedQueue.id;
      const taId = selectedQueue.taId;
      const response = await axios.post<NotificationResponse>(
        `/api/notifications/queues/${queueId}/user/${taId}/type/${type}`, { ticketId }
      );
      return response.data.notification;
    }

    // Remove Join button after a user has joined a queue
    const handleJoinQueue = async (selectedQueue: Queue) => {
      // createTicket returns ticket and ticketId from joinQueue
      const response = await createTicket(selectedQueue.id);
      if (!response) return;

      // Add joined queue ids
      setJoinedQueueIds((prev) => new Set(prev).add(selectedQueue.id));

      setIsViewingQueue(false);
      setSelectedQueue(selectedQueue);
      setModalOpen(true);

      // Create notification to TA on join
      await createNotification(selectedQueue, 'JOIN', response.ticketId);
    }

    const handleViewQueue = (selectedQueue: Queue) => {
      // Restore this queue's ticket so Leave works after a refetch
      setTicket(myTicketsByQueueId.get(selectedQueue.id) ?? null);
      setIsViewingQueue(true);
      setSelectedQueue(selectedQueue);
      setModalOpen(true);
    }

    const handleLeaveQueue = async (queueId: string) => {
      // Create notification to TA on leave
      if (!selectedQueue) return;

      // hmap : queueId -> ticket
      const ticketId = myTicketsByQueueId.get(queueId)?.id as string;
      
      await createNotification(selectedQueue, 'LEAVE', ticketId);

      setJoinedQueueIds((prev) => {
        const next = new Set(prev);
        next.delete(queueId);
        return next;
      });
      setMyTicketsByQueueId((prev) => {
        const next = new Map(prev);
        next.delete(queueId);
        return next;
      });
      setTicket(null);
      setModalOpen(false);
      
    }

  return ( 
    <> 
      {isInactiveModalOpen && (
        <InactiveQueueModal
          selectedClass={selectedClass}
          setIsInactiveModalOpen={setIsInactiveModalOpen}
        />
      )}

      <div className="flex h-full w-full flex-col bg-neutral-50 px-6 pb-10 pt-10 sm:px-8 md:px-10">
        <header className="max-w-xl">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Select a class
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 sm:text-base">
            Choose a course to load active office hour queues.
          </p>
        </header>

        {/* Class search */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs min-w-[12rem] flex-1 sm:max-w-sm">
            <select
              name="csce_choices"
              id="csce_choices"
              aria-label="Select a class"
              className="h-11 w-full cursor-pointer appearance-none rounded-full border border-neutral-300 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-neutral-900 outline-none transition focus:border-neutral-500"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {CSCEClasses.map((courseNum: string, index: number) => (
                <option key={index} value={courseNum} className="bg-white text-neutral-900">
                  {courseNum}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
              strokeWidth={1.75}
            />
          </div>

          <button
            type="button"
            onClick={fetchQueue}
            className="h-11 rounded-full border border-neutral-900 bg-neutral-900 px-5 text-sm font-medium text-white transition hover:opacity-80"
          >
            Enter
          </button>

          <button
            type="button"
            onClick={clearQueue}
            className="h-11 rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50"
          >
            Clear
          </button>
        </div>

        <section className="mt-10 w-full">
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              Active queues
            </h2>
            <span className="text-sm text-neutral-400">{visibleQueues.length}</span>
          </div>

          {visibleQueues.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No active queues loaded. Click Enter to fetch.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {visibleQueues.map((q) => {
                const taLabel = q.ta?.name ?? q.ta?.email ?? '—'
                const courseLabel = q.course?.code ?? selectedClass
                const hasJoined = joinedQueueIds.has(q.id)

                return (
                  <article
                    key={q.id}
                    className="flex flex-col rounded-2xl border border-black/30 bg-white p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-semibold tracking-tight text-neutral-900">
                         {courseLabel}
                        </h3>
                        <p className="mt-1 truncate text-sm text-neutral-500">TA: {taLabel}</p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-medium tracking-wide ${
                          q.isOpen ? 'text-emerald-700' : 'text-neutral-400'
                        }`}
                      >
                        {q.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-1.5 text-sm text-neutral-600">
                      <MapPin className="size-3.5 shrink-0 text-neutral-400" strokeWidth={2} color='red' aria-hidden />
                      <span className="truncate">{q.location || '—'}</span>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-2">
                      {!hasJoined && (
                        <button
                          type="button"
                          onClick={() => void handleJoinQueue(q)}
                          disabled={!q.isOpen}
                          className="rounded-full border border-neutral-900 bg-[#500000] px-4 py-2 text-sm font-medium text-white transition 
                          hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Join
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleViewQueue(q)}
                        className="rounded-full border border-neutral-600 text-black bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition 
                        hover:bg-yellow-500" 
                      >
                        View
                      </button>
                      {/* <button
                        type="button"
                        onClick={() => void clearAllTickets(q.id)}
                        className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-500 transition hover:border-neutral-400 hover:text-neutral-800"
                      >
                        Clear tickets
                      </button> */}
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {isModalOpen && selectedQueue && (
            <QueueModal
              queue={selectedQueue}
              ticket={ticket}
              isModalOpen={isModalOpen}
              isViewingQueue={isViewingQueue}
              joinedQueueIds={joinedQueueIds}
              setModalOpen={setModalOpen}
              onLeaveQueue={handleLeaveQueue}
            />
          )}
        </section>
      </div>
    </>
  );
};
