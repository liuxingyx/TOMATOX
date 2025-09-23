import React, { useEffect, useState } from 'react';
import { Link, Route } from 'react-keeper';
import TOMATOX_ICON from '@/images/svg/icon.svg';
import { HeartOutlined, HeartFilled, DeleteFilled } from '@ant-design/icons';
import Indexed from '@/utils/db/indexed';
import { TABLES } from '@/utils/constants';
import cssM from './tomatox-waterfall.scss';
import History from '@/views/history/history';

export default function tomatoxWaterfall(props: {
    data: IplayResource[];
    isDisplayDelete: boolean;
}) {
    const [collectRes, setCollectRes] = useState(Indexed.collectedRes);
    const [historyRes, setHistoryRes] = useState(props.data);
    let cardsData = props.data;
    const removeHistory = (id: string) => {
        if (props.isDisplayDelete) {
            setHistoryRes(current =>
                current.filter(history => {
                    return history.id !== id;
                })
            );
        }
    };
    const updateHistory = async (ele: IplayResource) => {
        const history = (await Indexed.instance!.queryById(
            TABLES.TABLE_HISTORY,
            ele.id
        )) as IplayResource;
        if (ele.historyOption?.lastPlayDesc !== history.historyOption?.lastPlayDesc) {
            ele.historyOption = history.historyOption;
            removeHistory('-1');
        }
    };
    if (props.isDisplayDelete) {
        cardsData = historyRes;
    }
    const convertEle = () => {
        const res = [];
        for (let index = 0; index < cardsData.length; index++) {
            const ele = cardsData[index];
            if (props.isDisplayDelete) {
                updateHistory(ele);
            }
            res.push(
                <span key={ele.id}>
                    <Link to={`/play`} state={ele}>
                        <div key={ele.id} className={cssM.card}>
                            <div>
                                <img src={ele.picture} className={cssM.descImg} />
                                <span className={cssM.topRightTitle}>{ele.remark}</span>
                                {props.isDisplayDelete ? (
                                    <div>
                                        <DeleteFilled
                                            className={cssM.resourceDelete}
                                            onClick={e => {
                                                Indexed.instance?.deleteById(
                                                    TABLES.TABLE_HISTORY,
                                                    ele.id
                                                );
                                                removeHistory(ele.id);
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            />
                                    </div>
                                ) : (
                                    <div> </div>
                                )}
                                <div>
                                    {collectRes.has(ele.id) ? (
                                        <HeartFilled
                                            className={cssM.resourceCollect}
                                            onClick={e => {
                                                Indexed.instance?.cancelCollect(ele.id);
                                                setCollectRes(new Set(Indexed.collectedRes));
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            />
                                    ) : (
                                        <HeartOutlined
                                            className={cssM.resourceNotCollect}
                                            onClick={e => {
                                                Indexed.instance?.doCollect(ele);
                                                setCollectRes(new Set(Indexed.collectedRes));
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            />
                                    )}
                                </div>
                            </div>
                            <span className={'theme-color'}>{ele.name}</span>
                            <span className={'theme-color'}>
                                {ele.historyOption?.lastPlayDesc ? '' : ele.actor || '未知'}
                            </span>
                            {ele.historyOption?.lastPlayDesc && (
                                <span className={'theme-color'}>
                                    {ele.historyOption.lastPlayDesc}
                                </span>
                            )}
                        </div>
                    </Link>
                </span>
            );
        }
        return res;
    };
    return <div className={cssM.cardList}>{convertEle()}</div>;
}
