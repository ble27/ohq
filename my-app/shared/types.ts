// Shared domain models + API response contracts (no Prisma/Node imports).

// --- Enums ---

export type Role = 'STUDENT' | 'TA' | 'PROFESSOR';

export type SessionStatus =
    | 'WAITING'
    | 'HELPING'
    | 'COMPLETED'
    | 'REMOVED'
    | 'LEFT';

export type NotificationType = 'JOIN' | 'LEAVE' | 'ASSIST' | 'CLOSE';

// --- Prisma models (shared shape) ---

export interface Course {
    id: string;
    code: string;
    semester: string;
    isActive: boolean;
    createdAt: string | Date;
}

export interface Queue {
    id: string;
    courseId: string;
    taId: string;
    location: string;
    zoomLink?: string | null;
    isOpen: boolean;
    startsAt: string | Date;
    endsAt?: string | Date | null;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface QueueWithTA extends Queue {
    ta?: User
    course?: Course
}

export interface QueueTicket {
    id: string;
    studentId: string;
    queueId: string;
    status: SessionStatus;
    position: number | null;
    joinedAt: string | Date;
    updatedAt: string | Date;
}

export interface QueueTicketWithStudent extends QueueTicket {
    student?: User
}
export interface CourseTA {
    id: string;
    courseId: string;
    taId: string;
    createdAt: string | Date;
}

export interface User {
    id: string;
    email: string;
    name?: string | null;
    role: Role;
    notifyAssist?: boolean;
    notifyClose?: boolean;
    notifyJoin?: boolean;
    notifyLeave?: boolean;
    notifySound?: boolean;
    defaultLocation?: string | null;
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    queueId: string;
    ticketId: string | null;
    createdAt: string | Date;
    readAt: string | Date | null;
    clearedAt: string | Date | null;
}

// --- Shared API envelopes ---

export interface ApiMessageResponse {
    message: string;
}

export interface ApiErrorResponse {
    message: string;
    errors?: unknown;
}

// --- Queue responses ---

export interface QueueResponse {
    queue: Queue;
    message: string;
}

export interface QueuesListResponse {
    queues: QueueWithTA[];
    message: string;
}

// --- User responses ---

export interface UserResponse {
    user: User;
    message: string;
}

export interface UsersListResponse {
    users: User[];
    message: string;
}

// --- Course responses ---

export interface CourseResponse {
    course: Course;
    message: string;
}

export interface CoursesListResponse {
    courses: Course[];
    message: string;
}

// --- CourseTA responses ---

export interface CourseTAResponse {
    courseTA: CourseTA;
    message: string;
}

export interface CourseTAsListResponse {
    courseTAs: CourseTA[];
    message: string;
}

// --- QueueTicket responses ---

export interface QueueTicketResponse {
    ticket: QueueTicket;
    message: string;
}

export interface QueueTicketsListResponse {
    tickets: QueueTicketWithStudent[];
    message: string;
}

// Notification responses (GET includes ticket + queue relations).
export interface NotificationWithDetails extends Notification {
    ticket: QueueTicketWithStudent | null
    queue: QueueWithTA | null
}

export interface NotificationResponse {
    notification: Notification;
    message: string;
}

export interface NotificationsListResponse {
    notifications: NotificationWithDetails[];
    message: string;
}

export interface NotificationsCreateListResponse {
    notifications: Notification[], 
    message: string
}
export interface NotificationsClearResponse {
    count: number;
    message: string;
}

// --- Health ---

export interface HealthCheckResponse {
    uptime: number;
    message: string;
    timestamp: number;
}
