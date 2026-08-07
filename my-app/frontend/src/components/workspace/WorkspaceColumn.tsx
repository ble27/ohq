import type { ReactNode } from 'react'

interface WorkspaceColumnProps {
    title: string
    count: number
    emptyLabel: string
    children?: ReactNode
    className?: string
}

export const WorkspaceColumn = ({
    title,
    count,
    emptyLabel,
    children,
    className = '',
}: WorkspaceColumnProps) => {
    const hasContent = children != null && children !== false && children !== true

    return (
        <section
            className={`flex h-full min-h-0 flex-col rounded-xl border border-slate-200/80 bg-white shadow-sm ${className}`}
        >
            <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2.5">
                <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                    {title}
                </h2>
                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-600">
                    {count}
                </span>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
                {hasContent ? (
                    children
                ) : (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
                        {emptyLabel}
                    </div>
                )}
            </div>
        </section>
    )
}
