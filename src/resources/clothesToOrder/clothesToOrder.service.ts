import { Schema } from 'mongoose';
import OrderModel from '@/resources/order/order.model';
import OrderClothesModel from '@/resources/orderClothes/orderClothes.model';
import {
    ClothesItem,
    OrderInfo,
    OrderItem,
    UserInfo,
} from '@/resources/clothesToOrder/clothesToOrder.interface';
import { Clothes } from '@/resources/clothes/clothes.interface';
import OrderClothes from '@/resources/orderClothes/orderClothes.interface';
import { ClothesImage } from '@/resources/clothesToOrder/clothesToOrder.interface';
import ClothesService from '@/resources/clothes/clothes.service';
import OrderClothesService from '@/resources/orderClothes/orderClothes.service';
import OrderService from '@/resources/order/order.service';
import Order from '@/resources/order/order.interface';
import Account from '@/resources/account/account.interface';
import ModelingModel from '@/resources/modeling/modeling.model';
import { Modeling } from '@/resources/modeling/modeling.interface';

class ClothesToOrderService {
    private order = OrderModel;
    private modeling = ModelingModel;
    private orderClothes = OrderClothesModel;
    private ClothesService = new ClothesService();
    private OrderClothesService = new OrderClothesService();
    private OrderService = new OrderService();

    private orderClothesSortFunction(a: any, b: any) {
        if (a[0]._id === b[0]._id) {
            return 0;
        } else {
            return a[0]._id < b[0]._id ? 1 : -1;
        }
    }
    private ordersSortFunction(a: any, b: any) {
        if (a._id < b._id) {
            return -1;
        }
        if (a._id > b._id) {
            return 1;
        }
        return 0;
    }

    /**
     * Attempt to get order info
     */
    public async orderInfo(
        order_id: Schema.Types.ObjectId,
        account_id: Schema.Types.ObjectId
    ): Promise<OrderInfo | Error> {
        try {
            if (!order_id) {
                const user_cart = (await this.OrderService.find(
                    {
                        user_id: account_id,
                        status: 'cart',
                    },
                    account_id
                )) as Array<Order>;
                order_id = user_cart[0]._id;
            } else {
                const order_permission = (await this.OrderService.find(
                    {
                        _id: order_id,
                        user_id: account_id,
                    },
                    account_id
                )) as Array<Order>;
                if (order_permission && order_permission.length <= 0) {
                    throw new Error('You are not allowed to view this order');
                }
            }

            this.orderClear(order_id);

            const order = await this.order.findOne({ _id: order_id }).exec();

            const orderClothes = await this.orderClothes
                .find({ order_id: order_id })
                .populate({
                    path: 'clothes_id',
                    populate: { path: '_id' },
                })
                .exec();
            if (!order) {
                throw new Error('Unable to find  order');
            }

            if (!orderClothes) {
                throw new Error('Unable to find order clothes');
            }
            if (orderClothes.length > 0) {
                await Promise.all(
                    orderClothes.map(
                        async (item: OrderClothes, index: number) => {
                            if (item.productModel === 'Modeling') {
                                const modelingObj = item.clothes_id as Modeling;
                                const modeling = await this.modeling
                                    .findById({ _id: modelingObj._id })
                                    .populate({
                                        path: 'clothes_id',
                                        populate: { path: '_id' },
                                    });
                                  
                                if (!modeling) {
                                    throw new Error(
                                        'Unable to find order clothes'
                                    );
                                }            
                                orderClothes[index].clothes_id = modeling;
                                item.clothes_id = modeling;
                 
                            }
                        }
                    )
                );
            }
            const orderInfo = {} as OrderInfo;
            if (orderClothes.length === 0) {
                return orderInfo;
            }
            orderInfo.clothes = [] as Array<ClothesItem>;

            orderClothes.map((item) => {
                const clothesItem = {} as ClothesItem;
                if (item.productModel === 'Modeling') {
                    const modeling = item.clothes_id as Modeling;
                    clothesItem.modeling = modeling;
                }

                let clothes = {} as Clothes | Modeling;

                if (item.productModel === 'Clothes') {
                    clothes = item.clothes_id as Clothes;
                }
                if (item.productModel === 'Modeling') {
                    clothes = item.clothes_id as Modeling;
                    if (clothes) {
                        clothes = clothes.clothes_id as Clothes;
                    }
                }        
                clothes = clothes as Clothes;
                clothesItem.isModeling = clothes.isModeling;
                clothesItem.productModel = item.productModel;
                clothesItem.clothes_id = clothes._id;
                clothesItem.orderClothes_id = item._id;
                if (
                    clothes &&
                    clothes.imagesUrls &&
                    clothes.imagesUrls.length >= 1
                ) {
                    clothesItem.image = clothes.imagesUrls[0];
                    clothesItem.name = clothes.name;
                }
                clothesItem.size = item.size;
                if (order.status === 'cart') {
                    clothesItem.price = clothes.price;
                    clothesItem.sale = clothes.sale;
                    clothesItem.salePrice =
                        clothes.price - clothes.price * (clothes.sale / 100);
                    clothesItem.totalPrice = clothesItem.salePrice * item.count;
                } else {
                    clothesItem.price = item.clothesPrice;
                    clothesItem.sale = item.clothesSale;
                    clothesItem.salePrice =
                        item.clothesPrice -
                        item.clothesPrice * (item.clothesSale / 100);
                    clothesItem.totalPrice = clothesItem.salePrice * item.count;
                }

                clothesItem.count = item.count;
                clothesItem.color = item.color;

                orderInfo.clothes.push(clothesItem);
            });

            orderInfo.order_id = order._id;
            orderInfo.total = orderInfo.clothes
                .map((item) => item.totalPrice)
                .reduce((prev, next) => prev + next);
            orderInfo.status = order.status;

            return orderInfo;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to get user orders
     */
    public async orders(
        account_id: Schema.Types.ObjectId
    ): Promise<Array<OrderItem> | Error> {
        try {
            let orders = await this.order
                .find({ user_id: account_id, status: { $ne: 'cart' } })
                .exec();

            if (!orders) {
                throw new Error('Unable to find orders');
            }

            let orderClothes = [] as Array<Array<OrderClothes>>;

            await Promise.all(
                orders.map(async (item) => {
                    this.orderClear(item._id);
                    const orderClothesItem = (await this.orderClothes
                        .find({ order_id: item._id })
                        .populate({
                            path: 'clothes_id',
                            populate: { path: '_id' },
                        })
                        .exec()) as Array<OrderClothes>;
                    if (orderClothesItem.length > 0) {
                        await Promise.all(
                            orderClothesItem.map(
                                async (item: OrderClothes, index: number) => {
                                    if (item.productModel === 'Modeling') {
                                        const modelingObj = item.clothes_id as Modeling;
                                        const modeling = await this.modeling
                                            .findById({ _id: modelingObj._id })
                                            .populate({
                                                path: 'clothes_id',
                                                populate: { path: '_id' },
                                            });
                                        if (!modeling) {
                                            throw new Error(
                                                'Unable to find order clothes'
                                            );
                                        }
                                        orderClothesItem[index].clothes_id =
                                            modeling;
                                        item.clothes_id = modeling;
                                    }
                                }
                            )
                        );
                    }
                    orderClothes.push(orderClothesItem);
                })
            );

            if (!orderClothes) {
                throw new Error('Unable to find order clothes');
            }
            orderClothes.sort(this.orderClothesSortFunction);
            orders.sort(this.ordersSortFunction);
            orderClothes = orderClothes.filter((item) => item.length > 0);

            if (orderClothes.length < orders.length) {
                orders = orders.filter((item) => item.status !== 'cart');
            }

            const orderItems = [] as Array<OrderItem>;

            for (let i = 0; i < orderClothes.length; i++) {
                const orderItem = {} as OrderItem;
                const clothesItems = [] as Array<ClothesItem>;
                orderItem.images = [] as Array<ClothesImage>;
                const clothesImage = {} as ClothesImage;

                orderItem._id = orders[i]._id;

                const date = new Date(
                    parseInt(orders[i]._id.toString().substring(0, 8), 16) *
                        1000
                );

                orderItem.order_number = date.getTime().toString();
                orderItem.status = orders[i].status;
                orderItem.status_update = orders[i].status_update;

                for (let j = 0; j < orderClothes[i].length; j++) {
                    let clothes = orderClothes[i][j].clothes_id as
                        | Clothes
                        | Modeling;

                    if (orderClothes[i][j].productModel === 'Clothes') {
                        clothes = orderClothes[i][j].clothes_id as Clothes;
                    }
                    if (orderClothes[i][j].productModel === 'Modeling') {
                        clothes = orderClothes[i][j].clothes_id as Modeling;
                        if (clothes) {
                            clothes = clothes.clothes_id as Clothes;
                        }
                    }
                    clothes = clothes as Clothes;
                    if (!clothes) {
                        continue;
                    }
                    clothesImage.isModeling = clothes.isModeling;
                    if (orderClothes[i][j].productModel === 'Modeling') {
                        const modeling = orderClothes[i][j].clothes_id as Modeling;
                        clothesImage.modeling = modeling;
                    }
                    const clothesItem = {} as ClothesItem;
                    clothesItem.isModeling = clothes.isModeling;
                    if (orderClothes[i][j].productModel === 'Modeling') {
                        const modeling = orderClothes[i][j].clothes_id as Modeling;
                        clothesItem.modeling = modeling;
                    }
                    clothesItem.clothes_id = clothes._id;
                    if (
                        clothes &&
                        clothes.imagesUrls &&
                        clothes.imagesUrls.length >= 1
                    ) {
                        clothesItem.image = clothes.imagesUrls[0];
                        clothesImage.clothes_id = clothes._id;
                        clothesImage.clothes_type = clothes.type;
                        clothesImage.image = clothes.imagesUrls[0];
                        orderItem.images.push(clothesImage);
                        clothesItem.clothes_type = clothes.type;
                    }
                    clothesItem.size = orderClothes[i][j].size;
                    if (orderItem.status === 'cart') {
                        clothesItem.price = clothes.price;
                        clothesItem.sale = clothes.sale;
                        clothesItem.salePrice =
                            clothes.price -
                            clothes.price * (clothes.sale / 100);
                        clothesItem.totalPrice =
                            clothesItem.salePrice * orderClothes[i][j].count;
                    } else {
                        clothesItem.price = orderClothes[i][j].clothesPrice;
                        clothesItem.sale = orderClothes[i][j].clothesSale;
                        clothesItem.salePrice =
                            clothesItem.price -
                            clothesItem.price * (clothesItem.sale / 100);
                        clothesItem.totalPrice =
                            clothesItem.salePrice * orderClothes[i][j].count;
                    }

                    clothesItem.count = orderClothes[i][j].count;
                    clothesItem.color = orderClothes[i][j].color;
                    clothesItems.push(clothesItem);
                }
                orderItem.total = clothesItems
                    .map((item) => item.totalPrice)
                    .reduce((prev, next) => prev + next);
                orderItems.push(orderItem);
                orderItem.images = clothesItems;
            }
            return orderItems;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to get order info
     */
    public async adminOrderInfo(
        order_id: Schema.Types.ObjectId
    ): Promise<OrderInfo | Error> {
        try {
            this.orderClear(order_id);

            const order = await this.order.findOne({ _id: order_id }).exec();

            const orderClothes = await this.orderClothes
                .find({ order_id: order_id })
                .populate({
                    path: 'clothes_id',
                    populate: { path: '_id' },
                })
                .exec();

            if (!order) {
                throw new Error('Unable to find  order');
            }

            if (!orderClothes) {
                throw new Error('Unable to find order clothes');
            }

            if (orderClothes.length > 0) {
                await Promise.all(
                    orderClothes.map(
                        async (item: OrderClothes, index: number) => {
                            if (item.productModel === 'Modeling') {
                                const modelingObj = item.clothes_id as Modeling;
                                const modeling = await this.modeling
                                    .findById({ _id: modelingObj._id })
                                    .populate({
                                        path: 'clothes_id',
                                        populate: { path: '_id' },
                                    });
                                if (!modeling) {
                                    throw new Error(
                                        'Unable to find order clothes'
                                    );
                                }
                                orderClothes[index].clothes_id = modeling;
                                item.clothes_id = modeling;
                            }
                        }
                    )
                );
            }

            const orderInfo = {} as OrderInfo;
            if (orderClothes.length === 0) {
                return orderInfo;
            }
            orderInfo.clothes = [] as Array<ClothesItem>;

            orderClothes.map((item) => {
                const clothesItem = {} as ClothesItem;
                if (item.productModel === 'Modeling') {
                    const modeling = item.clothes_id as Modeling;
                    clothesItem.modeling = modeling;
                }
                let clothes = {} as Clothes | Modeling;

                if (item.productModel === 'Clothes') {
                    clothes = item.clothes_id as Clothes;
                }
                if (item.productModel === 'Modeling') {
                    clothes = item.clothes_id as Modeling;
                    if (clothes) {
                        clothes = clothes.clothes_id as Clothes;
                    }
                }
                clothes = clothes as Clothes;
                clothesItem.isModeling = clothes.isModeling;
                clothesItem.productModel = item.productModel;
                clothesItem.clothes_id = clothes._id;
                clothesItem.orderClothes_id = item._id;
                if (
                    clothes &&
                    clothes.imagesUrls &&
                    clothes.imagesUrls.length >= 1
                ) {
                    clothesItem.image = clothes.imagesUrls[0];
                    clothesItem.name = clothes.name;
                }
                clothesItem.size = item.size;
                if (order.status === 'cart') {
                    clothesItem.price = clothes.price;
                    clothesItem.sale = clothes.sale;
                    clothesItem.salePrice =
                        clothes.price - clothes.price * (clothes.sale / 100);
                    clothesItem.totalPrice = clothesItem.salePrice * item.count;
                } else {
                    clothesItem.price = item.clothesPrice;
                    clothesItem.sale = item.clothesSale;
                    clothesItem.salePrice =
                        item.clothesPrice -
                        item.clothesPrice * (item.clothesSale / 100);
                    clothesItem.totalPrice = clothesItem.salePrice * item.count;
                }

                clothesItem.count = item.count;
                clothesItem.color = item.color;

                orderInfo.clothes.push(clothesItem);
            });

            orderInfo.order_id = order._id;
            orderInfo.total = orderInfo.clothes
                .map((item) => item.totalPrice)
                .reduce((prev, next) => prev + next);
            orderInfo.status = order.status;

            return orderInfo;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to get user orders
     */
    public async adminOrders(): Promise<Array<OrderItem> | Error> {
        try {
            let orders = await this.order
                .find({ status: { $ne: 'cart' } })
                .populate({
                    path: 'user_id',
                    populate: { path: '_id' },
                })
                .exec();

            if (!orders) {
                throw new Error('Unable to find orders');
            }

            let orderClothes = [] as Array<Array<OrderClothes>>;

            await Promise.all(
                orders.map(async (item) => {
                    this.orderClear(item._id);
                    const orderClothesItem = (await this.orderClothes
                        .find({ order_id: item._id})
                        .populate({
                            path: 'clothes_id',
                            populate: { path: '_id' },
                        })
                        .exec()) as Array<OrderClothes>;
                    if (orderClothesItem.length > 0) {
                        await Promise.all(
                            orderClothesItem.map(
                                async (item: OrderClothes, index: number) => {
                                    if (item.productModel === 'Modeling') {
                                        const modelingObj = item.clothes_id as Modeling;
                                        const modeling = await this.modeling
                                            .findById({ _id: modelingObj._id })
                                            .populate({
                                                path: 'clothes_id',
                                                populate: { path: '_id' },
                                            });
                                        if (!modeling) {
                                            throw new Error(
                                                'Unable to find order clothes'
                                            );
                                        }
                                        orderClothesItem[index].clothes_id =
                                            modeling;
                                        item.clothes_id = modeling;
                          
                                    }
                                }
                            )
                        );
                    }
                    orderClothes.push(orderClothesItem);
                })
            );

            if (!orderClothes) {
                throw new Error('Unable to find order clothes');
            }

            orderClothes.sort(this.orderClothesSortFunction);
            orders.sort(this.ordersSortFunction);
            orderClothes = orderClothes.filter((item) => item.length > 0);

            if (orderClothes.length < orders.length) {
                orders = orders.filter((item) => item.status !== 'cart');
            }

            const orderItems = [] as Array<OrderItem>;

            for (let i = 0; i < orderClothes.length; i++) {
                const orderItem = {} as OrderItem;
                const clothesItems = [] as Array<ClothesItem>;
                orderItem.images = [] as Array<ClothesImage>;
                const clothesImage = {} as ClothesImage;
                const userInfo = {} as UserInfo;
         
                orderItem._id = orders[i]._id;
                orderItem.invoice = orders[i].invoice;
                orderItem.region = orders[i].region;
                orderItem.city = orders[i].city;
                orderItem.novaposhta = orders[i].novaposhta;
                orderItem.phone = orders[i].phone;
                const name = orders[i].name !== undefined ? orders[i].name : '';
                const surname =
                    orders[i].surname !== undefined ? orders[i].surname : '';
                const patronymic =
                    orders[i].patronymic !== undefined
                        ? orders[i].patronymic
                        : '';
                orderItem.name = name + ' ' + surname + ' ' + patronymic;
                orderItem.email = orders[i].email;

                const user = orders[i].user_id as Account;
                userInfo.user_id = user._id;
                const name1 = user.name !== undefined ? user.name : '';
                const surname1 = user.surname !== undefined ? user.surname : '';
                const patronymic1 =
                    user.patronymic !== undefined ? user.patronymic : '';
                userInfo.name = name1 + ' ' + surname1 + ' ' + patronymic1;
                userInfo.email = user.email;
                orderItem.user_info = userInfo;

                const date = new Date(
                    parseInt(orders[i]._id.toString().substring(0, 8), 16) *
                        1000
                );
        
                orderItem.order_number = date.getTime().toString();
                orderItem.status = orders[i].status;
                orderItem.status_update = orders[i].status_update;

                for (let j = 0; j < orderClothes[i].length; j++) {
                    let clothes = orderClothes[i][j].clothes_id as
                        | Clothes
                        | Modeling;

                    if (orderClothes[i][j].productModel === 'Clothes') {
                        clothes = orderClothes[i][j].clothes_id as Clothes;
                    }
                    if (orderClothes[i][j].productModel === 'Modeling') {
                        clothes = orderClothes[i][j].clothes_id as Modeling;
                        if (clothes) {
                            clothes = clothes.clothes_id as Clothes;
                        }
                    }
                    clothes = clothes as Clothes;
                    if (!clothes) {
                        continue;
                    }               
                    clothesImage.isModeling = clothes.isModeling;
                    if (orderClothes[i][j].productModel === 'Modeling') {
                        const modeling = orderClothes[i][j].clothes_id as Modeling;
                        clothesImage.modeling = modeling;
                    }
                    const clothesItem = {} as ClothesItem;
                    clothesItem.isModeling = clothes.isModeling;
                    if (orderClothes[i][j].productModel === 'Modeling') {
                        const modeling = orderClothes[i][j].clothes_id as Modeling;
                        clothesItem.modeling = modeling;
                    }
                    clothesItem.clothes_id = clothes._id;
                    clothesItem.clothes_type = clothes.type;
                    clothesItem.clothes_name = clothes.name;
                    clothesItem.clothes_count = orderClothes[i][j].count;
                    clothesItem.clothes_size = orderClothes[i][j].size;
                    clothesImage.clothes_type = clothes.type;
                    clothesImage.clothes_name = clothes.name;
                    clothesImage.clothes_count = orderClothes[i][j].count;
                    clothesImage.clothes_size = orderClothes[i][j].size;

                    if (
                        clothes &&
                        clothes.imagesUrls &&
                        clothes.imagesUrls.length >= 1
                    ) {
                        clothesItem.image = clothes.imagesUrls[0];
                        clothesImage.clothes_id = clothes._id;
                        clothesImage.image = clothes.imagesUrls[0];
                        orderItem.images.push(clothesImage);
                    }
                    clothesItem.size = orderClothes[i][j].size;
                    if (orderItem.status === 'cart') {
                        clothesItem.price = clothes.price;
                        clothesItem.sale = clothes.sale;
                        clothesItem.salePrice =
                            clothes.price -
                            clothes.price * (clothes.sale / 100);
                        clothesItem.totalPrice =
                            clothesItem.salePrice * orderClothes[i][j].count;
                    } else {
                        clothesItem.price = orderClothes[i][j].clothesPrice;
                        clothesItem.sale = orderClothes[i][j].clothesSale;
                        clothesItem.salePrice =
                            clothesItem.price -
                            clothesItem.price * (clothesItem.sale / 100);
                        clothesItem.totalPrice =
                            clothesItem.salePrice * orderClothes[i][j].count;
                    }

                    clothesItem.count = orderClothes[i][j].count;
                    clothesItem.color = orderClothes[i][j].color;
                    clothesItems.push(clothesItem);
                }
                orderItem.total = clothesItems
                    .map((item) => item.totalPrice)
                    .reduce((prev, next) => prev + next);
                orderItems.push(orderItem);
                orderItem.images = clothesItems;
            }

            return orderItems;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to get order cler
     */
    public async orderClear(
        order_id: Schema.Types.ObjectId
    ): Promise<void | Error> {
        try {
            const clothes = (await this.orderClothes.find({
                order_id: order_id,
            })) as Array<OrderClothes>;
            if (!clothes) {
                throw new Error('Unable to find clothes in this order');
            }
            await Promise.all(
                clothes.map(async (item, index) => {
                    if (item.productModel === 'Modeling') {
                        const modeling = await this.modeling
                            .findById({ _id: item.clothes_id })
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
            ]);

            await Promise.all(
                clothes_id.map(async (item) => {
                    const objectid = item[0] as Schema.Types.ObjectId;
                    const exist = await this.ClothesService.exist(objectid);
                    if (!exist) {
                        await this.orderClothes.deleteMany({
                            clothes_id: objectid,
                        });
                    }
                })
            );
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export default ClothesToOrderService;
