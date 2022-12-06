import { Document } from 'mongoose';
import { Schema } from 'mongoose';
import Account from '@/resources/account/account.interface';
import { Clothes } from '@/resources/clothes/clothes.interface';

interface FontStyle {
    name: string;
    value: string;
}

interface ImageModeling {
    imageUrl: string;
    image_height: number;
    image_width: number;
    rotate: number;
    scale: number;
    front_location: boolean;
    x_coordinate: number;
    y_coordinate: number;
    z_coordinate: number;
    originalname?: string;
}

interface TextModeling {
    text_id: string;
    text_size: number;
    alignment: string;
    text: string;
    text_color: string;
    font: string;
    font_style: Array<FontStyle>;
    rotate: number;
    scale: number;
    front_location: boolean;
    x_coordinate: number;
    y_coordinate: number;
    z_coordinate: number;
}

interface Modeling extends Document {
    name: string;
    size: string;
    clothes_id: Schema.Types.ObjectId | Clothes;
    user_id: Schema.Types.ObjectId | Account;
    images: Array<ImageModeling>;
    texts: Array<TextModeling>;
}

export { Modeling, TextModeling, ImageModeling, FontStyle };
