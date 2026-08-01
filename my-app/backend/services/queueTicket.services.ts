import { prisma } from "../prisma.js";
import type { QueueTicket } from "@prisma/client";

// Services layer perform actual DB work 
// QueueTicket helpers to determine position and general logic

export const updatePosition = async (queueId: string) => {
    try {
        const tickets: QueueTicket[] = await prisma.queueTicket.findMany({
            where: {
                queueId, 
                status: 'WAITING'
            }, 
            // Order by earliest to latest
            orderBy: {
                joinedAt: 'asc'
            }
        })
        if (tickets.length === 0) {
            const msg = 'No tickets found for this queue'
            console.log(msg);
            return {success: false, message: msg};
        }
        // Perform db level update
        const updatePromises = tickets.map((t, index) => {
            const newPosition = index + 1;
            t.position = newPosition;

            return prisma.queueTicket.update({
                where: { id: t.id }, 
                data: { position: newPosition}
            });
        }); 
        
        // Run the DB updates as a transction for safety
        await prisma.$transaction(updatePromises);

        return tickets;
    }
    catch (error) {
        console.log('Unable to fetch or update tickets in DB', error);
        return { success: false, message: 'Database error occurred' };
    }
}

// Can be used later, but don't delete off of database records to compute important metrics
export const removeSupported = async (queueId: string) => {
    const response = await prisma.queueTicket.deleteMany({
        where: { queueId: queueId, 
            status: {
                in: ['COMPLETED','LEFT','REMOVED','HELPING']
            }, 
        }
    })   
    return response; 
}

export const updateCompletedAndLeft = async (queueId: string) => {
    const response = await prisma.queueTicket.updateMany({
        where: { queueId: queueId, 
            status: { in: ['COMPLETED', 'LEFT'] } 
        }, 
        data: { updatedAt: new Date() }
    })
    return response;
}