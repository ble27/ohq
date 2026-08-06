import { Link } from 'react-router-dom'

export const Header = () => {
  return (
    <>
      <nav className='flex flex-row items-center sticky top-0 z-100 h-20 bg-white shadow p-5'>
        <Link to='/' className='w-1/3 flex flex-row items-center gap-3 font-sans text-2xl font-semibold'> 
          <span>Queuedex</span>
          </Link> 
        <div className='flex justify-center items-center gap-4 h-full w-1/3'>
            <Link to='/' className='font-sans text-sm md:text-base text-gray-500 focus:opacity-90'> docs </Link>
            <Link to='/' className='font-sans text-sm md:text-base text-gray-500 focus:opacity-90'> source </Link>
        </div>
        <div className='flex text-sm absolute right-2 gap-2 pr-3'>
          <Link to='/signin' className='bg-black text-white transition-colors duration-300 ease-in-out rounded-full px-3 py-2 hover:opacity-80'>Log In</Link>
          <Link to='/signup' className='px-3 py-2 rounded-full transition-colors duration-300 ease-in-out hover:opacity-80 hover:bg-gray-300/50'>Sign Up</Link>
        </div>
      </nav>
   
    </>    
  )
}
