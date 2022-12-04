import Account from '@/resources/account/account.interface';

declare global {
    namespace Express {
        export interface Request {
            account: Account;
        }
    }
}
