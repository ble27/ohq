import React from "react"
import axios from "axios"

export const verifyTA = async (id: string) => {
    try {
        const response = await axios.post(`/api/tas/${id}/verification`);
        if (response.status === 200) {
            const msg = 'Successfully verified TA\'s id status'
            console.log(msg);
            return { status: 200, message: msg };
        }
    }
    catch (error) {
        const msg = 'Failed to verify TA\'s status'
        console.log(msg);
        return { status: 404, message: msg };
    }

}