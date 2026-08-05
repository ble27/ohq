import { useState } from 'react'

interface DeleteConfirmationProps {
    onConfirm: () => void
    onClose: () => void
}

export const DeleteConfirmation = ({ onConfirm, onClose }: DeleteConfirmationProps) => {

    return (
        <>
        <div className="fixed inset-0 z-50 flex items-center justify-center w-screen h-screen gap-3 bg-black/60">
            <div className='flex flex-col px-10 py-8 rounded-sm bg-gray-500/20 justify-center items-center text-center text-black bg-white'>
                <h1 className='font-semibold text-black'> Are you sure you want to delete queue?</h1>
                <h2 className='text-gray-500 text-sm'>This action cannot be undone</h2>
                <div className='flex flex-row gap-5 mt-5'>
                    <button
                        className='bg-blue-500 text-white border-none rounded-sm px-3 py-2 hover:opacity-90'
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className='bg-red-600 border-none rounded-sm px-3 py-2 hover:opacity-90 text-white'
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
        </>
    )
}