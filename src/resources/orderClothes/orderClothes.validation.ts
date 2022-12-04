import Joi from 'joi';

const create = Joi.object({
    clothes_id: Joi.string().hex().length(24).required(),
    order_id: Joi.string().hex().length(24).required(),
    count: Joi.number().required(),
    size: Joi.string().required(),
    color: Joi.string().required(),
});

const update = Joi.object({
    _id: Joi.string().hex().length(24).required(),
    clothes_id: Joi.string().hex().length(24),
    order_id: Joi.string().hex().length(24),
    count: Joi.number(),
    size: Joi.string(),
    color: Joi.string(),
});

const delete0 = Joi.object({
    _id: Joi.string().hex().length(24).required(),
});

const find = Joi.object({
    _id: Joi.string().hex().length(24),
    clothes_id: Joi.string().hex().length(24),
    order_id: Joi.string().hex().length(24),
    count: Joi.number(),
    size: Joi.string(),
    color: Joi.string(),
});

export default { create, update, delete0, find };
