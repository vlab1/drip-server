import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import HttpException from '@/utils/exceptions/http.exception';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/modeling/modeling.validation';
import ModelingService from '@/resources/modeling/modeling.service';
import authenticated from '@/middleware/authenticated.middleware';
const multer = require('multer');
const memoStorage = multer.memoryStorage();
const upload = multer({ memoStorage });

class ModelingController implements Controller {
    public path = '/modeling';
    public router = Router();
    private ModelingService = new ModelingService();

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
            upload.array('pic'),
            validationMiddleware(validate.update),
            authenticated,
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
            const {
                name,
                size,
                clothes_id
            } = req.body;

            const account_id = req.account._id;

            const modeling = await this.ModelingService.create(
                name,
                size,
                clothes_id,
                account_id
            );

            res.status(201).json({ modeling });
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

            const modeling = await this.ModelingService.delete(_id, account_id);

            res.status(200).json({ modeling });
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
            const {
                _id,
                name,
                size,
                images,
                texts,
                newTexts,
                files,
                filesDescription
            } = req.body;

            const account_id = req.account._id;

            const modeling = await this.ModelingService.update(
                _id,
                name,
                size,
                images,
                texts,
                newTexts,
                files,
                filesDescription,
                account_id
            );

            res.status(200).json({ modeling });
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

            const modeling = await this.ModelingService.get(account_id);

            res.status(200).json({ modeling });
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

            const modeling = await this.ModelingService.find(props, account_id);

            res.status(200).json({ modeling });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };
}

export default ModelingController;
