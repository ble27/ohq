import { Link } from 'react-router-dom'

export const Body = () => {
  return (
    <div className="flex flex-col items-center h-auto bg-white mt-12 sm:mt-20 mb-20"> 
      
      <div className="pt-10 flex flex-col justify-center items-center w-100 text-lg sm:text-2xl lg:w-full font-semibold text-center mb-5 lg:mb-18 sm:mb-20">
        <p>Don't wait to get help! Select a class and receive live updates for office hours seamlessly.</p>
        
        <span className="mt-2 justify-center items-center w-80 text-base md:text-lg lg:w-full sm:text-lg font-light text-center">
          Alert when a TA/PT is available for help
        </span>
        <span className="mt-2 justify-center items-center w-80 text-base md:text-lg lg:w-full sm:text-xl font-light text-center">
          Remove stress about waiting
        </span>
      </div> 

      <Link 
        to="/dashboard" 
        className='w-1/3 font-inter bg-black text-white p-3 rounded-full text-center mb-4 block hover:bg-gray-800'>
        Join Now
      </Link>
    </div>
  );
};
