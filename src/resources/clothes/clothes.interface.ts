import { Document } from 'mongoose';
import Collection from '@/resources/collection/collection.interface';
import { Schema } from 'mongoose';

interface ClothesCount extends Object {
    size: string;
    count: number;
}

interface Clothes extends Document {
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
    isModeling: boolean;
}

export {Clothes, ClothesCount};