import Joi from 'joi';

const create = Joi.object({
    name: Joi.string(),
    size: Joi.string(),
    clothes_id: Joi.string().hex().length(24).required(),
});

const update = Joi.object({
    _id: Joi.string().hex().length(24).required(),
    name: Joi.string(),
    size: Joi.string(),
    images: Joi.array().items(Joi.object({
        imageUrl: Joi.string(),
        image_height: Joi.number(),
        image_width: Joi.number(),
        rotate: Joi.number(),
        scale: Joi.number(),
        front_location: Joi.boolean(),
        x_coordinate: Joi.number(),
        y_coordinate: Joi.number(),
        z_coordinate: Joi.number(),
    })),
    texts: Joi.array().items(Joi.object({
        text_id: Joi.string(),
        text_size: Joi.number(),
        alignment: Joi.string(),
        text_color: Joi.string(),
        font: Joi.string(),
        text: Joi.string(),
        font_style: Joi.array().items({
            name: Joi.string(),
            value: Joi.string(),
        }).required(),
        rotate: Joi.number(),
        scale: Joi.number(),
        front_location: Joi.boolean(),
        x_coordinate: Joi.number(),
        y_coordinate: Joi.number(),
        z_coordinate: Joi.number(),
    })),
    newTexts: Joi.array().items(Joi.object({
        _id: Joi.string(),
        text_size: Joi.number(),
        alignment: Joi.string(),
        text_color: Joi.string(),
        font: Joi.string(),
        text: Joi.string(),
        font_style: Joi.array().items({
            name: Joi.string(),
            value: Joi.string(),
        }),
        rotate: Joi.number(),
        scale: Joi.number(),
        front_location: Joi.boolean(),
        x_coordinate: Joi.number(),
        y_coordinate: Joi.number(),
        z_coordinate: Joi.number(),
    })),
    files: Joi.array(),
    filesDescription: Joi.array().items(Joi.object({
        originalname: Joi.string(),
        image_height: Joi.number(),
        image_width: Joi.number(),
        rotate: Joi.number(),
        scale: Joi.number(),
        front_location: Joi.boolean(),
        x_coordinate: Joi.number(),
        y_coordinate: Joi.number(),
        z_coordinate: Joi.number(),
    })),
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
    name: Joi.string(),
    size: Joi.string(),
    user_id: Joi.string().hex().length(24),
});

export default { create, update, delete0, find, imageDelete };
