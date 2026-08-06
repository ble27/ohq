import { Link } from 'react-router-dom'

export const Body = () => {
  return (
    <div className="flex flex-col items-center text-black h-screen pt-8 mb-20"> 
      <div className="font-inter pt-25 sm:pt-30 md:pt-40 lg:pt-50 lg:text-5xl md:text-5xl pl-8 md:pl-12 md:pl-20 leading-10 md:leading-14 text-4xl lg:leading-15 font-sans flex flex-col leading-12 w-100 pl-5 w-full max-w-[1000px] font-semibold mb-5 mr-5">
        <div>
          <span>Select a class and receive <br/></span>
          <span> live updates for office hours seamlessly.</span>
        </div>
        <div className='flex flex-col mt-3 gap-1 text-3xl h-15'>
          <p className="w-full max-w-[650px] leading-8 text-base lg:text-xl font-light">
            Get notified the instant a TA or PT is free, so you can focus on the work that matter in the meantime.
          </p>
        </div>
        <Link 
          to="/signin" 
          className='bg-[#800000] lg:w-30 md:w-60 transition-all ease-in-out duration-500 text-white py-1.5 mt-5 text-lg font-normal rounded-full text-center block hover:opacity-90'>
          Join Now
        </Link>
      </div> 
     
    </div>
  );
};
