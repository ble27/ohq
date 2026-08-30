import type { ViewInstruction } from '@/data/viewInstructions'

interface InstructionsPanelProps {
    instruction: ViewInstruction
}

export const InstructionsPanel = ({ instruction }: InstructionsPanelProps) => {
    return (
        <div
            className="absolute top-full right-0 z-40 mt-2 flex w-[min(280px,calc(100vw-1.5rem))] -translate-x-3 flex-col overflow-hidden
                rounded-lg border border-black/20 bg-white px-4 shadow-xl backdrop-blur-lg
                sm:-translate-x-4 lg:w-80"
        >
            <div className="flex h-15 flex-row items-center">
                <span className="text-lg font-semibold">{instruction.title}</span>
            </div>

            <div className="flex flex-col gap-3 pb-4">
                <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {instruction.summary}
                </p>
                {instruction.tips && instruction.tips.length > 0 && (
                    <ul className="flex list-disc flex-col gap-1.5 pl-4 text-xs text-slate-500 sm:text-sm">
                        {instruction.tips.map((tip) => (
                            <li key={tip}>{tip}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
