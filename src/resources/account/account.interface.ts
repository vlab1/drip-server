import { Document } from 'mongoose';

export default interface Account extends Document {
    email: string;
    password: string;
    passwordGoogle: string;
    name: string;
    phone: string;
    role: string;
    surname: string;
    patronymic: string;
    region: string;
    city: string;
    novaposhta: string;

    getUpdate(): Promise<Error | Object>;
    setUpdate(obj: Object): Promise<Error | boolean>;
    isValidPassword(passwod: string): Promise<Error | boolean>;
    isValidPasswordGoogle(passwod: string): Promise<Error | boolean>;
}
