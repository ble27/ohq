import React, { useState } from 'react'
import axios, { create } from 'axios'
import { QueueModal } from './QueueModal'
import type {
  NotificationResponse,
  NotificationType,
  Queue,
  QueueTicket,
  QueuesListResponse,
  QueueTicketResponse,
  QueueTicketsListResponse,
} from '@shared/types';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContextProvider';

const ACTIVE_TICKET_STATUSES = new Set(['WAITING', 'HELPING']);

// Props type interface with setter
interface ClassSelectorProps { 
  CSCEClasses: string[]; 
  selectedClass: string; 
  setSelectedClass: (value: string) => void; 
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({ CSCEClasses, selectedClass, setSelectedClass }) => { 
    const { user } = useAuth();
    const [queue, setQueue] = useState<Queue[]>([]);
    // Load a modal only for selected queue
    const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [ticket, setTicket] = useState<QueueTicket | null>(null);
    const [isViewingQueue, setIsViewingQueue] = useState(false);
    const [joinedQueueIds, setJoinedQueueIds] = useState<Set<string>>(() => new Set());
    const [myTicketsByQueueId, setMyTicketsByQueueId] = useState<Map<string, QueueTicket>>(
        () => new Map(),
    );
    
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

    // fetch queues are not currently fetching the correct selected class
    const fetchQueue = async (): Promise<void> => { 
        try { 
            // selectedClass = course code not courseId
            const courseId = (await axios.get(`/api/courses/${selectedClass}`)).data.courseId;

            // Remove previously selected class's that doesn't match new courseId
            // so that when user switches to a new class and refetches, the old class id doesn't persist
            setQueue((prev) => prev.filter((q) => q.courseId === courseId));
            
            const response = await axios.get<QueuesListResponse>(`/api/queues/course/${courseId}`); 
            if (response.data.queues.length === 0) {
              setQueue([]);
              console.log('No active queues found');
              await syncJoinedQueuesFromServer();
              return;
            }
            const activeQueuesList: Queue[] = response.data.queues;

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
      {/* Class selector available at /dashboardc#class */} 
      <div className='flex flex-col w-full h-full pl-8 pt-10'> 
        <label htmlFor="csce_choices">Select a class</label> 

        {/* Background around search fields */}
        <div className='flex flex-row mt-2 items-center'> 
          <select 
            name="csce_choices" 
            id="csce_choices" 
            className='text-lg w-1/3 border-slate-300 border-1 shadow-inner rounded-lg p-2 outline-none' 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)} 
          > 
            {CSCEClasses.map((courseNum: string, index: number) => ( 
              <option key={index} value={courseNum}>{courseNum}</option> 
            ))} 
          </select> 
          <Button 
            variant={'default'}
            size={'lg'}
            // Fetch should only fetch active and selected queues, not queues that are closed
            // It shouldn't fetch queue that were active from other code when switching
            onClick={fetchQueue} 
            className='ml-4 mr-2 pointer-events-auto'
          > 
            Enter 
          </Button> 

           <Button 
            variant={'default'}
            size={'lg'}
            onClick={clearQueue} 
            className='pointer-events-auto'
          > 
            Clear
          </Button> 
        </div> 

        <div className='mt-8 h-full w-full'>
          <h3 className='text-lg font-medium mb-3'>Active Queue ({visibleQueues.length})</h3>
          {visibleQueues.length === 0 ? (
            <p className='text-gray-500 text-sm'>No active queues loaded. Click "Enter" to fetch.</p>
          ) : (
            // Background around Queue cards
            <div className='grid grid-cols-1 justify-center md:grid-cols-2 bg-white lg:grid-cols-3 gap-10 w-100 md:w-full h-80 md:h-50 space-y-2 pr-5 '>
              {visibleQueues.map((q) => (
                // Actual Queue card
                <div key={q.id} className='relative p-3 flex border rounded-lg bg-gray-50 flex justify-between border-gray-300 border-1 shadow-inner'>
                  <div className='flex flex-col h-40 mb-2'>
                    <p className='font-semibold text-sm'>Course: {q.courseId}</p>
                    <p className='text-xs text-gray-500'>Location: {q.location}</p>

                    <div className='absolute bottom-2 right-2 flex flex-row gap-2'>
                      
                      {/* Join queue */}
                      {
                        // Only display if the queue hasn't been joined
                        !joinedQueueIds.has(q.id) &&
                         <Button
                         onClick={() => void handleJoinQueue(q)}
                         disabled={!q.isOpen}
                         variant='default'
                         className={'join-btn'}
                        >
                          Join
                        </Button>
                      }
                     

                        {/* View a queue modal button */}
                        <Button
                          // Pass the ticket along when viewing the queue
                            onClick={() => handleViewQueue(q)}
                            variant='outline'
                        >
                            View
                        </Button>
                        {/* Clear all tickets from a queue modal button */}
                        <Button
                            onClick={() => clearAllTickets(q.id)}
                            variant='destructive'
                        >
                            Delete Tickets
                        </Button>
                    </div>

                  </div>
                  <span className={`text-xs px-2 py-1 h-fit rounded ${q.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {q.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              ))}
              {/* Render a modal for each selected queue and when isModalOpen  */}
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
            </div>
          )}
        </div>
      </div> 
    </> 
  );
};
