import { Request, Response, NextFunction } from 'express';
import { generateRequestContext } from './RequestContext.util';

/**
 * Gateway middleware
 * Runs BEFORE request is forwarded to downstream services
 */
export function requestContextMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {

    // Generate request context
    const { requestId, startTime } = generateRequestContext();

    // Attach values to request headers
    // These will be forwarded to downstream services
    req.headers['x-request-id'] = requestId;
    req.headers['x-request-start-time'] = startTime.toString();
    // if (req.headers['transaction-id']) {
    //       req.headers['transaction-id'] = req.headers['transaction-id'];
    //     }
    if ((req as any).user) {
        const user = (req as any).user;
        req.headers['x-user'] = JSON.stringify(user);
        req.headers['x-user-id'] = user.id;
        req.headers['x-user-email'] = user.email;
        req.headers['x-user-role'] = user.role;
        if (user.organization_id) {
            req.headers['x-user-organization-id'] = user.organization_id.toString();
        }
    }


    // Optional: expose headers to client response
    res.setHeader('x-request-id', requestId);
    // res.setHeader('x-request-start-time', startTime.toString());
    // if (req.headers['transaction-id']) {
    //     res.setHeader('transaction-id', req.headers['transaction-id']);
    // }

    console.log('Request Context Generated:', {
        requestId,
        startTime,
        path: req.originalUrl,
    });


    next(); // move to next middleware / route
}
