import Joi from 'joi';

const getOrder = Joi.object({
    order_id: Joi.string().hex().length(24)
});

const getOrders = Joi.object({
    account_id: Joi.string().hex().length(24),
});

export default { getOrder, getOrders };
