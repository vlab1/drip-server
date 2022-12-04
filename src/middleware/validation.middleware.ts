import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';

function validationMiddleware(schema: Joi.Schema): RequestHandler {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        const validationOptions = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true,
        };

        try {
            let data;
            if (req.body.data) {
                data = JSON.parse(req.body.data);
                data['images'] = req.files;
            } else {
                data = req.body;
            }
            if (!(Object.keys(req.query).length === 0)) {
                data = req.query;
                if (
                    data.size &&
                    req.route.path.indexOf('order-clothes') == -1
                ) {
                    let size = data.size as string;
                    data.size = size.split(',');
                }
            }
            if (!(Object.keys(req.params).length === 0)) {
                data = req.params;
            }     
            const value = await schema.validateAsync(data, validationOptions);
            req.body = value;
            next();
        } catch (e: any) {
            const errors: string[] = [];
            e.details.forEach((error: Joi.ValidationErrorItem) => {
                errors.push(error.message);
            });
            res.status(400).send({ errors: errors });
        }
    };
}

export default validationMiddleware;
