import { Document } from 'mongoose';
import { Schema } from 'mongoose';
import { Modeling } from '@/resources/modeling/modeling.interface';

interface ClothesItem extends Document {
    clothes_id: Schema.Types.ObjectId;
    orderClothes_id: Schema.Types.ObjectId;
    image: string;
    size: string;
    price: number;
    totalPrice: number;
    sale: number;
    salePrice: number;
    count: number;
    color: string;
    name: string;
    clothes_name: string;
    clothes_type: string;
    clothes_count: number;
    clothes_size: string;
    productModel: string;
    modeling: Modeling;
    isModeling: boolean;
}

interface OrderInfo extends Document {
    order_id: Schema.Types.ObjectId;
    clothes: Array<ClothesItem>;
    total: number;
    status: string;
}

interface ClothesImage extends Document {
    clothes_id: Schema.Types.ObjectId;
    image: string;
    clothes_name: string;
    clothes_type: string;
    clothes_count: number;
    clothes_size: string;
    modeling: Modeling;
    isModeling: boolean;
}

interface UserInfo extends Document {
    user_id: Schema.Types.ObjectId,
    name: string,
    email: string,
}

interface OrderItem extends Document {
    order_id: Schema.Types.ObjectId;
    order_number: string;
    total: number;
    images: Array<ClothesImage>;
    status: string;
    status_update: Date;
    invoice: string;
    user_info: UserInfo;
    region: string;
    city: string;
    novaposhta: string;
    phone: string;
    name: string;
    email: string;
}

export { ClothesItem, OrderInfo, OrderItem, ClothesImage, UserInfo };
