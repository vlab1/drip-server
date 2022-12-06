import { Document } from 'mongoose';
import { Schema } from 'mongoose';
import Order from '@/resources/order/order.interface';
import {Clothes} from '@/resources/clothes/clothes.interface';
import { Modeling } from '@/resources/modeling/modeling.interface';

export default interface OrderClothes extends Document {
    clothes_id: Schema.Types.ObjectId | Clothes | Modeling;
    order_id: Schema.Types.ObjectId | Order;
    count: number;
    size: string;
    color: string;
    clothesPrice: number;
    clothesSale: number;
    productModel: string;

}
