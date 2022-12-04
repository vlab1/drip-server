import Joi from 'joi';

const create = Joi.object({
    name: Joi.string().required(),
    images: Joi.array().required(),
    description: Joi.string().required(),
});

const update = Joi.object({
    _id: Joi.string().hex().length(24).required(),
    images: Joi.array(),
    gifUrl: Joi.string(),
    imagesUrls: Joi.array().items(Joi.string()),
    name: Joi.string(),
    description: Joi.string(),
});

const delete0 = Joi.object({
    _id: Joi.string().hex().length(24).required(),
});

const imageDelete = Joi.object({
    _id: Joi.string().hex().length(24).required(),
    url: Joi.string().uri().required(),
});

const find = Joi.object({
    _id: Joi.string().hex().length(24),
    imageUrl: Joi.string().uri(),
    gifUrl: Joi.string().uri(),
    name: Joi.string(),
    description: Joi.string(),
});

export default { create, update, delete0, imageDelete, find };
