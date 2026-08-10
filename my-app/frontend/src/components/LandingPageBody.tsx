import { LuMoveUpRight } from 'react-icons/lu';
import { Link } from 'react-router-dom'

export const Body = () => {
  return (
    <div className="flex flex-col items-center text-black bg-yellow-50/30"> 
      <div className="flex flex-col h-100 pt-40 md:pt-45 lg:pt-50 text-3xl sm:text-4xl md:text-5xl 
      pl-12 sm:pl-15 md:pl-20 lg:pl-30 xl:pl-35 leading-10 md:leading-14 lg:leading-16 font-sans 
      h-screen w-full max-w-[900px] font-semibold mb-5 mr-5">
        <div>
          <span>Select a class and receive <br/></span>
          <span> live updates for office hours.</span>
        </div>
        <div className='flex flex-col mt-3 gap-1 text-3xl'>
          <p className="font-light w-[420px] sm:w-[450px] md:w-[500px] lg:w-[600px] mt-3 mb-3 md:mt-4 md:mb-4 
          leading-7 lg:leading-8 text-base md:text-lg lg:text-xl font-light">
            Get notified the instant a TA or PT is free, so you can focus on the work that matter in the meantime.
          </p>
        </div>
        <Link 
          to="/signin" 
          className='bg-yellow-300/80 border border-black/50 w-25 h-10 md:w-30 md:h-12 flex justify-center items-center transition-all ease-in-out duration-500
          text-black tracking-tight font-normal text-sm md:text-base py-1.5 mt-5 text-lg font-normal rounded-sm text-center block hover:opacity-90'>
            Join Now <LuMoveUpRight className='ml-1'/>
        </Link>

       
      </div> 

      {/* Hero Section */}
        <div className='w-full h-220 mt-40 md:mt-60 lg:mt-80'>
        <span className='pl-8 md:pl-16 lg:pl-18 text-5xl'> Built to... </span>
          {/* Cards section */}
          <div className='grid grid-cols-1 lg:grid-cols-2 p-5 md:px-15
                          mt-5 gap-15'>

            {/* Card 1*/}
            <div className='flex flex-col bg-yellow-200 border-1 border-black/50 h-120 rounded-3xl'>
              <div className='flex flex-col h-full pl-4'>
                  <div className='flex flex-2 pt-5 pl-1 font-semibold'>
                    Event loops
                  </div>
                  <div className='flex flex-col flex-2 text-5xl md:text-6xl lg:text-5xl lg:tracking-tight'>
                      Sync in real time
                      <span className='text-lg lg:text-xl lg:text-xl lg:pr-3 lg:tracking-normal md:text-base mt-3 pl-1'> Courses update and notify when it is your turn</span>
                  </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className='flex flex-col bg-orange-200 border-1 border-black/50 h-120 rounded-3xl'>
              <div className='flex flex-col h-full pl-4'>
                  <div className='flex flex-1 pt-5 pl-1 font-semibold'>
                    Location Alert
                  </div>
                  <div className='flex flex-col flex-1 text-5xl md:text-6xl lg:text-5xl lg:tracking-tight'>
                      Move conveniently
                      <span className='text-lg lg:text-xl lg:pr-3 lg:tracking-normal md:text-base mt-3 pl-1'> Track sections on your time </span>
                  </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className='flex flex-col bg-emerald-200 border-1 border-black/50 h-120 rounded-3xl'>
              <div className='flex flex-col h-full pl-4'>
                  <div className='flex flex-2 pt-5 pl-1 font-semibold'>
                    Peer assistance
                  </div>
                  <div className='flex flex-col flex-2 text-5xl md:text-6xl lg:text-5xl lg:tracking-tight'>
                      Help each other
                      <span className='text-lg lg:text-xl lg:pr-3 lg:tracking-normal md:text-base mt-3 pl-1'>Interactions aimed for better growth and learning</span>
                  </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className='flex flex-col bg-blue-200 border-1 border-black/50 h-120 rounded-3xl'>
              <div className='flex flex-col h-full pl-4'>
                  <div className='flex flex-2 pt-5 pl-1 font-semibold'>
                    Management Platform
                  </div>
                  <div className='flex flex-col flex-2 text-5xl md:text-6xl lg:text-5xl lg:tracking-tight'>
                      Manage freely
                      <span className='text-lg lg:text-xl lg:pr-3 lg:tracking-normal md:text-base mt-3 pl-1'>Modals designed to enhance TA workspace experience</span>
                  </div>
              </div>
            </div>

          </div>
        </div>
    </div>
  );
};
