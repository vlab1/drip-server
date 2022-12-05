import CollectionModel from '@/resources/collection/collection.model';
import Collection from '@/resources/collection/collection.interface';
import { Schema } from 'mongoose';
const {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} = require('firebase/storage');
const storage = require('../../firebase');

class CollectionService {
    private collection = CollectionModel;

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
     * Create a new collection
     */
    public async create(
        name: string,
        images: Express.Multer.File[],
        description: string
    ): Promise<Collection | Error> {
        try {
            const imagesUrls: Array<string> = [];
            const gifUrls: Array<string> = [];
            console.log(images);
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

            const collection = await this.collection.create({
                name,
                imagesUrls,
                gifUrl,
                description,
            });

            return collection;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     *Attempt to update a collection by id
     */
    public async update(
        _id: Schema.Types.ObjectId,
        name: string,
        imagesUrls: Array<string>,
        gifUrl: string,
        images: Express.Multer.File[],
        description: string
    ): Promise<Collection | Error> {
        try {
            const collectionTemp = await this.collection.findById(_id);

            if (!collectionTemp) {
                throw new Error('Unable to find collection');
            }

            if (!imagesUrls) {
                imagesUrls = collectionTemp.imagesUrls;
            }

            if (!gifUrl) {
                gifUrl = collectionTemp.gifUrl;
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


            const collection = await this.collection.findByIdAndUpdate(
                _id,
                {
                    name: name,
                    description: description,
                    imagesUrls: imagesUrls,
                    gifUrl: gifUrl,
                },
                { new: true }
            );

            if (!collection) {
                throw new Error('Unable to update collection with that data');
            }

            return collection;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to delete collection
     */

    public async delete(
        _id: Schema.Types.ObjectId
    ): Promise<Collection | Error> {
        try {
            const collection = await this.collection.findById(_id);

            if (!collection) {
                throw new Error('Unable to find collection with that id');
            }

            if (collection.imagesUrls && collection.imagesUrls.length > 0) {
                await Promise.all(
                    collection.imagesUrls.map(async (image: string) => {
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

            if (collection.gifUrl) {
                const deletePic =
                    '☂' +
                    collection.gifUrl
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

            const removedCollection = await this.collection.findByIdAndDelete(_id);

            if (!removedCollection) {
                throw new Error('Unable to delete collection with that data');
            }

            return removedCollection;
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
    ): Promise<Collection | Error> {
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
            let collections = (await this.collection.findById(
                _id
            )) as Collection;

            if (!collections) {
                throw new Error('Unable to find collection with that data');
            }

            if (collections.imagesUrls.includes(url)) {
                collections = (await this.collection.findByIdAndUpdate(
                    _id,
                    { $pullAll: { imagesUrls: [url] } },
                    { new: true }
                )) as Collection;
            } else {
                collections = (await this.collection.findByIdAndUpdate(
                    _id,
                    { gifUrl: '' },
                    { new: true }
                )) as Collection;
            }

            return collections;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find all collections
     */
    public async get(): Promise<Collection | Array<Collection> | Error> {
        try {
            const collections = await this.collection.find({}, null, {
                sort: { createdAt: -1 },
            });

            if (!collections) {
                throw new Error('Unable to find collections');
            }
            await Promise.all(
                collections.map(async (item: Collection) => {
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
            return collections;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Attempt to find collections by params
     */

    public async find(
        props: Object
    ): Promise<Collection | Array<Collection> | Error> {
        try {
            const collections = await this.collection.find(props, null, {
                sort: { createdAt: -1 },
            });

            if (!collections) {
                throw new Error(`Unable to find collections with that props`);
            }

            return collections;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

export default CollectionService;
