import { Schema, model } from 'mongoose';
import {
    Modeling,
    TextModeling,
    ImageModeling,
    FontStyle,
} from '@/resources/modeling/modeling.interface';

const ModelingSchema = new Schema(
    {
        name: {
            type: String,
        },
        size: {
            type: String,
        },
        clothes_id: {
            type: Schema.Types.ObjectId,
            ref: "Clothes",
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "Accounts",
        },
        images: {
            type: Array<ImageModeling>,
        },
        texts: {
            type: Array<TextModeling>,
        },
    },
    { timestamps: true }
);

export default model<Modeling>('Modeling', ModelingSchema);
