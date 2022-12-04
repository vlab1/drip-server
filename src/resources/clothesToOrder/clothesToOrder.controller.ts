import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import HttpException from '@/utils/exceptions/http.exception';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/clothesToOrder/clothesToOrder.validation';
import ClothesToOrderService from '@/resources/clothesToOrder/clothesToOrder.service';
import authenticated from '@/middleware/authenticated.middleware';
import adminPermissionMiddleware from '@/middleware/admin.permission.middleware';

class ClothesToOrderController implements Controller {
    public path = '/clothes-to-order';
    public router = Router();
    private ClothesToOrderService = new ClothesToOrderService();

    constructor() {
        this.initialiseRoutes();
    }

    private initialiseRoutes(): void {
        this.router.get(
            `${this.path}/order/info`,
            validationMiddleware(validate.getOrder),
            authenticated,
            this.orderInfo
        );
        this.router.get(
            `${this.path}/orders/info`,
            validationMiddleware(validate.getOrders),
            authenticated,
            this.orders
        );
        this.router.get(
            `${this.path}/admin/order/info`,
            validationMiddleware(validate.getOrder),
            authenticated,
            adminPermissionMiddleware,
            this.adminOrderInfo
        );
        this.router.get(
            `${this.path}/admin/orders/info`,
            authenticated,
            adminPermissionMiddleware,
            this.adminOrders
        );
    }

    private orderInfo = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            let { order_id } = req.body;

            const order = await this.ClothesToOrderService.orderInfo(
                order_id,
                req.account._id
            );

            res.status(200).json({ order });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private orders = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const account_id = req.account._id;

            const orders = await this.ClothesToOrderService.orders(account_id);

            res.status(200).json({ orders });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private adminOrderInfo = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            let { order_id } = req.body;

            const order = await this.ClothesToOrderService.adminOrderInfo(
                order_id
            );

            res.status(200).json({ order });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private adminOrders = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const orders = await this.ClothesToOrderService.adminOrders();

            res.status(200).json({ orders });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };
}

export default ClothesToOrderController;
