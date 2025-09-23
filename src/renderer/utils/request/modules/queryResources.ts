import store from '@/utils/store';
import Req from '../index';
import xmlParser from '@/utils/xmlParser';
import { filterResource, filterResources } from '@/utils/filterResources';
import { message, Result } from 'antd';
import { TABLES } from '@/utils/constants';
import Indexed from '@/utils/db/indexed';

// ac：模式（videolist或detail详细模式），为空＝列表标准模式
// ids: 影片id，多个使用,隔开
// t: 类型
// h：最近多少小时内
// pg: 页数
// wd：搜索like
// at：输出格式，可选xml
export function queryResources(curPage: number, type?: number): any {
    return new Promise(resolve => {
        Req({
            method: 'get',
            url: store.getState('SITE_ADDRESS').api,
            params: {
                at: 'xml',
                ac: 'videolist',
                pg: curPage,
                t: type
            }
        }).then(xmlData => {
            if (!xmlData) {
                resolve(xmlData);
                return;
            }
            try {
                const result: IplayResource[] = [];
                const parseJson = xmlParser((xmlData as unknown) as string);
                const jsonData = parseJson.rss ? parseJson.rss : parseJson;
                if (jsonData.list && jsonData.list.video) {
                    const videoList =
                        jsonData.list.video instanceof Array
                            ? jsonData.list.video
                            : [jsonData.list.video];
                    result.push(...filterResources(videoList));
                }
                resolve({
                    limit: jsonData.list.pagesize,
                    list: result,
                    page: jsonData.list.page,
                    pagecount: jsonData.list.pagecount,
                    total: jsonData.list.recordcount
                });
            } catch (e) {
                message.error(e);
                resolve(null);
            }
        });
    });
}

export function searchResources(curPage: number, keyWord: string, api?: string): any {
    return new Promise(resolve => {
        Req({
            method: 'get',
            url: api || store.getState('SITE_ADDRESS').api,
            params: {
                at: 'xml',
                ac: 'videolist',
                pg: curPage,
                wd: keyWord,
                kw: keyWord,
                keyWord
            }
        }).then(xmlData => {
            if (!xmlData) {
                resolve(xmlData);
                return;
            }
            try {
                const result: IplayResource[] = [];
                const parseJson = xmlParser((xmlData as unknown) as string);
                const jsonData = parseJson.rss ? parseJson.rss : parseJson;
                if (jsonData.list && jsonData.list.video) {
                    const videoList =
                        jsonData.list.video instanceof Array
                            ? jsonData.list.video
                            : [jsonData.list.video];
                    result.push(...filterResources(videoList));
                }
                resolve({
                    limit: jsonData.list.pagesize,
                    list: result,
                    page: jsonData.list.page,
                    pagecount: jsonData.list.pagecount,
                    total: jsonData.list.recordcount
                });
            } catch (e) {
                message.error(e);
                resolve(null);
            }
        });
    });
}

export function queryDetail(ele: IplayResource) {
    console.log(
        '请求详情：',
        store.getState('SITE_ADDRESS').id,
        store.getState('SITE_ADDRESS').api
    );
    return new Promise(resolve => {
        Req({
            method: 'get',
            url: ele.api,
            params: {
                at: 'xml',
                ac: 'detail',
                ids: ele.id
            }
        })
            .then(async xmlData => {
                if (!xmlData) {
                    resolve(xmlData);
                    return;
                }
                try {
                    const parseJson = xmlParser((xmlData as unknown) as string);
                    const jsonData = parseJson.rss ? parseJson.rss : parseJson;
                    const result: IplayResource = filterResource(jsonData.list.video);
                    if (result.playList.size === 0) {
                        const res = await searchResources(1, ele.name, ele.api);
                        res.list.forEach((item: any) => {
                            if (
                                ele.remark !== result.remark &&
                                item.id === ele.id &&
                                result.playList.size > 0
                            ) {
                                console.log('搜索修改前结果：', ele);
                                ele.remark = result.remark;
                                ele.playList = result.playList;
                                console.log('搜索修改后结果：', ele);
                                Indexed.instance!.insertOrUpdateResource(TABLES.TABLE_HISTORY, ele);
                            }
                        });
                    } else if (
                        ele.remark !== result.remark ||
                        ele.playList === null ||
                        ele.playList.size === 0
                    ) {
                        console.log('详情修改前结果：', ele);
                        ele.remark = result.remark;
                        ele.playList = result.playList;
                        console.log('详情修改后结果：', ele);
                        Indexed.instance!.insertOrUpdateResource(TABLES.TABLE_HISTORY, ele);
                    }
                    resolve({});
                } catch (e) {
                    message.error(e);
                    resolve(null);
                }
            })
            .catch(async e => {
                const apiname = ele.apiname;
                const newapi = apiname.slice(0, 4);
                console.log('请求详情失败：', ele.api);
                ele.historyOption!.lastPlayDate = Date.now();
                const origin = (await Indexed.instance!.queryByApi(
                    TABLES.TABLE_ORIGIN,
                    apiname,
                    newapi
                )) as Iorigin[];
                origin.forEach((item: Iorigin) => {
                    // console.log('请求详情失败更新：', item.id, ele.apiname);
                    ele.api = item.api;
                    ele.apiname = item.id;
                    Indexed.instance!.insertOrUpdateResource(TABLES.TABLE_HISTORY, ele);
                });
                resolve(null);
            });
    });
}

export function queryTypes() {
    return new Promise(resolve => {
        Req({
            method: 'get',
            url: store.getState('SITE_ADDRESS').api
        }).then(res => {
            if (!res) {
                resolve(res);
                return;
            }
            try {
                const parseJson = xmlParser((res as unknown) as string);
                const jsonData = parseJson.rss ? parseJson.rss : parseJson;
                resolve(jsonData.class.ty || []);
            } catch (e) {
                message.error(e);
                resolve([]);
            }
        });
    });
}
