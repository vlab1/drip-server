import { Document } from 'mongoose';
import { Schema } from 'mongoose';
import Image from '@/utils/interfaces/image.interface';
import Account from '@/resources/account/account.interface';

export default interface Modeling extends Document {
    name: string;
    size: string;
    color: string;
    user_id: Schema.Types.ObjectId | Account;
    images: Array<Image>;
}
