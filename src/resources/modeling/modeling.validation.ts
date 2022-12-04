import Joi from 'joi';

const create = Joi.object({
    name: Joi.string().required(),
    size: Joi.string().required(),
    color: Joi.string().required(),
    user_id: Joi.string().hex().length(24).required(),
    images: Joi.array()
        .items({
            imageUrl: Joi.string().required(),
            x_coordinate: Joi.number().required(),
            y_coordinate: Joi.number().required(),
        })
        .required(),
});

const update = Joi.object({
    _id: Joi.string().hex().length(24).required(),
    name: Joi.string(),
    size: Joi.string(),
    color: Joi.string(),
    user_id: Joi.string().hex().length(24),
    images: Joi.array().items({
        imageUrl: Joi.string().required(),
        x_coordinate: Joi.number().required(),
        y_coordinate: Joi.number().required(),
    }),
});

const delete0 = Joi.object({
    _id: Joi.string().hex().length(24).required(),
});

const find = Joi.object({
    _id: Joi.string().hex().length(24),
    name: Joi.string(),
    size: Joi.string(),
    color: Joi.string(),
    user_id: Joi.string().hex().length(24),
});

export default { create, update, delete0, find };
