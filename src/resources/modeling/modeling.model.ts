import { Schema, model } from 'mongoose';
import Modeling from '@/resources/modeling/modeling.interface';
import Image from '@/utils/interfaces/image.interface';

const ModelingSchema = new Schema(
    {
        name: {
            type: String,
        },
        size: {
            type: String,
        },
        color: {
            type: String,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'Accounts',
        },
        images: {
            type: Array<Image>,
        },
    },
    { timestamps: true }
);

export default model<Modeling>('Modeling', ModelingSchema);
