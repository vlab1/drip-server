import { Document } from 'mongoose';
import ClothesCount from '@/utils/interfaces/clothesCount.interface';
import { Schema } from 'mongoose';
import Collection from '@/resources/collection/collection.interface';

export default interface Clothes extends Document {
    name: string;
    imagesUrls: Array<string>;
    gifUrl: string;
    color: Array<string>;
    type: string;
    price: number;
    sale: number;
    material: string;
    care: string;
    company: string;
    sex: string;
    collection_id: Schema.Types.ObjectId | Collection;
    clothesCount: Array<ClothesCount>;
}
