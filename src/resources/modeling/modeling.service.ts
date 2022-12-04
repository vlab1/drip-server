import ModelingModel from '@/resources/modeling/modeling.model';
import Modeling from '@/resources/modeling/modeling.interface';
import { Schema } from 'mongoose';
import Image from '@/utils/interfaces/image.interface';
import Props from '@/utils/types/props.type';

class ModelingService {
    private modeling = ModelingModel;

    /**
     * Create a new modeling
     */
    public async create(
        name: string,
        size: string,
        color: string,
        user_id: Schema.Types.ObjectId,
        images: Array<Image>
    ): Promise<Modeling> {
        try {
            const modeling = await this.modeling.create({
                name,
                size,
                color,
                user_id,
                images,
            });

            return modeling;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to delete modeling by id
     */
    public async delete(_id: Schema.Types.ObjectId, account_id: Schema.Types.ObjectId): Promise<Modeling> {
        try {
            const modeling = await this.modeling
                .findOneAndDelete({ _id: _id, user_id: account_id})
                .populate({
                    path: 'user_id',
                    populate: { path: '_id' },
                });

            if (!modeling) {
                throw new Error('Unable to delete modeling with that data. Maybe your account doesn`t have this information.');
            }

            return modeling;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to update modeling by id
     */
    public async update(
        _id: Schema.Types.ObjectId,
        name: string,
        size: string,
        color: string,
        user_id: Schema.Types.ObjectId,
        images: Array<Image>,
        account_id: Schema.Types.ObjectId,
    ): Promise<Modeling> {
        try {
            const modeling = await this.modeling
                .findOneAndUpdate(
                    { _id: _id, user_id: account_id},
                    {
                        name: name,
                        size: size,
                        color: color,
                        user_id: user_id,
                        images: images,
                    },
                    { new: true }
                )
                .populate({
                    path: 'user_id',
                    populate: { path: '_id' },
                });

            if (!modeling) {
                throw new Error('Unable to update modeling with that data. Maybe your account doesn`t have this information.');
            }

            return modeling;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find all sets
     */
    public async get(account_id: Schema.Types.ObjectId): Promise<Modeling | Array<Modeling> | Modeling> {
        try {
            const modeling = await this.modeling.find({user_id: account_id}, null, {
                sort: { createdAt: -1 },
            });

            if (!modeling) {
                throw new Error('Unable to find modeling in this account');
            }

            return modeling;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find modeling by id
     */
    public async find(
        props: Props,
        account_id: Schema.Types.ObjectId
    ): Promise<Modeling | Array<Modeling> | Modeling> {
        try {
            props.user_id = account_id;

            const modeling = await this.modeling.find(props).populate({
                path: 'user_id',
                populate: { path: '_id' },
            });

            if (!modeling) {
                throw new Error('Unable to find modeling');
            }

            return modeling;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export default ModelingService;
