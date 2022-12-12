export const DEFAULT_ORIGIN: Iorigin = {
    id: '默认',
    api: 'https://www.kuaibozy.com/api.php/provide/vod/from/kbm3u8/at/xml',
    addTime: Date.now()
};
export const CANDIDATE_ORIGIN1: Iorigin = {
    id: '天空云',
    api: 'https://api.tiankongapi.com/api.php/provide/vod/at/xml/from/tkm3u8/',
    addTime: Date.now() + 1
};
export const CANDIDATE_ORIGIN2: Iorigin = {
    id: '39影视',
    api: 'https://www.39kan.com/api.php/provide/vod/at/xml',
    addTime: Date.now() + 2
};
export const CANDIDATE_ORIGIN3: Iorigin = {
    id: '优质资源库',
    api: 'https://api.1080zyku.com/inc/ldg_api_all.php',
    addTime: Date.now() + 3
};
export const CANDIDATE_ORIGIN4: Iorigin = {
    id: '云解析资源网',
    api: 'https://api.yparse.com/api/xml',
    addTime: Date.now() + 4
};
export const CANDIDATE_ORIGIN5: Iorigin = {
    id: '八戒云',
    api: 'http://cj.bajiecaiji.com/inc/bjm3u8.php',
    addTime: Date.now() + 5
};
export const CANDIDATE_ORIGIN6: Iorigin = {
    id: '淘片资源网',
    api: 'https://taopianapi.com/home/cjapi/as/mc/vod/xml',
    addTime: Date.now() + 6
};
export const CANDIDATE_ORIGIN7: Iorigin = {
    id: '飞速资源',
    api: 'https://www.feisuzyapi.com/api.php/provide/vod/at/xml',
    addTime: Date.now() + 7
};
// export const DEFAULT_SEARCH_INDEX = 'https://github.com/yanjiaxuan/TOMATOX_RES/raw/main/result.json';
export const DEFAULT_SEARCH_INDEX = 'https://raw.githubusercontent.com/yanjiaxuan/TOMATOX_RES/main/result.json';
export const defaultIndexMapper: Record<string, number> = {};
fetch(DEFAULT_SEARCH_INDEX)
    .then(res => res.json())
    .then(res => {
        for (const key in res) {
            defaultIndexMapper[key] = res[key];
        }
    });

// export const IPTV_ORIGIN_URL = 'https://github.com/yanjiaxuan/TOMATOX_RES/raw/main/zhibo.json';
export const IPTV_ORIGIN_URL = 'https://raw.githubusercontent.com/yanjiaxuan/TOMATOX_RES/main/zhibo.json';
export const PROD_STATEMENT =
    '版权声明：本人发布的所有资源或软件均来自网络，与本人没有任何关系，只能作为私下交流、学习、研究之用，版权归原作者及原软件公司所有。\n' +
    '                本人发布的所有资源或软件请在下载后24小时内自行删除。如果您喜欢这个资源或软件，请联系原作者或原软件公司购买正版。与本人无关！\n' +
    '                本人仅仅提供一个私下交流、学习、研究的环境，将不对任何资源或软件负法律责任！\n' +
    '                任何涉及商业盈利性目的的单位或个人，均不得使用本人发布的资源或软件，否则产生的一切后果将由使用者自己承担！';

export const TABLES = {
    TABLE_HISTORY: 'tomatox_play_history',
    TABLE_COLLECT: 'tomatox_collect',
    TABLE_ORIGIN: 'tomatox_origin'
};
