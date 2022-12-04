import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import HttpException from '@/utils/exceptions/http.exception';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/collection/collection.validation';
import CollectionService from '@/resources/collection/collection.service';
import authenticated from '@/middleware/authenticated.middleware';
import adminPermissionMiddleware from '@/middleware/admin.permission.middleware';
const multer = require('multer');
const memoStorage = multer.memoryStorage();
const upload = multer({ memoStorage });

class CollectionController implements Controller {
    public path = '/collection';
    public router = Router();
    private CollectionService = new CollectionService();

    constructor() {
        this.initialiseRoutes();
    }

    private initialiseRoutes(): void {
        this.router.post(
            `${this.path}/create`,
            upload.array('pic'),
            validationMiddleware(validate.create),
            authenticated,
            adminPermissionMiddleware,
            this.create
        );
        this.router.put(
            `${this.path}/update`,
            upload.array('pic'),
            validationMiddleware(validate.update),
            authenticated,
            adminPermissionMiddleware,
            this.update
        );
        this.router.delete(
            `${this.path}/delete`,
            validationMiddleware(validate.delete0),
            authenticated,
            adminPermissionMiddleware,
            this.delete
        );
        this.router.delete(
            `${this.path}/image/delete`,
            validationMiddleware(validate.imageDelete),
            authenticated,
            adminPermissionMiddleware,
            this.deleteImage
        );
        this.router.get(`${this.path}`, this.get);
        this.router.get(
            `${this.path}/find`,
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
            const { name, images, description } = req.body;

            const collection = await this.CollectionService.create(
                name,
                images,
                description
            );

            res.status(201).json({ collection });
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
            const { _id, name, imagesUrls, gifUrl, images, description } =
                req.body;
            const collection = await this.CollectionService.update(
                _id,
                name,
                imagesUrls,
                gifUrl,
                images,
                description
            );

            res.status(200).json({ collection });
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

            const collection = await this.CollectionService.delete(_id);

            res.status(200).json({ collection });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private deleteImage = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { _id, url } = req.body;

            const collection = await this.CollectionService.deleteImage(
                _id,
                url
            );

            res.status(200).json({ collection });
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
            const collections = await this.CollectionService.get();

            res.status(200).json({ collections });
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
            const collections = await this.CollectionService.find(props);

            res.status(200).json({ collections });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };
}

export default CollectionController;
