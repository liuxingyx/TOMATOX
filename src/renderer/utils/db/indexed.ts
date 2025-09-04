import { TABLES, DEFAULT_ORIGIN } from '@/utils/constants';
import { cleanResourceData } from '@/utils/filterResources';
import { setEnabledOrigin } from '@/utils/db/storage';

export default class Indexed {
    private static db: IDBDatabase | undefined;
    public static instance: Indexed | undefined;
    static collectedRes: Set<string> = new Set();

    private constructor() {
        // do nothing
    }

    public static init(): Promise<Indexed> {
        return new Promise((resolve, reject) => {
            if (!this.instance) {
                const dbReq = window.indexedDB.open('TOMATOX', 5);
                dbReq.onupgradeneeded = () => {
                    const db = dbReq.result;
                    if (!db.objectStoreNames.contains(TABLES.TABLE_HISTORY)) {
                        const table = db.createObjectStore(TABLES.TABLE_HISTORY, { keyPath: 'id' });
                        table.createIndex('lastPlayDate', 'lastPlayDate', { unique: false });
                    }
                    if (!db.objectStoreNames.contains(TABLES.TABLE_COLLECT)) {
                        db.createObjectStore(TABLES.TABLE_COLLECT, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(TABLES.TABLE_ORIGIN)) {
                        const table = db.createObjectStore(TABLES.TABLE_ORIGIN, { keyPath: 'id' });
                        table.put(DEFAULT_ORIGIN);
                    } else {
                        db.deleteObjectStore(TABLES.TABLE_ORIGIN);
                        const table = db.createObjectStore(TABLES.TABLE_ORIGIN, { keyPath: 'id' });
                        table.put(DEFAULT_ORIGIN);
                        setEnabledOrigin('非凡资源');
                    }
                };
                dbReq.onsuccess = () => {
                    this.db = dbReq.result;
                    this.instance = new Indexed();
                    // this.instance.deleteAll(TABLES.TABLE_ORIGIN);
                    this.instance.loadCollectedRes();
                    this.instance.insertOrUpdateOrigin(TABLES.TABLE_ORIGIN, DEFAULT_ORIGIN);
                    setEnabledOrigin('非凡资源');
                    resolve(this.instance!);
                };
            } else {
                resolve(this.instance);
            }
        });
    }

    public queryById(tableName: string, id: any) {
        return new Promise(resolve => {
            const req = Indexed.db!.transaction(tableName, 'readonly')
                .objectStore(tableName)
                .get(id);
            req.onsuccess = () => {
                resolve(req.result);
            };
        });
    }

    public queryByApi(tableName: string, Api: any, newApi: any) {
        return new Promise(resolve => {
            const req = Indexed.db!.transaction(tableName, 'readonly')
                .objectStore(tableName)
                .getAll();
            req.onsuccess = () => {
                const results = req.result;
                const filteredResults = results.filter(
                    item => item.id.includes(newApi) && item.id !== Api
                );
                resolve(filteredResults);
            };
        });
    }

    public queryAll(tableName: string) {
        return new Promise(resolve => {
            const req = Indexed.db!.transaction(tableName, 'readonly')
                .objectStore(tableName)
                .getAll();
            req.onsuccess = () => {
                resolve(req.result);
            };
        });
    }

    public queryAllKeys(tableName: string) {
        return new Promise(resolve => {
            const req = Indexed.db!.transaction(tableName, 'readonly')
                .objectStore(tableName)
                .getAllKeys();
            req.onsuccess = () => {
                resolve(req.result);
            };
        });
    }

    public insertOrUpdateOrigin(tableName: string, data: Iorigin) {
        return new Promise(resolve => {
            Indexed.db!.transaction(tableName, 'readwrite')
                .objectStore(tableName)
                .put(data).onsuccess = () => {
                resolve(null);
            };
        });
    }
    public insertOrUpdateResource(tableName: string, data: IplayResource) {
        if (tableName === TABLES.TABLE_COLLECT) {
            Indexed.collectedRes.add(data.id);
        }
        const optData: IplayResource = cleanResourceData(tableName, data);
        return new Promise(resolve => {
            Indexed.db!.transaction(tableName, 'readwrite')
                .objectStore(tableName)
                .put(optData).onsuccess = () => {
                resolve(null);
            };
        });
    }

    public deleteById(tableName: string, id: any) {
        if (tableName === TABLES.TABLE_COLLECT) {
            Indexed.collectedRes.delete(id);
        }
        return new Promise(resolve => {
            Indexed.db!.transaction(tableName, 'readwrite')
                .objectStore(tableName)
                .delete(id).onsuccess = () => {
                resolve(null);
            };
        });
    }

    public deleteAll(tableName: string) {
        return new Promise(resolve => {
            const keyReq = Indexed.db!.transaction(tableName, 'readwrite')
                .objectStore(tableName)
                .getAllKeys();
            keyReq.onsuccess = async () => {
                for (const key of keyReq.result) {
                    await this.deleteById(tableName, key);
                }
                resolve(null);
            };
        });
    }

    public doCollect(data: IplayResource) {
        this.insertOrUpdateResource(TABLES.TABLE_COLLECT, {
            ...data,
            collectOption: { collectDate: Date.now() }
        });
    }
    public cancelCollect(id: string) {
        this.deleteById(TABLES.TABLE_COLLECT, id);
    }

    private loadCollectedRes() {
        this.queryAllKeys(TABLES.TABLE_COLLECT).then(res => {
            (res as string[]).forEach(item => {
                Indexed.collectedRes.add(item);
            });
        });
    }
}
