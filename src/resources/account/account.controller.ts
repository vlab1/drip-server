import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import HttpException from '@/utils/exceptions/http.exception';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/account/account.validation';
import AccountService from '@/resources/account/account.service';
import authenticated from '@/middleware/authenticated.middleware';
import adminPermissionMiddleware from '@/middleware/admin.permission.middleware';
import Props from '@/utils/types/props.type';
import Account from '@/resources/account/account.interface';

class AccountController implements Controller {
    public path = '/account';
    public router = Router();
    private AccountService = new AccountService();

    constructor() {
        this.initialiseRoutes();
    }

    private initialiseRoutes(): void {
        this.router.post(
            `${this.path}/register`,
            validationMiddleware(validate.register),
            this.register
        );
        this.router.post(
            `${this.path}/login`,
            validationMiddleware(validate.login),
            this.login
        );
        this.router.post(
            `${this.path}/google/login`,
            validationMiddleware(validate.googleLogin),
            this.googleLogin
        );
        this.router.put(
            `${this.path}/update`,
            validationMiddleware(validate.update),
            authenticated,
            this.update
        );
        this.router.put(
            `${this.path}/update/password`,
            validationMiddleware(validate.updatePassword),
            authenticated,
            this.updatePassword
        );
        this.router.delete(`${this.path}/delete`, authenticated, this.delete);
        this.router.get(`${this.path}`, authenticated, this.getAccount);

        this.router.delete(
            `${this.path}/admin/delete`,
            validationMiddleware(validate.adminDelete),
            authenticated,
            adminPermissionMiddleware,
            this.adminDelete
        );
        this.router.get(
            `${this.path}/admin/get`,
            authenticated,
            adminPermissionMiddleware,
            this.adminGet
        );
        this.router.get(
            `${this.path}/admin/find`,
            validationMiddleware(validate.adminFind),
            authenticated,
            adminPermissionMiddleware,
            this.adminFind
        );
        this.router.put(
            `${this.path}/admin/update/role`,
            validationMiddleware(validate.adminUpdateRole),
            authenticated,
            adminPermissionMiddleware,
            this.adminUpdateRole
        );
    }

    private register = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { email, password, name, surname } = req.body;

            const token = await this.AccountService.register(
                email,
                password,
                name,
                surname
            );

            res.status(201).json({ token });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private login = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { email, password } = req.body;

            const token = await this.AccountService.login(email, password);

            res.status(200).json({ token });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private googleLogin = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { email, passwordGoogle, name } = req.body;

            const token = await this.AccountService.googleLogin(
                email,
                passwordGoogle,
                name
            );

            res.status(200).json({ token });
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
                email,
                password,
                name,
                phone,
                role,
                surname,
                patronymic,
                region,
                city,
                novaposhta,
            } = req.body;
            const _id = req.account._id;
            const account = await this.AccountService.update(
                _id,
                email,
                password,
                name,
                phone,
                role,
                surname,
                patronymic,
                region,
                city,
                novaposhta
            );

            res.status(200).json({ account });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private updatePassword = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { new_password, password } = req.body;
            const _id = req.account._id;
            const account = await this.AccountService.updatePassword(
                _id,
                new_password,
                password
            );

            res.status(200).json({ account });
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
            const _id = req.account._id;
            const account = await this.AccountService.delete(_id);

            res.status(200).json({ account });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private getAccount = (
        req: Request,
        res: Response,
        next: NextFunction
    ): Response | void => {
        if (!req.account) {
            return next(new HttpException(404, 'No logged in account'));
        }

        res.status(200).send({ data: req.account });
    };

    private adminDelete = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { _id } = req.body;
            const account = await this.AccountService.adminDelete(_id);

            res.status(200).json({ account });
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
            const accounts = await this.AccountService.adminGet() as Array<Account>;

            res.status(200).json({accounts});
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
            const props = req.body as Props;
            const accounts = await this.AccountService.adminFind(props);

            res.status(200).json({ accounts });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

    private adminUpdateRole = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { _id, role } = req.body;

            const account = await this.AccountService.adminUpdateRole(
                _id,
                role
            );

            res.status(200).json({ account });
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    };

}

export default AccountController;
