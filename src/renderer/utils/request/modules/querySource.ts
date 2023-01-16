import Req from '@/utils/request';
import { IPTV_SOURCE_URL } from '@/utils/constants';

export function querySourceResource(): any {
    return Req({
        method: 'get',
        url: IPTV_SOURCE_URL
    });
}
