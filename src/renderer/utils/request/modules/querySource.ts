import Req from '@/utils/request';
import { SOURCE_URL, TABLES } from '@/utils/constants';
import Indexed from '@/utils/db/indexed';

export function querySourceResource(): any {
    return Req({
        method: 'get',
        url: SOURCE_URL
    }).then(jsonData => {
        const resSource = ((jsonData as unknown) as Array<Iorigin>) || [];
        console.log('请求api资源：', resSource.length);
        let id = 0;
        for (const value of resSource) {
            value.addTime = Date.now() + id;
            id += 10;
            Indexed.instance?.insertOrUpdateOrigin(TABLES.TABLE_ORIGIN, value);
        }
    });
}
