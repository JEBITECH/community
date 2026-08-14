import { v4 as uuidv4 } from 'uuid';

/**
 * Generates request context values
 */
export function generateRequestContext() {
    return {
        requestId: uuidv4(),       // unique request identifier
        startTime: Date.now(),     // request start timestamp
    };
}