import { Schema, model } from 'mongoose';
import Order from '@/resources/order/order.interface';
import OrderClothesModel from '@/resources/orderClothes/orderClothes.model';

const OrderSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'Accounts',
        },
        moderator_id: {
            type: Schema.Types.ObjectId,
            ref: 'Accounts',
        },
        status: {
            type: String,
            enum: [
                'cart',
                'processing',
                'road',
                'waiting',
                'cancellation',
                'completed',
            ],
            default: 'cart',
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
        phone: {
            type: String,
        },
        name: {
            type: String,
        },
        surname: {
            type: String,
        },
        patronymic: {
            type: String,
        },
        email: {
            type: String,
        },
        invoice: {
            type: String,
        },
        status_update: {
            type: Date,
        },
        payment_type: {
            type: String,
            enum: ['card', 'COD'],
        },
    },
    { timestamps: true }
);

OrderSchema.post('findOneAndDelete', async function (result, next) {
    await OrderClothesModel.deleteMany({ order_id: result._id });
    next();
});

OrderSchema.pre(
    'deleteMany',
    { document: false, query: true },
    async function (next) {
        const docs = await this.model.find(this.getFilter());
        if (docs) {
            const orders = docs.map((item) => item._id);
            await OrderClothesModel.deleteMany({ order_id: { $in: orders } });
        }
        next();
    }
);

OrderSchema.pre<Order>('findOneAndUpdate', async function (this) {
    const update: any = { ...this.getUpdate() };
    if (update.status) {
        update.status_update = new Date(Date.now());
        this.setUpdate(update);
    }
});

export default model<Order>('Orders', OrderSchema);
