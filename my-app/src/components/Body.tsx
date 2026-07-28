import React from 'react'

export const Body = () => {
  return (
    <div className="flex flex-col items-center w-full gap-4 mt-0 pt-0">
        <p className="pt-10 flex flex-col justify-center items-center w-full h-48 text-xl sm:h-20 sm:text-2xl font-semibold text-center mb-10">
            Select your class and receive live updates for office hours seamlessly.
            <span className="mt-5 justify-center items-center w-full h-48 md:text-lg sm:h-20 sm:text-xl font-light text-center"> 
                Alert when a TA/PT is available for help 
            </span>
            <span className="justify-center items-center w-full h-48 md:text-lg sm:h-20 sm:text-xl font-light text-center"> 
                Remove stress about waiting
            </span>
        </p>
        <button className='w-1/3 font-inter bg-black text-white p-3 rounded-full text-center'>
            Join Now
        </button>
    </div>

  )
}
