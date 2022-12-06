import ModelingModel from '@/resources/modeling/modeling.model';
import {
    Modeling,
    TextModeling,
    ImageModeling,
    FontStyle,
} from '@/resources/modeling/modeling.interface';
import { Schema } from 'mongoose';
import Props from '@/utils/types/props.type';
const {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} = require('firebase/storage');
const storage = require('../../firebase');
const sizeOf = require('buffer-image-size');
class ModelingService {
    private modeling = ModelingModel;

    private randGen() {
        const abc: string =
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let name: string = '';
        while (name.length < 50) {
            name += abc[Math.floor(Math.random() * abc.length)];
        }
        return name;
    }

    private isValidUrl(urlString: string) {
        var urlPattern = new RegExp(
            '^(https?:\\/\\/)?' +
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
                '((\\d{1,3}\\.){3}\\d{1,3}))' +
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
                '(\\?[;&a-z\\d%_.~+=-]*)?' +
                '(\\#[-a-z\\d_]*)?$',
            'i'
        );
        return !!urlPattern.test(urlString);
    }

    private getFileExtension(filename: string) {
        var ext = /^.+\.([^.]+)$/.exec(filename);
        return ext == null ? '' : ext[1];
    }

    /**
     * Create a new modeling
     */
    public async create(
        name: string,
        size: string,
        clothes_id: Schema.Types.ObjectId,
        account_id: Schema.Types.ObjectId
    ): Promise<Modeling> {
        try {
            const modeling = await this.modeling.create({
                name: name,
                size: size,
                clothes_id: clothes_id,
                user_id: account_id
            });

            return modeling;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to delete modeling by id
     */
    public async delete(
        _id: Schema.Types.ObjectId,
        account_id: Schema.Types.ObjectId
    ): Promise<Modeling | Error> {
        try {
            const modeling_temp = await this.modeling.findById(_id).exec();

            if (!modeling_temp) {
                throw new Error('Unable to find modeling with that data');
            }

            if (account_id.toString() !== modeling_temp.user_id.toString()) {
                throw new Error('You are not allowed to delete this modeling');
            }

            if (modeling_temp.images && modeling_temp.images.length > 0) {
                await Promise.all(
                    modeling_temp.images.map(async (image: ImageModeling) => {
                        if (
                            this.isValidUrl(image.imageUrl) &&
                            image.imageUrl.indexOf('firebase') >= 0 &&
                            image.imageUrl.indexOf('%E2%98%82') >= 0 &&
                            image.imageUrl.indexOf('%E2%98%81') >= 0
                        ) {
                            const deleteModelPic =
                                '☂' +
                                image.imageUrl
                                    .split('%E2%98%82')[1]
                                    .split('%E2%98%81')[0] +
                                '☁';
                            const deleteRef = ref(storage, deleteModelPic);
                            await deleteObject(deleteRef)
                                .then(() => {
                                    return true;
                                })
                                .catch((error: Error) => {
                                    throw new Error(error.message);
                                });
                        }
                    })
                );
            }

            const removedModeling = await this.modeling
                .findByIdAndDelete(_id)
                .populate({
                    path: 'user_id',
                    populate: { path: '_id' },
                });

            if (!removedModeling) {
                throw new Error('Unable to delete modeling with that data');
            }

            return removedModeling;
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
        images: Array<ImageModeling>,
        texts: Array<TextModeling>,
        newTexts: Array<TextModeling>,
        files: Express.Multer.File[],
        filesDescription: Array<ImageModeling>,
        account_id: Schema.Types.ObjectId
    ): Promise<Modeling> {
        try {
            const modeling_temp = await this.modeling.findById(_id).exec();

            if (!modeling_temp) {
                throw new Error('Unable to find modeling with that data');
            }

            if (account_id.toString() !== modeling_temp.user_id.toString()) {
                throw new Error('You are not allowed to update this modeling');
            }

            if (!images) {
                images = modeling_temp.images || [];
            }

            if (!texts) {
                texts = modeling_temp.texts || [];
            }

            if (files && files.length > 0 && !filesDescription) {
                throw new Error('You need to add a description of the files');
            }

            if (!files && filesDescription) {
                throw new Error('You need to add a files');
            }

            let deletedImages = [] as Array<ImageModeling>;
            if (modeling_temp.images.length > 0) {
                deletedImages = modeling_temp.images.filter(
                    (o1) => !images.some((o2) => o1.imageUrl === o2.imageUrl)
                );
            }

            if (deletedImages.length > 0) {
                await Promise.all(
                    deletedImages.map(async (image: ImageModeling) => {
                        if (
                            this.isValidUrl(image.imageUrl) &&
                            image.imageUrl.indexOf('firebase') >= 0 &&
                            image.imageUrl.indexOf('%E2%98%82') >= 0 &&
                            image.imageUrl.indexOf('%E2%98%81') >= 0
                        ) {
                            const deletePic =
                                '☂' +
                                image.imageUrl
                                    .split('%E2%98%82')[1]
                                    .split('%E2%98%81')[0] +
                                '☁';
                            const deleteRef = ref(storage, deletePic);
                            const result = await deleteObject(deleteRef)
                                .then(() => {
                                    return true;
                                })
                                .catch((error: Error) => {
                                    throw new Error(error.message);
                                });
                        }
                    })
                );
            }

            if (files && files.length > 0) {
                await Promise.all(
                    files.map(async (file: Express.Multer.File) => {
                        const randomName: string = '☂' + this.randGen() + '☁';
                        const imageRef = ref(storage, randomName);
                        const metatype = {
                            contentType: file?.mimetype,
                            name: randomName,
                        };
                        await uploadBytes(imageRef, file?.buffer, metatype)
                            .then((snapshot: object) => {})
                            .catch((error: Error) => {
                                throw new Error(error.message);
                            });
                        await getDownloadURL(ref(storage, randomName))
                            .then((url: string) => {
                                let fileDescription = {} as ImageModeling;
                                let originalname = file.originalname
                                    .split(
                                        '.' +
                                            this.getFileExtension(
                                                file.originalname
                                            )
                                    )
                                    .join('');
                                fileDescription = filesDescription.filter(
                                    (item) => item.originalname === originalname
                                )[0];
                                fileDescription.imageUrl = url;
                                const dimensions = sizeOf(file.buffer);
                                fileDescription.image_height =
                                    dimensions.height;
                                fileDescription.image_width = dimensions.width;
                                delete fileDescription.originalname;
                                images.push(fileDescription);
                            })
                            .catch((error: Error) => {
                                throw new Error(error.message);
                            });
                    })
                );
            }

            if (newTexts && newTexts.length > 0) {
                newTexts.map((item) => {
                    item.text_id = this.randGen();
                    texts.push(item);
                });
            }

            const modeling = await this.modeling
                .findOneAndUpdate(
                    { _id: _id },
                    {
                        name: name,
                        size: size,
                        images: images,
                        texts: texts,
                    },
                    { new: true }
                )
                .populate({
                    path: 'user_id',
                    populate: { path: '_id' },
                });

            if (!modeling) {
                throw new Error(
                    'Unable to update modeling with that data. Maybe your account doesn`t have this information.'
                );
            }

            return modeling;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find all sets
     */
    public async get(
        account_id: Schema.Types.ObjectId
    ): Promise<Modeling | Array<Modeling> | Modeling> {
        try {
            const modeling = await this.modeling.find(
                { user_id: account_id },
                null,
                {
                    sort: { createdAt: -1 },
                }
            );

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
