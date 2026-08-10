import { LuHandHelping, LuMoveUpRight } from 'react-icons/lu';
import { Link } from 'react-router-dom'
import { Handshake, RefreshCw, Move, FolderOpen } from 'lucide-react';

export const Body = () => {
  return (
   <div className="flex flex-col items-center text-black bg-yellow-50"> 
      <div className="flex flex-col pt-35 sm:pt-32 md:pt-40 lg:pt-48 text-3xl sm:text-4xl md:text-5xl 
      pl-12 sm:pl-15 md:pl-20 lg:pl-30 xl:pl-35 leading-10 md:leading-14 lg:leading-16 font-sans 
      w-full max-w-[900px] font-medium mb-28 mr-5">
        <div>
          <span>Select a class and receive <br/></span>
          <span> live updates for office hours.</span>
        </div>
        <div className='flex flex-col mt-3 gap-1 text-3xl'>
          <p className="font-light w-[420px] sm:w-[450px] md:w-[500px] lg:w-[600px] mt-3 mb-3 md:mt-4 md:mb-4 
          leading-7 lg:leading-8 text-base md:text-lg lg:text-xl font-light">
            Get notified the instant a TA or PT is free, so you can focus on the work that matters in the meantime.
          </p>
        </div>
        <Link 
          to="/signin" 
          className='bg-yellow-300/80 border border-black/80 w-25 h-10 md:w-30 md:h-12 flex justify-center items-center transition-all ease-in-out duration-500
          text-black tracking-tight font-normal text-sm md:text-base py-1.5 mt-5 text-lg font-normal rounded-full text-center block hover:opacity-90'>
            Join Now <LuMoveUpRight className='ml-1'/>
        </Link>
      </div> 

      {/* Hero Section */}
      <div className='w-full pt-24 md:pt-32 lg:pt-40'>
        <span className='pl-8 md:pl-16 lg:pl-18 text-3xl md:text-4xl lg:text-5xl'> Built to... </span>
          {/* Cards section */}
          <div className='grid grid-cols-1 lg:grid-cols-2 p-5 md:px-15
                          mt-5 gap-15'>

            {/* Card 1*/}
            <div className='flex flex-col bg-yellow-200 border-2 border-black/50 min-h-120 rounded-3xl'>
              <div className='flex flex-col h-full pl-4'>
                  <div className='flex flex-2 pt-5 pl-1 pr-7 lg:text-xl font-semibold justify-between items-start'>
                    <span>Event loops</span> 
                    <RefreshCw strokeWidth={1.5} size={45}/>
                  </div>
                  <div className='flex flex-col flex-2 text-4xl md:text-6xl lg:text-5xl lg:tracking-tight pb-6'>
                      Sync in real time
                      <span className='text-lg lg:text-xl lg:pr-3 lg:tracking-normal md:text-base mt-3 pl-1'> Courses update and notify when it is your turn</span>
                  </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className='flex flex-col bg-orange-200 border-2 border-black/50 min-h-120 rounded-3xl'>
              <div className='flex flex-col h-full pl-4'>
                  <div className='flex flex-2 pt-5 pl-1 pr-7 lg:text-xl font-semibold justify-between items-start'>
                    Location Alert
                    <Move strokeWidth={1.2} size={45}/>
                  </div>
                  <div className='flex flex-col flex-2 text-4xl md:text-6xl lg:text-5xl lg:tracking-tight pb-6'>
                      Move conveniently
                      <span className='text-lg lg:text-xl lg:pr-3 lg:tracking-normal md:text-base mt-3 pl-1'> Track sections on your time </span>
                  </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className='flex flex-col bg-emerald-200 border-2 border-black/50 min-h-120 rounded-3xl overflow-hidden'>
              <div className='flex flex-col h-full pl-4'>
                  <div className='flex flex-2 pt-5 pl-1 pr-7 lg:text-xl font-semibold justify-between items-start'> 
                    <span>Peer assistance</span> 
                    <div>
                      <Handshake strokeWidth={1.2} size={60}/>
                    </div> 
                  </div>
                  <div className='flex flex-col flex-2 text-4xl md:text-6xl lg:text-5xl lg:tracking-tight pb-6'>
                      Help each other
                      <span className='text-lg lg:text-xl lg:pr-3 lg:tracking-normal md:text-base mt-3 pl-1'>Interactions aimed for better growth and learning</span>
                  </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className='flex flex-col bg-blue-200 border-2 border-black/50 min-h-120 rounded-3xl'>
              <div className='flex flex-col h-full pl-4'>
                  <div className='flex flex-2 pt-5 pl-1 pr-7 lg:text-xl font-semibold justify-between items-start'>
                    Management UI
                    <FolderOpen strokeWidth={1.2} size={50}/>
                  </div>
                  <div className='flex flex-col flex-2 text-4xl md:text-6xl lg:text-5xl lg:tracking-tight pb-6'>
                      Manage freely
                      <span className='text-lg lg:text-xl lg:pr-3 lg:tracking-normal md:text-base mt-3 pl-1'>Modals designed to enhance TA workspace experience</span>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics and trusted by */}
        <div className='w-full py-30 md:py-40 lg:py-50'>
          <div className='text-2xl md:text-4xl text-center'>Made for and trusted by <span>Students</span></div>
        </div>
        {/* Name section footer + privacy */}
        <div className='flex flex-col w-full py-20 pl-8 pr-8 bg-yellow-100/20 border-t-2 border-black/50'>
          <span className='flex flex-2 text-center text-6xl md:text-7xl lg:text-8xl 
            lg:tracking-tight justify-center mb-2'>Queueble</span>
          <span className='flex flex-1 text-lg text-center justify-center'>This website is not affiliated with <br/> Texas A&M University</span>
          <span className='flex flex-1 text-lg text-center justify-center'> @ 2026 Queueble</span>
        </div>
    </div>
  );
};
