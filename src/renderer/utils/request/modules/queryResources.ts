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
export function queryResources(
    curPage: number,
    type?: number
): any {
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
                console.log('json:' , jsonData.list.pagecount);
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

export function searchResources(
    curPage: number, 
    keyWord: string
):any {
    return new Promise(resolve => {
        Req({
            method: 'get',
            url: store.getState('SITE_ADDRESS').api,
            params: {
                at: 'xml',
                ac: 'videolist',
                pg: curPage,
                wd: keyWord,
                kw: keyWord,
                keyWords: keyWord
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
    // console.log("api:", ele.api);
    return new Promise(resolve => {
        Req({
            method: 'get',
            url: ele.api,
            params: {
                at: 'xml',
                ac: 'detail',
                ids: ele.id
            }
        }).then(async xmlData => {
            if (!xmlData) {
                resolve(xmlData);
                return;
            }
            try {
                const parseJson = xmlParser((xmlData as unknown) as string);
                const jsonData = parseJson.rss ? parseJson.rss : parseJson;
                const result: IplayResource = filterResource(jsonData.list.video);
                if (ele.remark !== result.remark || ele.playList === null || ele.playList.size === 0) {
                    console.log('数据库修改前结果：', ele);
                    ele.remark = result.remark;
                    ele.playList = result.playList;
                    console.log('数据库修改后结果：', ele);
                    Indexed.instance!.insertOrUpdateResource(TABLES.TABLE_HISTORY, ele);
                }
                resolve({});
            } catch (e) {
                message.error(e);
                resolve(null);
            }
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
