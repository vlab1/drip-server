import OrderModel from '@/resources/order/order.model';
import Order from '@/resources/order/order.interface';
import { Schema } from 'mongoose';
import ClothesService from '@/resources/clothes/clothes.service';
import OrderClothesService from '@/resources/orderClothes/orderClothes.service';
import { Clothes } from '@/resources/clothes/clothes.interface';
import OrderClothes from '@/resources/orderClothes/orderClothes.interface';
import OrderClothesModel from '@/resources/orderClothes/orderClothes.model';
import Props from '@/utils/types/props.type';
import AccountModel from '@/resources/account/account.model';
import ModelingModel from '@/resources/modeling/modeling.model';
import { Modeling } from '@/resources/modeling/modeling.interface';

const stripe = require('stripe')(process.env.STRIPE_KEY);

class OrderService {
    private order = OrderModel;
    private account = AccountModel;
    private ClothesService = new ClothesService();
    private OrderClothesService = new OrderClothesService();
    private orderClothes = OrderClothesModel;
    private modeling = ModelingModel;

    /**
     * Create a new order
     */
    public async create(
        user_id: Schema.Types.ObjectId,
        moderator_id: Schema.Types.ObjectId,
        status: string,
        region: string,
        city: string,
        novaposhta: string,
        phone: string,
        name: string,
        surname: string,
        patronymic: string,
        email: string,
        invoice: string,
        status_update: Date,
        payment_type: string
    ): Promise<Order> {
        try {
            const user_cart = await this.order.findOne({
                user_id: user_id,
                status: 'cart',
            });

            if (user_cart) {
                throw new Error('Cart already exist');
            }

            const order = await this.order.create({
                user_id,
                moderator_id,
                status,
                region,
                city,
                novaposhta,
                phone,
                name,
                surname,
                patronymic,
                email,
                invoice,
                status_update,
                payment_type,
            });

            return order;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to delete order by id
     */
    public async delete(_id: Schema.Types.ObjectId): Promise<Order> {
        try {
            const order = await this.order
                .findOneAndDelete({ _id })
                .populate({
                    path: 'user_id',
                    populate: { path: '_id' },
                })
                .populate({
                    path: 'moderator_id',
                    populate: { path: '_id' },
                });

            if (!order) {
                throw new Error('Unable to delete order with that data');
            }

            return order;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to update order by id
     */
    public async update(
        _id: Schema.Types.ObjectId,
        user_id: Schema.Types.ObjectId,
        moderator_id: Schema.Types.ObjectId,
        status: string,
        region: string,
        city: string,
        novaposhta: string,
        phone: string,
        name: string,
        surname: string,
        patronymic: string,
        email: string,
        invoice: string,
        status_update: Date,
        payment_type: string,
        account_id: Schema.Types.ObjectId
    ): Promise<Order> {
        try {
            const account = await this.account.findOne(account_id).exec();

            const orderPerm = await this.order.findById(_id).exec();

            if (!account) {
                throw new Error('Check if you are signed in');
            }

            if (!orderPerm) {
                throw new Error('Order does not exist');
            }

            if (
                account_id.toString() !== orderPerm.user_id.toString() &&
                account.role !== 'Admin' &&
                account.role !== 'Moderator'
            ) {
                throw new Error('You are not allowed to update this order');
            }

            if (account.role !== 'User') {
                moderator_id = account._id;
            }

            if (status === 'processing') {
                if (
                    !region ||
                    !city ||
                    !novaposhta ||
                    !phone ||
                    !name ||
                    !surname ||
                    !patronymic ||
                    !email
                ) {
                    throw new Error('Personal information must be filled');
                }

                const clothes = (await this.OrderClothesService.search({
                    order_id: _id,
                })) as Array<OrderClothes>;

                if (!clothes || (clothes && clothes.length <= 0)) {
                    throw new Error(
                        'Unable to find order clothes with that order'
                    );
                }

                await Promise.all(
                    clothes.map(async (item, index) => {
                        if (item.productModel === 'Modeling') {
                            const modelingObj = item.clothes_id as Modeling;
                            const modeling = await this.modeling
                                .findById({ _id: modelingObj._id })
                                .populate({
                                    path: 'clothes_id',
                                    populate: { path: '_id' },
                                });
                            if (!modeling) {
                                throw new Error('Unable to find order clothes');
                            }
                            clothes[index].clothes_id = modeling.clothes_id;
                            item.clothes_id = modeling.clothes_id;
                        }
                    })
                );

                const clothes_id = clothes.map((item) => [
                    item.clothes_id as Schema.Types.ObjectId,
                    item.size,
                    item.count,
                ]);
                await Promise.all(
                    clothes_id.map(async (item) => {
                        const objectid = item[0] as Schema.Types.ObjectId;
                        const size = item[1] as string;
                        const number = item[2] as number;
                        await this.ClothesService.incrementClothesCount(
                            objectid,
                            size,
                            number * -1
                        );
                    })
                );
                const clothesInOrder = (await this.OrderClothesService.search({
                    order_id: _id,
                })) as Array<OrderClothes>;

                await Promise.all(
                    clothesInOrder.map(async (item, index) => {
                        if (item.productModel === 'Modeling') {
                            const modelingObj = item.clothes_id as Modeling;
                            const modeling = await this.modeling
                                .findById({ _id: modelingObj._id })
                                .populate({
                                    path: 'clothes_id',
                                    populate: { path: '_id' },
                                });
                            if (!modeling) {
                                throw new Error('Unable to find order clothes');
                            }
                            clothesInOrder[index].clothes_id = modeling;
                            item.clothes_id = modeling;
                        }
                    })
                );

                if (!clothes) {
                    throw new Error(
                        'Unable to find order clothes with that order'
                    );
                }

                await Promise.all(
                    clothesInOrder.map(async (item) => {
                        if (item.productModel === 'Clothes') {
                            const clothesobject = item.clothes_id as Clothes;
                            const objectid =
                                clothesobject._id as Schema.Types.ObjectId;
                            const clothesInOrderObject =
                                (await this.ClothesService.find({
                                    _id: objectid,
                                })) as Array<Clothes>;
                            await this.orderClothes.updateMany(
                                { order_id: _id, clothes_id: objectid },
                                {
                                    clothesPrice: clothesInOrderObject[0].price,
                                    clothesSale: clothesInOrderObject[0].sale,
                                }
                            );
                        } else {
                            const modelingobject = item.clothes_id as Modeling;
                            const clothesobject =
                                modelingobject.clothes_id as Clothes;
                            const objectid =
                                clothesobject._id as Schema.Types.ObjectId;
                            const clothesInOrderObject =
                                (await this.ClothesService.find({
                                    _id: objectid,
                                })) as Array<Clothes>;
                            await this.orderClothes.updateMany(
                                {
                                    order_id: _id,
                                    clothes_id: modelingobject._id,
                                },
                                {
                                    clothesPrice: clothesInOrderObject[0].price,
                                    clothesSale: clothesInOrderObject[0].sale,
                                }
                            );
                        }
                    })
                );
                await this.order.create({ user_id: account_id });
            }

            if (status === 'cancellation') {
                const clothes = (await this.OrderClothesService.search({
                    order_id: _id,
                })) as Array<OrderClothes>;

                if (!clothes || (clothes && clothes.length <= 0)) {
                    throw new Error(
                        'Unable to find order clothes with that order'
                    );
                }

                await Promise.all(
                    clothes.map(async (item, index) => {
                        if (item.productModel === 'Modeling') {
                            const modelingObj = item.clothes_id as Modeling;
                            const modeling = await this.modeling
                                .findById({ _id: modelingObj._id })
                                .populate({
                                    path: 'clothes_id',
                                    populate: { path: '_id' },
                                });
                            if (!modeling) {
                                throw new Error('Unable to find order clothes');
                            }
                            clothes[index].clothes_id = modeling.clothes_id;
                            item.clothes_id = modeling.clothes_id;
                        }
                    })
                );

                const clothes_id = clothes.map((item) => [
                    item.clothes_id as Schema.Types.ObjectId,
                    item.size,
                    item.count,
                ]);
                await Promise.all(
                    clothes_id.map(async (item) => {
                        const objectid = item[0] as Schema.Types.ObjectId;
                        const size = item[1] as string;
                        const number = item[2] as number;
                        await this.ClothesService.incrementClothesCount(
                            objectid,
                            size,
                            number
                        );
                    })
                );
            }
            const order = await this.order
                .findOneAndUpdate(
                    { _id: _id },
                    {
                        user_id: user_id,
                        moderator_id: moderator_id,
                        status: status,
                        region: region,
                        city: city,
                        novaposhta: novaposhta,
                        phone: phone,
                        name: name,
                        surname: surname,
                        patronymic: patronymic,
                        email: email,
                        invoice: invoice,
                        status_update: status_update,
                        payment_type: payment_type,
                    },
                    { new: true }
                )
                .populate({
                    path: 'user_id',
                    populate: { path: '_id' },
                })
                .populate({
                    path: 'moderator_id',
                    populate: { path: '_id' },
                });

            if (!order) {
                throw new Error('Unable to update order with that data');
            }
            return order;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find all orders
     */
    public async get(
        account_id: Schema.Types.ObjectId
    ): Promise<Order | Array<Order> | Error> {
        try {
            //const account = await this.account.findOne(account_id).exec();

            const orders = await this.order.find(
                { user_id: account_id },
                null,
                {
                    sort: { createdAt: -1 },
                }
            );

            if (!orders) {
                throw new Error('Unable to find orders');
            }

            return orders;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find order
     */
    public async find(
        props: Props,
        account_id: Schema.Types.ObjectId
    ): Promise<Order | Array<Order> | Error> {
        try {
            props.user_id = account_id;

            const user_cart = await this.order.findOne({
                user_id: props.user_id,
                status: 'cart',
            });

            if (!user_cart) {
                await this.order.create({
                    user_id: props.user_id,
                    status: 'cart',
                });
            }

            const orders = await this.order
                .find(props)
                .populate({
                    path: 'user_id',
                    populate: { path: '_id' },
                })
                .populate({
                    path: 'moderator_id',
                    populate: { path: '_id' },
                });

            if (!orders) {
                throw new Error('Unable to find orders with that data');
            }

            return orders;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find order
     */
    public async adminFind(
        _id: Schema.Types.ObjectId
    ): Promise<Order | Array<Order> | Error> {
        try {
            const orders = await this.order
                .find({ _id: _id })
                .populate({
                    path: 'user_id',
                    populate: { path: '_id' },
                })
                .populate({
                    path: 'moderator_id',
                    populate: { path: '_id' },
                });

            if (!orders) {
                throw new Error('Unable to find orders with that data');
            }

            return orders;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
    /**
     * Attempt to find order
     */
    public async adminGet(props: Props): Promise<Order | Array<Order> | Error> {
        try {
            const orders = await this.order
                .find({ status: { $ne: 'cart' } })
                .populate({
                    path: 'user_id',
                    populate: { path: '_id' },
                })
                .populate({
                    path: 'moderator_id',
                    populate: { path: '_id' },
                });

            if (!orders) {
                throw new Error('Unable to find orders with that data');
            }

            return orders;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to pay
     */
    public async pay(cartItem: any): Promise<any | Error> {
        try {
            const line_items = cartItem.map((item: any) => {
                return {
                    price_data: {
                        currency: 'uah',
                        product_data: {
                            name: item.name,
                            images: [item.image],
                            metadata: {
                                id: item.clothes_id,
                            },
                        },
                        unit_amount: item.price * 100,
                    },
                    quantity: 1,
                };
            });
            const params = {
                line_items,
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL}/orders`,
                cancel_url: `${process.env.CLIENT_URL}/cart`,
            };
            const session = await stripe.checkout.sessions.create(params);

            return { url: session.url, check: true };
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export default OrderService;
