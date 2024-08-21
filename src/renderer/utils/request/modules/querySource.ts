import Req from '@/utils/request';
import { SOURCE_URL } from '@/utils/constants';
import Indexed from '@/utils/db/indexed';
import { TABLES } from '@/utils/constants';

export function querySourceResource(): any {
    return Req({
        method: 'get',
        url: SOURCE_URL
    }).then(jsonData => {
        let resSource = (jsonData as unknown as Array<Iorigin>) || [];
        console.log('初始化资源：', resSource.length);
        let id = 0;
        for (const value of resSource) {
            value.addTime = Date.now() + id++;
            Indexed.instance?.insertOrUpdateOrigin(TABLES.TABLE_ORIGIN, value);
        }
    });
}
