import Req from '@/utils/request';
import { SOURCE_URL,SOURCE18_URL } from '@/utils/constants';

export function querySourceResource(): any {
    return Req({
        method: 'get',
        url: SOURCE_URL
    });
}

export function querySource18Resource(): any {
    return Req({
        method: 'get',
        url: SOURCE18_URL
    });
}
