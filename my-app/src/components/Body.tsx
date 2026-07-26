import React from 'react'

export const Body = () => {
  return (
    <div className="flex flex-col items-center w-full gap-4">
        <p className="flex flex-col justify-center items-center w-full h-48 text-xl sm:h-20 sm:text-2xl font-semibold text-center mb-10">
            Select your class and receive live updates for office hours seamlessly.
            <span className="mt-5 justify-center items-center w-full h-48 text-xs sm:h-20 sm:text-2xl font-light text-center"> 
                Alert when a TA/PT is available for help 
            </span>
        </p>
        <button className='w-30 font-inter bg-black text-white p-3 rounded-lg text-center'>
            Join Now
        </button>
    </div>

  )
}
