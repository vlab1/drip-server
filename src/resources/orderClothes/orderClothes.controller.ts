import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import HttpException from '@/utils/exceptions/http.exception';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/orderClothes/orderClothes.validation';
import OrderClothesService from '@/resources/orderClothes/orderClothes.service';
import authenticated from '@/middleware/authenticated.middleware';
import adminPermissionMiddleware from '@/middleware/admin.permission.middleware';

class OrderClothesController implements Controller {
    public path = '/order-clothes';
    public router = Router();
    private OrderClothesService = new OrderClothesService();

    constructor() {
        this.initialiseRoutes();
    }

    private initialiseRoutes(): void {
        this.router.post(
            `${this.path}/create`,
            validationMiddleware(validate.create),
            authenticated,
            this.create
        );
        this.router.put(
            `${this.path}/update`,
            validationMiddleware(validate.update),
            authenticated,
            adminPermissionMiddleware,
            this.update
        );
        this.router.delete(
            `${this.path}/delete`,
            validationMiddleware(validate.delete0),
            authenticated,
            this.delete
        );
        this.router.get(`${this.path}`, authenticated, this.get);
        this.router.get(
            `${this.path}/find`,
            authenticated,
            validationMiddleware(validate.find),
            this.find
        );
    }

    private create = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { clothes_id, order_id, count, size, color, productModel } = req.body;

            const orderClothes = await this.OrderClothesService.create(
                clothes_id,
                order_id,
                count,
                size,
                color,
                productModel
            );

            res.status(201).json({ orderClothes });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private delete = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { _id } = req.body;

            const account_id = req.account._id;

            const orderClothes = await this.OrderClothesService.delete(
                _id,
                account_id
            );

            res.status(200).json({ orderClothes });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private update = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { _id, clothes_id, order_id, count, size, color } = req.body;

            const account_id = req.account._id;

            const orderClothes = await this.OrderClothesService.update(
                _id,
                clothes_id,
                order_id,
                count,
                size,
                color,
                account_id
            );

            res.status(200).json({ orderClothes });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private get = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const account_id = req.account._id;

            const orderClothes = await this.OrderClothesService.get(account_id);

            res.status(200).json({ orderClothes });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private find = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { _id, clothes_id, order_id, count, size, color } = req.body;
            const account_id = req.account._id;
            const orderClothes = await this.OrderClothesService.find(
                _id,
                clothes_id,
                order_id,
                count,
                size,
                color,
                account_id
            );

            res.status(200).json({ orderClothes });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };
}

export default OrderClothesController;
