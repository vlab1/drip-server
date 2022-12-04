import { Schema } from 'mongoose';

interface Image extends Object {
    imageUrl: string;
    x_coordinate: number;
    y_coordinate: number;
}

export default Image;
