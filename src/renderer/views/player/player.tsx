import React from 'react';
import {
    LeftOutlined,
    MinusOutlined,
    BlockOutlined,
    CloseOutlined,
    HeartOutlined,
    HeartFilled
} from '@ant-design/icons';
import { Control } from 'react-keeper';
import { Tag, Tabs } from 'antd';

import XGPlayer from 'xgplayer';
import shortcutManager from 'electron-localshortcut';
import Indexed from '@/utils/db/indexed';
import { TABLES } from '@/utils/constants';
import cssM from './palyer.scss';
import { getPlayConfig, setPlayConfig } from '@/utils/db/storage';
import store from '@/utils/store';
import History from '../history/history';

const HlsPlayer = require('xgplayer-hls.js');
const { ipcRenderer, remote } = require('electron');

export default class Player extends React.Component<any, any> {
    private xgPlayer: XGPlayer | undefined;
    private sourceList: Map<string, Map<string, string>> = new Map();
    private selectedKey = '播放列表';
    private controlState: IplayResource;
    private mainEventHandler: Record<string, () => void> = {
        Up: () => {
            this.xgPlayer!.volume = Math.min(this.xgPlayer!.volume + 0.1, 1);
        },
        Down: () => {
            this.xgPlayer!.volume = Math.max(this.xgPlayer!.volume - 0.1, 0);
        },
        Right: () => {
            this.xgPlayer!.currentTime = Math.min(
                this.xgPlayer!.currentTime + 5,
                this.xgPlayer!.duration
            );
        },
        Left: () => {
            this.xgPlayer!.currentTime = Math.max(this.xgPlayer!.currentTime - 5, 0);
        },
        Space: () => {
            this.xgPlayer!.paused ? this.xgPlayer!.play() : this.xgPlayer!.pause();
        }
    };

    constructor(props: any) {
        super(props);
        this.controlState = Control.state;
        if (this.controlState) {
            this.sourceList.set('播放列表', this.controlState.playList);
            this.state = {
                curPlaySrc:
                    this.controlState.historyOption?.lastPlaySrc ||
                    this.controlState.playList.values().next().value,
                curPlayDrama:
                    this.controlState.historyOption?.lastPlayDrama ||
                    this.controlState.playList.keys().next().value,
                isCollect: Indexed.collectedRes.has(this.controlState.id)
            };
        }
    }

    private playNext = () => {
        const dramas = Array.from(this.sourceList.get(this.selectedKey)!.keys());
        const curIdx = dramas.indexOf(this.state.curPlayDrama);
        if (curIdx >= 0 && curIdx < dramas.length - 1) {
            const drama = dramas[curIdx + 1];
            const src = this.sourceList.get(this.selectedKey)!.get(dramas[curIdx + 1])!;
            this.setState({
                curPlayDrama: drama,
                curPlaySrc: src
            });
            this.xgPlayer!.src = src;
            this.xgPlayer!.currentTime = 0;
            this.initData();
        }
    };

    doCollect() {
        this.setState({
            isCollect: true
        });
        Indexed.instance!.doCollect(this.controlState);
    }

    cancelCollect() {
        this.setState({
            isCollect: false
        });
        Indexed.instance!.cancelCollect(this.controlState.id);
    }

    componentDidMount(): void {
        this.xgPlayer = new HlsPlayer({
            el: this.refs.playWrapperRef as any,
            url: this.state.curPlaySrc,
            // id: 'tomatox',
            width: '100%',
            height: '100%',
            videoInit: true,//初始化显示视频首帧
            autoplay: true,//自动播放
            cssFullscreen: true,//网页样式全屏
            keyShortcut: 'on',//键盘快捷键
            // controls: true, //是否显示播放控件
            controls: {
                mode: 'normal'
            },
            isLive : false,//是否直播
            closeVideoDblclick : true,//关闭video双击事件
            playsinline: true,//内联模式
            useHls: true,//移动端环境下打开hls.js解析功能
            volume: getPlayConfig().voice,
            playbackRate: [0.5, 0.75, 1, 1.5, 2],
            defaultPlaybackRate: getPlayConfig().speed,
            crossOrigin: true,//是否跨域
            playPrev: true,
            playNextOne: true,
            videoStop: true,
            showList: true,
            showHistory: true,
            quitMiniMode: true,
            videoTitle: true,
            ignores: ['replay', 'error'], // 为了切换播放器类型时避免显示错误刷新， 暂时忽略错误
            preloadTime: 600//预加载时长(秒)
        });
        this.xgPlayer!.currentTime = this.controlState.historyOption?.lastPlayTime || 0;
        this.xgPlayer?.play();
        this.xgPlayer?.on('ended', this.playNext);
        this.xgPlayer?.on('volumechange', this.updateVolumeConf);
        this.xgPlayer?.on('playbackrateChange', this.updateSpeedConf);
        for (const key in this.mainEventHandler) {
            shortcutManager.register(remote.getCurrentWindow(), key, this.mainEventHandler[key]);
        }
    }

    private updateVolumeConf = () => {
        setPlayConfig({ voice: this.xgPlayer!.volume });
    };

    private updateSpeedConf = () => {
        setPlayConfig({ speed: this.xgPlayer!.playbackRate });
    };

    private static timeConverter(time: number) {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const senconds = Math.floor(time % 60);
        const ms = `${minutes < 10 ? '0' : ''}${minutes}:${senconds < 10 ? '0' : ''}${senconds}`;
        return hours === 0 ? ms : `${hours < 10 ? '0' : ''}${hours}:${ms}`;
    }

    initData() {
        const newData: IplayResource = {
            ...this.controlState,
            historyOption: {
                lastPlayDrama: this.state.curPlayDrama,
                lastPlaySrc: this.state.curPlaySrc,
                lastPlayTime: this.xgPlayer?.currentTime || 0,
                lastPlayDate: Date.now(),
                lastPlayDesc: `观看至 ${this.state.curPlayDrama || ''} ${Player.timeConverter(
                    this.xgPlayer?.currentTime || 0
                )}`
            }
        };
        console.log(newData);
        newData.api = store.getState('SITE_ADDRESS').api;
        Indexed.instance!.insertOrUpdateResource(TABLES.TABLE_HISTORY, newData);
    }

    async componentWillMount() {
        this.initData();
    }

    async componentWillUnmount() {
        this.initData();
        shortcutManager.unregister(remote.getCurrentWindow(), Object.keys(this.mainEventHandler));
        this.xgPlayer!.src = '';
        this.xgPlayer?.off('ended', this.playNext);
        this.xgPlayer?.off('volumechange', this.updateVolumeConf);
        this.xgPlayer?.off('playbackrateChange', this.updateSpeedConf);
        this.xgPlayer?.destroy();
    }

    descSources() {
        const eles = [];
        // @ts-ignore
        for (const [key] of this.sourceList) {
            eles.push(
                <Tabs.TabPane tab={key} key={key}>
                    {this.descSeries(this.sourceList.get(key)!)}
                </Tabs.TabPane>
            );
        }
        return eles;
    }

    descSeries(playList: Map<string, string>) {
        const eles = [];
        // @ts-ignore
        for (const [key] of playList) {
            eles.push(
                <span
                    key={key}
                    className={`${cssM.seriesTag} ${
                        playList.get(key) === this.state.curPlaySrc ? cssM.seriesTagActive : ''
                    }`}
                    onClick={() => {
                        if (this.state.curPlaySrc !== playList.get(key)) {
                            this.setState({
                                curPlaySrc: playList.get(key),
                                curPlayDrama: key
                            });
                            this.xgPlayer!.currentTime = 0;
                            this.xgPlayer!.src = playList.get(key)!;
                        }
                    }}>
                    {key}
                </span>
            );
        }
        return eles;
    }

    render(): React.ReactNode {
        return (
            <div className={cssM.playPageWrapper}>
                <div className={[cssM.playFullHeader, 'theme-header'].join(' ')}>
                    <span
                        onClick={() => {
                            Control.go(-1);
                        }}>
                        <LeftOutlined /> 返回
                    </span>
                    <span>
                        <span>{this.controlState?.name}</span>
                        {this.state.isCollect ? (
                            <HeartFilled
                                className={cssM.resourceCollect}
                                onClick={this.cancelCollect.bind(this)}
                                />
                        ) : (
                            <HeartOutlined
                                className={cssM.resourceNotCollect}
                                onClick={this.doCollect.bind(this)}
                                />
                        )}
                    </span>
                    <span>
                        <MinusOutlined
                            onClick={() => {
                                ipcRenderer.send('WINDOW_MIN');
                            }}
                            />
                        <BlockOutlined
                            onClick={() => {
                                ipcRenderer.send('WINDOW_MAX');
                            }}
                            />
                        <CloseOutlined
                            onClick={() => {
                                ipcRenderer.send('WINDOW_CLOSE');
                            }}
                            />
                    </span>
                </div>
                <div className={cssM.playFullWrapper}>
                    <div ref={'playWrapperRef'} className={cssM.playerWrapper} />
                    <div className={[cssM.videoInfoWrapper, 'theme-content'].join(' ')}>
                        <Tabs
                            defaultActiveKey={'播放列表'}
                            className={cssM.sourceTab}
                            onChange={newKey => {
                                this.selectedKey = newKey.includes('播放列表')
                                    ? newKey
                                    : this.selectedKey;
                            }}>
                            {this.descSources()}
                            <Tabs.TabPane tab={'详情'} key={'详情'}>
                                <div
                                    className={[cssM.detailHeaderWrapper, 'theme-color'].join(' ')}>
                                    <img
                                        className={cssM.detailImage}
                                        src={this.controlState?.picture}
                                        />
                                    <div className={cssM.detailTextWrapper}>
                                        <div className={cssM.detailTitle}>
                                            {this.controlState?.name}
                                        </div>
                                        <div>
                                            {this.controlState?.type && (
                                                <div className={cssM.detailContent}>
                                                    类型：{this.controlState?.type}
                                                </div>
                                            )}
                                            {this.controlState?.lang && (
                                                <div className={cssM.detailContent}>
                                                    语言：{this.controlState?.lang}
                                                </div>
                                            )}
                                            {this.controlState?.area && (
                                                <div className={cssM.detailContent}>
                                                    地区：{this.controlState?.area}
                                                </div>
                                            )}
                                            {this.controlState?.director && (
                                                <div className={cssM.detailContent}>
                                                    导演：{this.controlState?.director}
                                                </div>
                                            )}
                                            {this.controlState?.actor && (
                                                <div className={cssM.detailContent}>
                                                    主演：{this.controlState?.actor}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={[cssM.detailNoteWrapper, 'theme-color'].join(' ')}>
                                    <div className={cssM.detailNoteFirst}>
                                        {this.controlState?.remark}
                                    </div>
                                    <div className={cssM.detailNoteSecond}>
                                        更新时间：{this.controlState?.updateTime}
                                    </div>
                                    <div className={cssM.detailDescTitle}>简介</div>
                                    <div
                                        className={cssM.detailDesc}
                                        dangerouslySetInnerHTML={{
                                            __html: this.controlState?.describe
                                        }}
                                        />
                                </div>
                            </Tabs.TabPane>
                        </Tabs>
                    </div>
                </div>
            </div>
        );
    }
}
