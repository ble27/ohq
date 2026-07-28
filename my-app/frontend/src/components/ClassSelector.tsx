import React from 'react'

// Props type
interface ClassSelectorProps {
    CSCEClasses: string[],
    selectedClass: string, 
    setSelectedClass: (value: string) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({ CSCEClasses, selectedClass, setSelectedClass}) => {
  return (
    <>
    {/* Class selector available at /dashboardc#class */}
    <form action='/submit-form-url' className='w-full' method="POST">
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
                    type='submit' 
                    className='ml-5 rounded-lg w-20 bg-black pl-3 pr-3 pt-2 pb-2 pointer-events-auto text-white hover:opacity-90'>
                        Enter
                </button>
            </div>
        </div>
    </form>
    </>
  )
}
