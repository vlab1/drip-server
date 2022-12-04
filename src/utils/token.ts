import jwt from 'jsonwebtoken';
import Account from '@/resources/account/account.interface';
import Token from '@/utils/interfaces/token.interface';
import { userInfo } from 'os';

export const createToken = (account: Account): string => {
    return jwt.sign({ id: account._id }, process.env.JWT_SECRET as jwt.Secret, {
        expiresIn: '1d',
    });
};

export const verifyToken = async (
    token: string
): Promise<jwt.VerifyErrors | Token> => {
    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            process.env.JWT_SECRET as jwt.Secret,
            (err, payload) => {
                if (err) {
                    return reject(err);
                }
                resolve(payload as Token);
            }
        );
    });
};

export default { createToken, verifyToken };
