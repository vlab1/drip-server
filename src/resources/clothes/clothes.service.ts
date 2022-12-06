import ClothesModel from '@/resources/clothes/clothes.model';
import {Clothes} from '@/resources/clothes/clothes.interface';
import {ClothesCount} from '@/resources/clothes/clothes.interface';
import { Schema } from 'mongoose';
import Props from '@/utils/types/props.type';
const {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} = require('firebase/storage');
const storage = require('../../firebase');

class ClothesService {
    private clothes = ClothesModel;

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
    /**
     * Create a new Clothes
     */
    public async create(
        name: string,
        images: Express.Multer.File[],
        color: Array<string>,
        type: string,
        price: number,
        company: string,
        sale: number,
        material: string,
        care: string,
        clothesCount: Array<ClothesCount>,
        sex: string,
        collection_id: Schema.Types.ObjectId,
        isModeling: boolean
    ): Promise<Clothes | Error> {
        try {
            if (isModeling && images && images.length > 1) {
                throw new Error('Clothing layout can only contain one image');
            }

            if (isModeling && color && color.length > 1) {
                throw new Error('Clothing layout can only contain one color');
            }
  
            const imagesUrls: Array<string> = [];
            let gifUrls: Array<string> = [];

            await Promise.all(
                images.map(async (file: Express.Multer.File) => {
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
                            if (file?.mimetype === 'image/gif') {
                                gifUrls.push(url);
                            } else {
                                imagesUrls.push(url);
                            }
                        })
                        .catch((error: Error) => {
                            throw new Error(error.message);
                        });
                })
            );

            const gifUrl = gifUrls.join();

            const clothes = await this.clothes.create({
                name,
                imagesUrls,
                gifUrl,
                color,
                type,
                price,
                company,
                sale,
                material,
                care,
                clothesCount,
                sex,
                collection_id,
                isModeling
            });

            return clothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to update clothes
     */

    public async update(
        _id: Schema.Types.ObjectId,
        name: string,
        imagesUrls: Array<string>,
        gifUrl: string,
        images: Express.Multer.File[],
        color: Array<string>,
        type: string,
        price: number,
        company: string,
        sale: number,
        material: string,
        care: string,
        clothesCount: Array<ClothesCount>,
        sex: string,
        collection_id: Schema.Types.ObjectId,
    ): Promise<Clothes | Error> {
        try {
            const clothesTemp = await this.clothes.findById(_id).populate({
                path: 'collection_id',
                populate: { path: '_id' },
            });

            if (!clothesTemp) {
                throw new Error('Unable to find clothes');
            }

            if (!imagesUrls) {
                imagesUrls = clothesTemp.imagesUrls;
            }

            if (!gifUrl) {
                gifUrl = clothesTemp.gifUrl;
            }

            if (images && images.length > 0) {
                await Promise.all(
                    images.map(async (file: Express.Multer.File) => {
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
                                if (file?.mimetype === 'image/gif') {
                                    gifUrl = url;
                                } else {
                                    imagesUrls.push(url);
                                }
                            })
                            .catch((error: Error) => {
                                throw new Error(error.message);
                            });
                    })
                );
            }

            const clothes = await this.clothes
                .findByIdAndUpdate(
                    _id,
                    {
                        name: name,
                        imagesUrls: imagesUrls,
                        gifUrl: gifUrl,
                        color: color,
                        type: type,
                        price: price,
                        company: company,
                        sale: sale,
                        material: material,
                        care: care,
                        clothesCount: clothesCount,
                        sex: sex,
                        collection_id: collection_id,
                    },
                    { new: true }
                )
                .populate({
                    path: 'collection_id',
                    populate: { path: '_id' },
                });

            if (!clothes) {
                throw new Error('Unable to update clothes with thad data');
            }

            return clothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to delete clothes
     */
    public async delete(_id: Schema.Types.ObjectId): Promise<Clothes | Error> {
        try {
            const clothes = await this.clothes.findById(_id).populate({
                path: 'collection_id',
                populate: { path: '_id' },
            });

            if (!clothes) {
                throw new Error('Unable to find clothes with that data');
            }

            if (clothes.imagesUrls && clothes.imagesUrls.length > 0) {
                await Promise.all(
                    clothes.imagesUrls.map(async (image: string) => {
                        if (
                            this.isValidUrl(image) &&
                            image.indexOf('firebase') >= 0 &&
                            image.indexOf('%E2%98%82') >= 0 &&
                            image.indexOf('%E2%98%81') >= 0
                        ) {
                            const deletePic =
                                '☂' +
                                image
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

            if (clothes.gifUrl) {
                const deletePic =
                    '☂' +
                    clothes.gifUrl.split('%E2%98%82')[1].split('%E2%98%81')[0] +
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

            const removedClothing = await this.clothes
                .findByIdAndDelete(_id)
                .populate({
                    path: 'collection_id',
                    populate: { path: '_id' },
                });

            if (!removedClothing) {
                throw new Error('Unable to delete clothes with that data');
            }

            return removedClothing;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to delete image by url
     */

    public async deleteImage(
        _id: Schema.Types.ObjectId,
        url: string
    ): Promise<Clothes | Error> {
        try {
            const deletePic =
                '☂' + url.split('%E2%98%82')[1].split('%E2%98%81')[0] + '☁';
            const deleteRef = ref(storage, deletePic);
            const result = await deleteObject(deleteRef)
                .then(() => {
                    return true;
                })
                .catch((error: Error) => {
                    throw new Error(error.message);
                });

            let clothes = (await this.clothes.findById(_id)) as Clothes;

            if (!clothes) {
                throw new Error('Unable to find clothes with that data');
            }

            if (clothes.imagesUrls.includes(url)) {
                clothes = (await this.clothes.findByIdAndUpdate(
                    _id,
                    { $pullAll: { imagesUrls: [url] } },
                    { new: true }
                )) as Clothes;
            } else {
                clothes = (await this.clothes.findByIdAndUpdate(
                    _id,
                    { gifUrl: '' },
                    { new: true }
                )) as Clothes;
            }
            return clothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find all clothes
     */
    public async get(): Promise<Clothes | Array<Clothes> | Error> {
        try {
            const clothes = await this.clothes
                .find({}, null, { sort: { createdAt: -1 } })
                .populate({
                    path: 'collection_id',
                    populate: { path: '_id' },
                });

            if (!clothes) {
                throw new Error('Unable to find clothes');
            }

            return clothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find clothes
     */

    public async find(props: Props): Promise<Clothes | Array<Clothes> | Error> {
        try {
            if (props.fullTextSearch && props.name) {
                props.name = { $regex: new RegExp(props.name), $options: 'i' };
            }
            const clothes = await this.clothes
                .find(props, null, { sort: { createdAt: -1 } })
                .limit(props.limit)
                .populate({
                    path: 'collection_id',
                    populate: { path: '_id' },
                });

            if (!clothes) {
                throw new Error('Unable to find clothes with that data');
            }

            await Promise.all(
                clothes.map(async (item: Clothes) => {
                    let boolean = false;
                    item.imagesUrls.map((item: string) => {
                        if (
                            !(
                                item.indexOf('firebase') >= 0 &&
                                item.indexOf('%E2%98%82') >= 0 &&
                                item.indexOf('%E2%98%81') >= 0
                            )
                        ) {
                            boolean = true;
                        }
                    });
                    if (boolean) {
                        const _id = item._id;
                        await this.delete(_id);
                    }
                })
            );

            return clothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to filter clothes
     */
    public async filter(
        type: string,
        from_price: number,
        to_price: number,
        size: Array<string>
    ): Promise<Clothes | any> {
        try {
            let clothes = null;

            clothes = await this.clothes
                .find(
                    {
                        type: type,
                        $and: [
                            { price: { $gte: from_price, $lt: to_price } },
                            {
                                clothesCount: {
                                    $elemMatch: {
                                        size: { $in: size },
                                        count: { $gt: 0 },
                                    },
                                },
                            },
                        ],
                    },
                    null,
                    { sort: { createdAt: -1 } }
                )
                .populate({
                    path: 'collection_id',
                    populate: { path: '_id' },
                });

            if (!clothes) {
                throw new Error(
                    'Unable to find clothes that match the criteria'
                );
            }

            return clothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find clothes with sales
     */
    public async findBySales(): Promise<Clothes | Array<Clothes> | Error> {
        try {
            const clothes = await this.clothes
                .find({ sale: { $gte: 1 } }, null, { sort: { createdAt: -1 } })
                .populate({
                    path: 'collection_id',
                    populate: { path: '_id' },
                });

            if (!clothes) {
                throw new Error('Unable to find clothes with sales');
            }

            return clothes;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to check clothes exist
     */
    public async exist(_id: Schema.Types.ObjectId): Promise<Boolean | Error> {
        try {
            const clothes = await this.clothes.findOne({ _id: _id });

            if (!clothes) {
                return false;
            }

            const total = clothes.clothesCount
                .map((item) => item.count)
                .reduce((prev, next) => prev + next);

            return !(total === 0);
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to increment clothes count
     */
    public async incrementClothesCount(
        _id: Schema.Types.ObjectId,
        size: string,
        value: number
    ): Promise<void | Error> {
        try {
            const clothes = await this.clothes
                .findOneAndUpdate(
                    { _id: _id, 'clothesCount.size': size },
                    { $inc: { 'clothesCount.$.count': value } },
                    { new: true }
                )
                .exec();
            if (!clothes) {
                throw new Error('Unable to find and increment clothes');
            }
            const sizeCount = clothes.clothesCount.filter((item) => {
                return item.size === size;
            }) as Array<ClothesCount>;
            if (sizeCount[0].count < 0) {
                await this.clothes
                    .findOneAndUpdate(
                        { _id: _id, 'clothesCount.size': size },
                        { 'clothesCount.$.count': 0 },
                        { new: true }
                    )
                    .exec();
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export default ClothesService;
