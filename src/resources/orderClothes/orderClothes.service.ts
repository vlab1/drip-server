import OrderClothesModel from '@/resources/orderClothes/orderClothes.model';
import OrderClothes from '@/resources/orderClothes/orderClothes.interface';
import { Schema } from 'mongoose';
import ClothesService from '@/resources/clothes/clothes.service';
import Clothes from '@/resources/clothes/clothes.interface';
import Order from '@/resources/order/order.interface';
import OrderModel from '@/resources/order/order.model';
import Props from '@/utils/types/props.type';

class OrderClothesService {
    private orderClothes = OrderClothesModel;
    private ClothesService = new ClothesService();
    private order = OrderModel;

    private async isUserOrder(
        _id: Schema.Types.ObjectId,
        account_id: Schema.Types.ObjectId
    ): Promise<boolean | Error> {
        const orderClothes = (await this.orderClothes
            .findOne({
                _id: _id,
            })
            .populate({
                path: 'order_id',
                populate: { path: '_id' },
            })) as OrderClothes;

        if (!orderClothes) {
            throw new Error('No such order clothes exists.');
        }
        const order = orderClothes.order_id as Order;

        const order_user_id = order.user_id;

        return account_id.toString() === order_user_id.toString();
    }

    /**
     * Create a new order clothes
     */
    public async create(
        clothes_id: Schema.Types.ObjectId,
        order_id: Schema.Types.ObjectId,
        count: number,
        size: string,
        color: string
    ): Promise<OrderClothes | Error> {
        try {
            const clothes = (await this.ClothesService.find({
                _id: clothes_id,
            })) as Array<Clothes>;

            if (!clothes) {
                throw new Error('Unable to add clothes with that data');
            }

            const clothesCount = clothes[0].clothesCount.find(
                (item) => item.size === size
            );

            if (clothesCount && clothesCount.count < count) {
                throw new Error(
                    'The number of clothes specified in the order exceeds the allowable'
                );
            }

            const orderClothes = await this.orderClothes.create({
                clothes_id,
                order_id,
                count,
                size,
                color,
            });

            return orderClothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to delete orderClothes by id
     */
    public async delete(
        _id: Schema.Types.ObjectId,
        account_id: Schema.Types.ObjectId
    ): Promise<OrderClothes | Error> {
        try {
            const bool = await this.isUserOrder(_id, account_id);

            if (!bool) {
                throw new Error(
                    'You are not allowed to delete this order clothes'
                );
            }

            const orderClothes = await this.orderClothes
                .findByIdAndDelete(_id)
                .populate({
                    path: 'clothes_id',
                    populate: { path: '_id' },
                })
                .populate({
                    path: 'order_id',
                    populate: { path: '_id' },
                });

            if (!orderClothes) {
                throw new Error(
                    'Unable to delete order clothes with that data'
                );
            }

            return orderClothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to update orderClothes by id
     */
    public async update(
        _id: Schema.Types.ObjectId,
        clothes_id: Schema.Types.ObjectId,
        order_id: Schema.Types.ObjectId,
        count: number,
        size: string,
        color: string,
        account_id: Schema.Types.ObjectId
    ): Promise<OrderClothes | Error> {
        try {
            const bool = await this.isUserOrder(_id, account_id);

            if (!bool) {
                throw new Error(
                    'You are not allowed to view this order clothes'
                );
            }

            const currOrderClothes = (await this.orderClothes.findOne({
                _id: _id,
            })) as OrderClothes;

            if (!currOrderClothes) {
                throw new Error('There are no clothes in the order');
            }

            const clothes = (await this.ClothesService.find({
                _id: currOrderClothes.clothes_id,
            })) as Array<Clothes>;

            if (!clothes) {
                throw new Error('Unable to find clothes with that data');
            }

            const clothesCount = clothes[0].clothesCount.find(
                (item) => item.size === currOrderClothes.size
            );

            if (clothesCount && clothesCount.count < count) {
                throw new Error(
                    'The number of clothes specified in the order exceeds the allowable'
                );
            }

            const orderClothes = await this.orderClothes
                .findByIdAndUpdate(
                    { _id },
                    {
                        clothes_id: clothes_id,
                        order_id: order_id,
                        count: count,
                        size: size,
                        color: color,
                    },
                    { new: true }
                )
                .populate({
                    path: 'clothes_id',
                    populate: { path: '_id' },
                })
                .populate({
                    path: 'order_id',
                    populate: { path: '_id' },
                });

            if (!orderClothes) {
                throw new Error(
                    'Unable to update order clothes with thad data'
                );
            }

            return orderClothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find all sets
     */
    public async get(
        account_id: Schema.Types.ObjectId
    ): Promise<OrderClothes | Array<OrderClothes> | Error> {
        try {
            const orders_id = await this.order
                .find({ user_id: account_id })
                .select(['_id']);

            if (!orders_id) {
                throw new Error('Account does not contain orders');
            }
            const propertyValues = [] as Array<Schema.Types.ObjectId>;
            orders_id.map((item) => {
                propertyValues.push(item._id);
            });

            const orderClothes = await this.orderClothes
                .find({ order_id: { $in: propertyValues } }, null, {
                    sort: { createdAt: -1 },
                })
                .populate({
                    path: 'clothes_id',
                    populate: { path: '_id' },
                })
                .populate({
                    path: 'order_id',
                    populate: { path: '_id' },
                });

            if (!orderClothes) {
                throw new Error('Unable to find order clothes');
            }

            return orderClothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find orderClothes by id
     */
    public async find(
        _id: Schema.Types.ObjectId,
        clothes_id: Schema.Types.ObjectId,
        order_id: Schema.Types.ObjectId,
        count: number,
        size: string,
        color: string,
        account_id: Schema.Types.ObjectId
    ): Promise<OrderClothes | Array<OrderClothes> | Error> {
        try {
            if (_id) {
                const bool = await this.isUserOrder(_id, account_id);

                if (!bool) {
                    throw new Error(
                        'You are not allowed to view this order clothes'
                    );
                }
            }

            const orders_id = await this.order
                .find({ user_id: account_id })
                .select(['_id']);

            if (!orders_id) {
                throw new Error('Account does not contain orders');
            }
            const propertyValues = [] as Array<string>;
            orders_id.map((item) => {
                propertyValues.push(item._id.toString());
            });

            if (order_id) {
                const temp: string = order_id.toString();
                if (propertyValues.indexOf(temp) === -1) {
                    throw new Error('Account does not contain this order');
                }
            }

            let query = {} as any;

            if (!order_id) {
                query = {
                    _id: _id,
                    clothes_id: clothes_id,
                    order_id: { "$in" : propertyValues},
                    count: count,
                    size: size,
                    color: color,
                };
            } else {
                query = {
                    _id: _id,
                    clothes_id: clothes_id,
                    order_id: order_id,
                    count: count,
                    size: size,
                    color: color,
                };
            }

            Object.keys(query).forEach(key => query[key] === undefined ? delete query[key] : {});

            const orderClothes = await this.orderClothes
                .find(query).select(['order_id']);
                // .populate({
                //     path: 'clothes_id',
                //     populate: { path: '_id' },
                // })
                // .populate({
                //     path: 'order_id',
                //     populate: { path: '_id' },
                // });

            if (!orderClothes) {
                throw new Error('Unable to find order clothes with that data');
            }

            return orderClothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    public async search(
        props: Object
    ): Promise<OrderClothes | Array<OrderClothes> | Error> {
        try {
            const orderClothes = await this.orderClothes
                .find(props)
                .populate({
                    path: 'clothes_id',
                    populate: { path: '_id' },
                })
                .populate({
                    path: 'order_id',
                    populate: { path: '_id' },
                });

            if (!orderClothes) {
                throw new Error('Unable to find order clothes');
            }

            return orderClothes;
        } catch (error) {
            throw new Error('Unable to find order clothes');
        }
    }
}

export default OrderClothesService;
