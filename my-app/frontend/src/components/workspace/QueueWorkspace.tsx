import { useEffect, useState } from 'react'
import { LuCheck } from 'react-icons/lu'
import type { NotificationType, Queue, QueueTicket, QueueTicketWithStudent } from '@shared/types'
import { Button } from '../ui/button'
import { WorkspaceColumn } from './WorkspaceColumn'
import { WorkspaceTicketCard } from './WorkspaceTicketCard'
import { useRef } from 'react'
import axios from 'axios'

interface QueueWorkspaceProps {
    queue?: Queue | null
    tickets: QueueTicketWithStudent[]
    completedTickets: QueueTicket[]
    onUpdateTickets: () => void | Promise<void>
    onUpdateCompleted: () => void | Promise<void>
    onNotifyInSession: (studentId: string, type: NotificationType, ticket: QueueTicket) => void 
}

export const QueueWorkspace = ({ tickets, queue, onUpdateTickets, completedTickets, onUpdateCompleted, onNotifyInSession }: QueueWorkspaceProps) => {
    const waiting = tickets.filter((t) => t.status === 'WAITING')
                            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const nextTicket = waiting[0] ?? null
    const inSession = tickets.find((t) => t.status === 'HELPING') ?? null

    const [seconds, setSeconds] = useState(0);
    const [sesssionSecs, setSessionSeconds] = useState(0);
    const [busy, setBusy] = useState(false);
    const timerId = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerId.current) clearInterval(timerId.current);
        };
    }, []);

    const moveNextToSession = async () => {
        if (!nextTicket || inSession || busy) return
        setBusy(true);
        try {
            // Mark ticket as helping
            await axios.patch(`/api/queueticket/${nextTicket.id}/status/helping`);
            await onUpdateTickets()
            setTimeElapsed();

            onNotifyInSession(nextTicket.studentId, 'ASSIST', nextTicket);
        } catch (error) {
            console.log('Failed to start helping', error);
        } finally {
            setBusy(false);
        }
    }

    // Every time a ticket is done, it will refresh the and resync tickets
    const completeSession = async () => {
        if (!inSession || busy) return;
        const done = inSession;
        setBusy(true);
        try {
            await axios.patch(`/api/queueticket/${done.id}/status/completed`); // mark ticket as completed will remove from active list
            await onUpdateTickets();    // sync current active tickets
            await onUpdateCompleted();  // sync completed tickets
            setSessionSeconds(seconds);
            endTimeElapsed();
        } catch (error) {
            console.log('Failed to complete ticket', error);
        } finally {
            setBusy(false);
        }
    }

    const setTimeElapsed = () => {
        setSeconds(0);
        if (timerId.current) clearInterval(timerId.current);
        timerId.current = setInterval(() => {
            setSeconds((prev) => prev + 1)
        }, 1000);
    }
    
    const endTimeElapsed = () => {
        if (timerId.current) {
            clearInterval(timerId.current);
            timerId.current = null;
        }
        setSeconds(0);
    }

    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remSecs = (seconds % 60).toString().padStart(2, '0');

    // Remove tickets from Completed Workspace
    const clearALlCompletedTickets = async () => {
        const queueId = queue?.id;
        const response = await axios.delete(`/api/queueticket/queues/${queueId}/status/completed`);
        // refresh active tickets
        await onUpdateCompleted();
        await onUpdateTickets();
        return response;
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 bg-slate-100 px-3 pb-4 pt-3 sm:px-4">
            {/* Active lane: Next (1) + In Session (1) */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:grid-rows-1">
                <WorkspaceColumn
                    title="Next"
                    count={nextTicket ? 1 : 0}
                    emptyLabel="No ticket waiting"
                >
                    {/* Move a ticket from WAITING to HELPING */}
                    {nextTicket ? (
                        <WorkspaceTicketCard
                            ticket={nextTicket}
                            accent="next"
                            action={
                                <Button
                                    size="icon-sm"
                                    variant="outline"
                                    disabled={Boolean(inSession) || busy}
                                    onClick={moveNextToSession}
                                    aria-label="Move ticket into session"
                                    className="min-h-8 min-w-8 border-blue-300 text-blue-700 hover:bg-blue-100 disabled:opacity-40"
                                >
                                    <LuCheck size={16} />
                                </Button>
                            }
                        />
                    ) : null}
                </WorkspaceColumn>

                <WorkspaceColumn
                    title="In session"
                    count={inSession ? 1 : 0}
                    emptyLabel="No ticket in session"
                >
                    {/* Mark a ticket as complete */}
                    {inSession ? (
                        <WorkspaceTicketCard
                            ticket={inSession}
                            accent="session"
                            action={
                                <Button
                                    size="sm"
                                    onClick={completeSession}
                                    disabled={busy}
                                    className="min-h-8 bg-emerald-600 px-3 text-white hover:bg-emerald-700"
                                >
                                    Complete
                                </Button>
                            }
                        />
                    ) : null}
                    <p className="mt-auto pt-2 text-xs tabular-nums text-slate-500">
                        Time elapsed: {mins}:{remSecs}
                    </p>
                </WorkspaceColumn>
            </div>

            {/* Completed lane: many */}
            <WorkspaceColumn
                title="Completed"
                count={completedTickets.length}
                emptyLabel="Completed tickets will appear here"
                className="min-h-[120px] flex-1 sm:min-h-[140px]"
                onClearCompletedTickets={clearALlCompletedTickets}
            >
                {completedTickets.length > 0
                    ? completedTickets.map((ticket) => (
                          <WorkspaceTicketCard
                              key={ticket.id}
                              ticket={ticket}
                              accent="done"
                              time={sesssionSecs}
                          />
                      ))
                    : null}
            </WorkspaceColumn>

            <p className="shrink-0 text-right text-xs text-slate-500">
                Tickets served: {completedTickets.length}
            </p>
        </div>
    )
}
