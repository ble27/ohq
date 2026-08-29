export type DashboardView = 'home' | 'class' | 'queuemanager' | 'settings'

export interface ViewInstruction {
    title: string
    summary: string
    tips?: string[]
}

export const VIEW_INSTRUCTIONS: Record<DashboardView, ViewInstruction> = {
    home: {
        title: 'My Tickets',
        summary:
            'Whenever you join a queue from Class, your active ticket appears here. Track your position, see TA details, and leave a queue when you no longer need help.',
        tips: [
            'Tickets update automatically while you wait.',
            'Go to Class to find live office-hour sessions.',
        ],
    },
    class: {
        title: 'Class',
        summary:
            'Pick a course, then browse live queues for that class. Open a queue to view details and join the line.',
        tips: [
            'Use the dropdown to switch between courses.',
            'Active queues show how many students are waiting.',
            'After joining, check My Tickets for your place in line.',
        ],
    },
    queuemanager: {
        title: 'Queue Manager',
        summary:
            'TAs create and manage office-hour queues here. Open Workspace on a queue to call the next student, run a session, and update queue details.',
        tips: [
            'Create a queue with course, location, time, and optional Zoom link.',
            'Workspace shows who is waiting and who is being helped.',
            'Use Settings on a queue card to edit or close it.',
        ],
    },
    settings: {
        title: 'Settings',
        summary:
            'Manage your profile, notifications, and account. Save when you are done, or Cancel to discard changes.',
        tips: [
            'Display name — shown to others in queues.',
            'Default location — pre-filled when creating queues (TA only).',
            'Student alerts — your turn and queue-closing notifications.',
            'TA alerts — student join and leave notifications.',
            'Sound — play audio when a notification arrives.',
            'Account — sign out or permanently delete your account.',
        ],
    },
}

export function getDashboardView(pathname: string): DashboardView {
    if (pathname.startsWith('/dashboard/class')) return 'class'
    if (pathname.startsWith('/dashboard/queuemanager')) return 'queuemanager'
    if (pathname.startsWith('/dashboard/settings')) return 'settings'
    return 'home'
}
