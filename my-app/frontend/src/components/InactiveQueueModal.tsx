interface InactiveQueueModal {
    selectedClass: string
    setIsInactiveModalOpen: (value: boolean) => void
}
export const InactiveQueueModal = ({ selectedClass, setIsInactiveModalOpen }: InactiveQueueModal) => {
    return (
         <div className="fixed inset-0 z-50 flex items-center justify-center w-screen h-screen gap-3 bg-black/60">
            <div className='flex flex-col px-8 py-6 rounded-sm bg-gray-500/20 justify-center items-center text-center text-black bg-white'>
                <h1 className='font-semibold text-black'> No active queue found for course {selectedClass}.</h1>
                <h2 className='font-medium text-base text-black'> Try again with another course.</h2>
                <div className='flex flex-row gap-5 mt-5'>
                    <button
                        className='transition-all duration-200 ease-in-out hover:bg-red-500 hover:text-white font-semibold 
                        border-2 border-red-500 text-red-500 rounded-full px-3 py-2'
                        onClick={() => setIsInactiveModalOpen(false)}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
  )
}
