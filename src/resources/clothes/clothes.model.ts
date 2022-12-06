import { Schema, model } from 'mongoose';
import {Clothes} from '@/resources/clothes/clothes.interface';
import {ClothesCount} from '@/resources/clothes/clothes.interface';
import OrderClothesModel from '@/resources/orderClothes/orderClothes.model';
import { boolean } from 'joi';

const ClothesSchema = new Schema(
    {
        name: {
            type: String,
        },
        imagesUrls: {
            type: Array<string>,
        },
        gifUrl: {
            type: String,
        },
        color: {
            type: Array<string>,
        },
        type: {
            type: String,
        },
        price: {
            type: Number,
        },
        sale: {
            type: Number,
            default: 0,
        },
        material: {
            type: String,
        },
        care: {
            type: String,
        },
        company: {
            type: String,
        },
        clothesCount: {
            type: Array<ClothesCount>,
        },
        sex: {
            type: String,
        },
        collection_id: {
            type: Schema.Types.ObjectId,
            ref: 'Collections',
        },
        isModeling: {
            type: Boolean,
            default: "false",
        }
    },
    { timestamps: true }
);

ClothesSchema.post('findOneAndDelete', async function (result, next) {
    await OrderClothesModel.deleteMany({ clothes_id: result._id });
    next();
});

export default model<Clothes>('Clothes', ClothesSchema);
