import { Document } from 'mongoose';
import { Schema } from 'mongoose';
import Account from '@/resources/account/account.interface';

export default interface Order extends Document {
    user_id: Schema.Types.ObjectId | Account;
    moderator_id: Schema.Types.ObjectId | Account;
    status: string;
    region: string,
    city: string,
    novaposhta: string,
    phone: string;
    name: string,
    surname: string,
    patronymic:string,
    email: string;
    invoice: string;
    status_update: Date;
    payment_type: string;

    getUpdate(): Promise<Error | Object>;
    setUpdate(obj: Object): Promise<Error | boolean>;
}
