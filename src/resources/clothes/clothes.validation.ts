import Joi from 'joi';

const create = Joi.object({
    name: Joi.string().required(),
    images: Joi.required(),
    color: Joi.array().items(Joi.string().required()).required(),
    type: Joi.string().required(),
    price: Joi.number().required(),
    company: Joi.string().required(),
    sale: Joi.number().required(),
    material: Joi.string().required(),
    care: Joi.string().required(),
    clothesCount: Joi.array()
        .items({
            size: Joi.string().required(),
            count: Joi.number().required(),
        })
        .required(),
    sex: Joi.string().required(),
    collection_id: Joi.string().hex().length(24),
});

const update = Joi.object({
    _id: Joi.string().hex().length(24).required(),
    name: Joi.string(),
    imagesUrls: Joi.array().items(Joi.string()),
    gifUrl: Joi.string(),
    images: Joi.array(),
    color: Joi.array().items(Joi.string()),
    type: Joi.string(),
    price: Joi.number(),
    company: Joi.string(),
    sale: Joi.number(),
    material: Joi.string(),
    care: Joi.string(),
    clothesCount: Joi.array().items({
        size: Joi.string(),
        count: Joi.number(),
    }),
    sex: Joi.string(),
    collection_id: Joi.string().hex().length(24),
});

const delete0 = Joi.object({
    _id: Joi.string().hex().length(24).required(),
});

const exist = Joi.object({
    _id: Joi.string().hex().length(24).required(),
});

const imageDelete = Joi.object({
    _id: Joi.string().hex().length(24).required(),
    url: Joi.string().uri().required(),
});

const find = Joi.object({
    _id: Joi.string().hex().length(24),
    name: Joi.string(),
    type: Joi.string(),
    price: Joi.number(),
    company: Joi.string(),
    sale: Joi.number(),
    material: Joi.string(),
    care: Joi.string(),
    sex: Joi.string(),
    collection_id: Joi.string().hex().length(24),
    limit: Joi.number().default(0),
    fullTextSearch: Joi.boolean().default(false),
});

const filter = Joi.object({
    type: Joi.string().required(),
    from_price: Joi.number(),
    to_price: Joi.number(),
    size: Joi.array().items(Joi.string()),
});

export default {
    create,
    update,
    delete0,
    imageDelete,
    find,
    filter,
    exist,
};
