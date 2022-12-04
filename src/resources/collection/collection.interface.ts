import { Document } from 'mongoose';

export default interface Collection extends Document {
    name: string;
    imagesUrls: Array<string>;
    gifUrl: string;
    description: string;
}
