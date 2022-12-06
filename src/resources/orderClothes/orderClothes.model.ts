import { Schema, model } from 'mongoose';
import OrderClothes from '@/resources/orderClothes/orderClothes.interface';

const OrderClothesSchema = new Schema(
    {
        productModel: {
            type: String,
            required: true,
            enum: ['Clothes', 'Modeling'],
        },
        clothes_id: {
            type: Schema.Types.ObjectId,
            refPath: 'productModel',
        },
        order_id: {
            type: Schema.Types.ObjectId,
            ref: 'Orders',
        },
        count: {
            type: Number,
        },
        size: {
            type: String,
        },
        color: {
            type: String,
        },
        clothesPrice: {
            type: Number,
        },
        clothesSale: {
            type: Number,
        },
    },
    { timestamps: true }
);

export default model<OrderClothes>('OrderClothes', OrderClothesSchema);
