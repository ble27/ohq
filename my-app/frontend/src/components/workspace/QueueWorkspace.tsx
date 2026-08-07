import { useEffect, useState } from 'react'
import { LuCheck } from 'react-icons/lu'
import type { QueueTicket } from '@shared/types'
import { Button } from '../ui/button'
import { WorkspaceColumn } from './WorkspaceColumn'
import { WorkspaceTicketCard } from './WorkspaceTicketCard'
import { useRef } from 'react'

interface QueueWorkspaceProps {
    tickets: QueueTicket[]
}

export const QueueWorkspace = ({ tickets }: QueueWorkspaceProps) => {
    // Local UI staging only — Next is always the head of the waiting list
    const [waiting, setWaiting] = useState<QueueTicket[]>(tickets)
    const [inSession, setInSession] = useState<QueueTicket | null>(null)
    const [completed, setCompleted] = useState<QueueTicket[]>([])
    const [seconds, setSeconds] = useState(0);
    const [sesssionSecs, setSessionSeconds] = useState(0);
    const timerId = useRef<number | null>(null);

    useEffect(() => {
        setWaiting(tickets)
        setInSession(null)
        setCompleted([])
    }, [tickets])

    const nextTicket = waiting[0] ?? null

    const moveNextToSession = () => {
        if (!nextTicket || inSession) return
        setInSession(nextTicket)
        setWaiting((prev) => prev.slice(1))
        setTimeElapsed();
    }

    const completeSession = () => {
        if (!inSession) return
        setCompleted((prev) => [inSession, ...prev])
        setInSession(null)
        setSessionSeconds(seconds)
        endTimeElapsed();
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

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 bg-slate-100 px-4 pb-4 pt-3">
            {/* Active lane: Next (1) + In Session (1) */}
            <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-1 gap-3">
                <WorkspaceColumn
                    title="Next"
                    count={nextTicket ? 1 : 0}
                    emptyLabel="No ticket waiting"
                >
                    {nextTicket ? (
                        <WorkspaceTicketCard
                            ticket={nextTicket}
                            accent="next"
                            action={
                                <Button
                                    size="icon-sm"
                                    variant="outline"
                                    disabled={Boolean(inSession)}
                                    onClick={moveNextToSession}
                                    aria-label="Move ticket into session"
                                    className="border-blue-300 text-blue-700 hover:bg-blue-100 disabled:opacity-40"
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
                    {inSession ? (
                        <WorkspaceTicketCard
                            ticket={inSession}
                            accent="session"
                            action={
                                <Button
                                    size="sm"
                                    onClick={completeSession}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    Complete
                                </Button>
                            }
                        />
                    ) : null}
                    <div className='flex absolute top-78 text-sm'> Time elapsed: {mins}:{remSecs} </div>
                </WorkspaceColumn>
            </div>

            {/* Completed lane: many */}
            <WorkspaceColumn
                title="Completed"
                count={completed.length}
                emptyLabel="Completed tickets will appear here"
                className="min-h-[140px] flex-1"
            >
                {completed.length > 0
                    ? completed.map((ticket) => (
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
                Tickets served: {completed.length}
            </p>
        </div>
    )
}
