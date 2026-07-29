import type { QueueTicket, QueueTicketsListResponse, QueueTicketResponse } from '../../../shared/types'
import React from 'react'

interface QueueTicketProps {
  // chronological order
  queueTickets: QueueTicket[]
}

export const QueueTicketComp = ({ queueTickets }: QueueTicketProps) => {
  if (queueTickets.length === 0) return null;
  
  return (
    <ul className="w-full max-h-60 overflow-y-auto space-y-3 p-1">
      {queueTickets.map((qt) => (
        <li 
          key={qt.studentId} 
          className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Joined At
            </span>
            <span className="text-sm font-medium text-gray-700">
              {String(qt.joinedAt)}
            </span>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Position
            </span>
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold text-indigo-700 bg-indigo-50 rounded-full min-w-8 text-center">
              #{qt.position}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
