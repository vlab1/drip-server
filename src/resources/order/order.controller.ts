import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import HttpException from '@/utils/exceptions/http.exception';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/order/order.validation';
import OrderService from '@/resources/order/order.service';
import authenticated from '@/middleware/authenticated.middleware';
import adminPermissionMiddleware from '@/middleware/admin.permission.middleware';

class OrderController implements Controller {
    public path = '/order';
    public router = Router();
    private OrderService = new OrderService();

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
        this.router.post(
            `${this.path}/create-checkout-session`, 
            authenticated,
            this.pay
        );
        this.router.put(
            `${this.path}/update`,
            validationMiddleware(validate.update),
            authenticated,
            this.update
        );
        this.router.delete(
            `${this.path}/delete`,
            validationMiddleware(validate.delete0),
            authenticated,
            adminPermissionMiddleware,
            this.delete
        );
        this.router.get(`${this.path}`, authenticated, this.get);
        this.router.get(
            `${this.path}/find`,
            validationMiddleware(validate.find),
            authenticated,
            this.find
        );
        this.router.get(
            `${this.path}/admin/get`,
            authenticated,
            adminPermissionMiddleware,
            this.adminGet
        );
        this.router.get(
            `${this.path}/admin/find`,
            validationMiddleware(validate.adminfind),
            authenticated,
            adminPermissionMiddleware,
            this.adminFind
        );
    }

    private create = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const {
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
            } = req.body;

            const order = await this.OrderService.create(
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
                payment_type
            );

            res.status(201).json({ order });
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

            const order = await this.OrderService.delete(_id);

            res.status(200).json({ order });
        } catch (error) {
            next(new HttpException(400, 'Cannot delete order'));
        }
    };

    private update = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const {
                _id,
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
            } = req.body;

            const account_id = req.account._id;

            const order = await this.OrderService.update(
                _id,
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
                account_id
            );

            res.status(200).json({ order });
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

            const orders = await this.OrderService.get(account_id);

            res.status(200).json({ orders });
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
            const props = req.body;
            const account_id = req.account._id;

            const orders = await this.OrderService.find(props, account_id);

            res.status(200).json({ orders });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private adminGet = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const props = req.body;

            const orders = await this.OrderService.adminGet(props);

            res.status(200).json({ orders });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private adminFind = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const {_id} = req.body;

            const orders = await this.OrderService.adminFind(_id);

            res.status(200).json({ orders });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private pay = async (
        req: Request, 
        res: Response,
        next: NextFunction
    ) : Promise<Response | void> => {
        try{
            const {cartItem} = req.body;
 
            const result = await this.OrderService.pay(cartItem);

            res.send({url: result.url, check: result.check});
        }catch(error: any){
            next(new HttpException(400, error.message));
        }
    };
}

export default OrderController;
