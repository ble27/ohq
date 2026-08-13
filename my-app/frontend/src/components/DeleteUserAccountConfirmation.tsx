import { useState } from 'react'

interface DeleteUserAccountConfirmationProps {
    onConfirm: () => void | Promise<void>
    onClose: () => void
}

export const DeleteUserAccountConfirmation = ({ onConfirm, onClose }: DeleteUserAccountConfirmationProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <>
        <div className="fixed inset-0 z-50 flex items-center justify-center w-screen h-screen gap-3 bg-black/60">
            <div className='flex flex-col px-10 py-8 rounded-sm bg-gray-500/20 justify-center items-center text-center text-black bg-white'>
                <h1 className='font-semibold text-black'> Are you sure you want to delete your account?</h1>
                <h2 className='text-gray-500 text-sm'>This action cannot be undone</h2>
                {error && <p className='mt-3 text-sm text-red-600'>{error}</p>}
                <div className='flex flex-row gap-5 mt-5'>
                    <button
                        className='bg-gray-500 text-white border-none rounded-xs px-3 py-2 hover:opacity-90'
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        className='bg-red-600 border-none rounded-xs px-3 py-2 hover:opacity-90 text-white disabled:opacity-60'
                        disabled={isDeleting}
                        onClick={async () => {
                            setIsDeleting(true);
                            setError(null);
                            try {
                                await onConfirm();
                                onClose();
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'Failed to delete account');
                                setIsDeleting(false);
                            }
                        }}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
        </>
    )
}