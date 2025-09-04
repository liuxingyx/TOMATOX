import { TABLES } from '@/utils/constants';

export function filterResources(resources: any[]) {
    return resources.map(res => filterResource(res));
}

export function filterResource(resource: any): IplayResource {
    const playLists = new Map<string, Map<string, string>>();
    if (resource.dl && resource.dl.dd) {
        if (resource.dl.dd instanceof Array) {
            resource.dl.dd.forEach((item: any, index: number) => {
                const listName = item.flag;
                const listStr = item.text;
                if (listName.includes('m3u8') || listStr.includes('m3u8')) {
                    const playlistMap = filterPlayList(listStr);
                    playLists.set(listName, playlistMap);
                }
            });

            if (playLists.size === 1) {
                const playlistMap = playLists.values().next().value!;
                playLists.clear();
                playLists.set('默认', playlistMap);
            }
        } else {
            const listStr = resource.dl.dd.text;
            if (listStr.includes('m3u8')) {
                const defaultListName = '默认';
                const playlistMap = filterPlayList(listStr);
                playLists.set(defaultListName, playlistMap);
            }
        }
    }

    return {
        id: resource.id,
        type: resource.type,
        apiname: '',
        api: '',
        picture: resource.pic,
        lang: resource.lang,
        name: resource.name,
        director: resource.director,
        describe: resource.des,
        area: resource.area,
        actor: resource.actor,
        class: '',
        doubanId: '',
        doubanScore: '',
        origin: '',
        remark: resource.note,
        tag: '',
        year: resource.year,
        updateTime: resource.last,
        playList: playLists
    };
}

function filterPlayList(listStr: string) {
    const list = new Map<string, string>();
    const splitLists = listStr.split('#').filter(val => val.includes('.m3u8'));
    splitLists.forEach(item => {
        const [key, val] = item.split('$');
        if (key && val) {
            list.set(key, val);
        }
    });
    return list;
}

export function cleanResourceData(dataType: string, data: IplayResource): IplayResource {
    const optData: IplayResource = {
        id: data.id,
        type: data.type,
        apiname: data.apiname,
        api: data.api,
        picture: data.picture,
        lang: data.lang,
        name: data.name,
        director: data.director,
        describe: data.describe,
        area: data.area,
        actor: data.actor,
        class: data.class,
        doubanId: data.doubanId,
        doubanScore: data.doubanScore,
        origin: data.origin,
        remark: data.remark,
        tag: data.tag,
        year: data.year,
        updateTime: data.updateTime,
        playList: data.playList
    };
    if (dataType === TABLES.TABLE_HISTORY) {
        optData.historyOption = data.historyOption;
    } else if (dataType === TABLES.TABLE_COLLECT) {
        optData.collectOption = data.collectOption;
    }
    return optData;
}
