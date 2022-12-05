import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import Account from '@/resources/account/account.interface';
import ModelingModel from '@/resources/modeling/modeling.model';
import OrderModel from '@/resources/order/order.model';

const AccountSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
        },
        passwordGoogle: {
            type: String,
        },
        name: {
            type: String,
        },
        phone: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            default: 'User',
            enum: ['User', 'Admin', 'Moderator'],
        },
        surname: {
            type: String,
        },
        patronymic: {
            type: String,
        },
        region: {
            type: String,
        },
        city: {
            type: String,
        },
        novaposhta: {
            type: String,
        },
    },
    { timestamps: true }
);

AccountSchema.pre<Account>('save', async function (next) {
    if (!this.isModified('password') && !this.isModified('passwordGoogle')) {
        return next();
    }
    if (this.password) {
        const hash = await bcrypt.hash(this.password, 10);
        this.password = hash;
    }
    if (this.passwordGoogle) {
        const hash = await bcrypt.hash(this.passwordGoogle, 10);
        this.passwordGoogle = hash;
    }
    next();
});

AccountSchema.pre<Account>('findOneAndUpdate', async function (this) {
    const update: any = { ...this.getUpdate() };
    if (update.password) {
        update.password = await bcrypt.hash(update.password, 10);
        this.setUpdate(update);
    }
    if (update.passwordGoogle) {
        update.passwordGoogle = await bcrypt.hash(update.passwordGoogle, 10);
        this.setUpdate(update);
    }
});

AccountSchema.methods.isValidPassword = async function (
    password: string
): Promise<Error | boolean> {
    return await bcrypt.compare(password, this.password);
};

AccountSchema.methods.isValidPasswordGoogle = async function (
    passwordGoogle: string
): Promise<Error | boolean> {
    return await bcrypt.compare(
        passwordGoogle,
        this.passwordGoogle ? this.passwordGoogle : ''
    );
};

AccountSchema.post('findOneAndDelete', async function (result, next) {
    await ModelingModel.deleteMany({ account_id: result._id });
    await OrderModel.deleteMany({ account_id: result._id });
    next();
});

export default model<Account>('Accounts', AccountSchema);
