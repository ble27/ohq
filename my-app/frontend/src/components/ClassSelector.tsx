import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { QueueModal } from '../components/QueueModal'
import type { Queue, QueuesListResponse, QueueResponse } from '@shared/types';

// Props type interface with setter
interface ClassSelectorProps { 
  CSCEClasses: string[]; 
  selectedClass: string; 
  setSelectedClass: (value: string) => void; 
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({ CSCEClasses, selectedClass, setSelectedClass }) => { 
    const [queue, setQueue] = useState<Queue[]>([]);
    const [isModalOpen, setModalOpen] = useState(false);

    // Prev is the current value of queue, e.g.: [1,2 3,4]
    useEffect(() => {
        setQueue((prev) => prev.filter((q) => q.courseId === selectedClass || selectedClass === null));
    }, [selectedClass]);

    const fetchQueue = async (): Promise<void> => { 
        try { 
            const response = await axios.get<QueuesListResponse>('/api/queues'); 
            
            setQueue((prevQueue) => {
                // Extract new items that do not exist in the current queue and match the new course idea
                const uniqueNewItems = response.data.queues.filter(
                    (newItem) =>
                        !prevQueue.some((prevItem) => prevItem.id === newItem.id) &&
                        (selectedClass === null || newItem.courseId === selectedClass)
                );
 
                // Return original array if no new unique items exist
                if (uniqueNewItems.length === 0) return prevQueue;
                return [...prevQueue, ...uniqueNewItems];
            });
        } 
        catch (error) { 
            if (axios.isAxiosError(error)) { 
                console.error('Axios error message:', error.message); 
            } else { 
                console.error('Unexpected error:', error); 
            } 
        } 
    };
    const clearQueue = () => {
        setQueue([]);
    }
    const joinQueue = () => {
        setModalOpen(true);
    }
  return ( 
    <> 
      {/* Class selector available at /dashboardc#class */} 
      <div className='flex flex-col pl-8 pt-10 text-md font-md'> 
        <label htmlFor="csce_choices">CSCE</label> 
        <div className='flex flex-row mt-2'> 
          <select 
            name="csce_choices" 
            id="csce_choices" 
            className='text-lg w-1/3 border-black-200 border-1 shadow-inner rounded-lg p-2' 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)} 
          > 
            {CSCEClasses.map((courseNum: string, index: number) => ( 
              <option key={index} value={courseNum}>{courseNum}</option> 
            ))} 
          </select> 
          <button 
            onClick={fetchQueue} 
            className='ml-5 rounded-lg w-20 bg-black pl-3 pr-3 pt-2 pb-2 pointer-events-auto text-white hover:opacity-90'
          > 
            Enter 
          </button> 

           <button 
            onClick={clearQueue} 
            className='ml-5 rounded-lg w-20 bg-black pl-3 pr-3 pt-2 pb-2 pointer-events-auto text-white hover:opacity-90'
          > 
            Clear
          </button> 
        </div> 

        {/* 3. FIXED: Added UI elements to render and verify your state updates */}
        <div className='mt-8'>
          <h3 className='text-lg font-bold mb-3'>Active Queue ({queue.length})</h3>
          {queue.length === 0 ? (
            <p className='text-gray-500 text-sm'>No active queues loaded. Click "Enter" to fetch.</p>
          ) : (
            <div className='space-y-2 w-1/2'>
              {queue.map((item) => (
                <div key={item.id} className='p-3 border rounded-lg bg-gray-50 flex justify-between'>
                  <div>
                    <p className='font-semibold text-sm'>Course: {item.courseId}</p>
                    <p className='text-xs text-gray-500'>Location: {item.location}</p>
                     <button 
                            onClick={joinQueue}
                            className={`font-inter text-md w-auto text-black pointer-events-auto hover:text-blue-500
                                ${item.isOpen ? 'visible' : 'invisible'}`}
                        > 
                            {item.isOpen && 'Join'}
                        </button> 
                        {/* Queue Modal  */}
                       {isModalOpen && <QueueModal queue={item} isModalOpen={isModalOpen} setModalOpen={setModalOpen}/>}
                  </div>
    
                  <span className={`text-xs px-2 py-1 h-fit rounded ${item.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.isOpen ? 'Open' : 'Closed'}
                  </span>
                  
                   
                </div>
              ))}
            </div>
          )}
        </div>
      </div> 
    </> 
  );
};
