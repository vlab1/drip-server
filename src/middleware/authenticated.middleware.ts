import { Request, Response, NextFunction } from 'express';
import token from '@/utils/token';
import AccountModel from '@/resources/account/account.model';
import Token from '@/utils/interfaces/token.interface';
import HttpException from '@/utils/exceptions/http.exception';
import jwt from 'jsonwebtoken';

async function authenticatedMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> {
    const bearer = req.headers.authorization;
    if (!bearer || !bearer.startsWith('Bearer ')) {
        return next(new HttpException(401, 'Unauthorised'));
    }

    const accessToken = bearer.split('Bearer ')[1].trim();
    try {
        const payload: Token | jwt.JsonWebTokenError = await token.verifyToken(
            accessToken
        );

        if (payload instanceof jwt.JsonWebTokenError) {
            return next(new HttpException(401, 'Unauthorised'));
        }

        const account = await AccountModel.findById(payload.id).exec();

        if (!account) {
            return next(new HttpException(401, 'Unauthorised'));
        }

        if (account.password) {
            account.password = 'exist';
        }
        if (account.passwordGoogle) {
            account.passwordGoogle = 'exist';
        }

        req.account = account;

        return next();
    } catch (error) {
        return next(new HttpException(401, 'Unauthorised'));
    }
}

export default authenticatedMiddleware;
