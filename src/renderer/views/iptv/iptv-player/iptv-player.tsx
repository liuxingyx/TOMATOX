import React from 'react';
import cssM from './iptv-player.scss';
import { Control } from 'react-keeper';
import {
    LeftOutlined,
    MinusOutlined,
    BlockOutlined,
    CloseOutlined,
    HeartOutlined,
    HeartFilled
} from '@ant-design/icons';
import { getPlayConfig, setPlayConfig } from '@/utils/db/storage';
import shortcutManager from 'electron-localshortcut';
import XGPlayer from 'xgplayer';

const HlsPlayer = require('xgplayer-hls.js');
const FlvPlayer = require('xgplayer-flv.js');
const { ipcRenderer, remote } = require('electron');

export default class IptvPlayer extends React.Component<any, any> {
    private xgPlayer: XGPlayer | undefined;
    private mainEventHandler: Record<string, () => void> = {
        Up: () => {
            this.xgPlayer!.volume = Math.min(this.xgPlayer!.volume + 0.1, 1);
        },
        Down: () => {
            this.xgPlayer!.volume = Math.max(this.xgPlayer!.volume - 0.1, 0);
        },
        Right: () => {
            this.xgPlayer!.currentTime = Math.min(
                this.xgPlayer!.currentTime + 10,
                this.xgPlayer!.duration
            );
        },
        Left: () => {
            this.xgPlayer!.currentTime = Math.max(this.xgPlayer!.currentTime - 10, 0);
        },
        Space: () => {
            this.xgPlayer!.paused ? this.xgPlayer!.play() : this.xgPlayer!.pause();
        }
    };

    constructor(props: any) {
        super(props);
        this.state = {
            resource: Control.state
        };
    }

    private updateVolumeConf = () => {
        setPlayConfig({ voice: this.xgPlayer!.volume });
    };

    private updateSpeedConf = () => {
        setPlayConfig({ speed: this.xgPlayer!.playbackRate });
    };

    componentDidMount(): void {
        const PlayerClass = (this.state.resource.src.includes('.m3u8')
            ? HlsPlayer
            : FlvPlayer) as any;
        console.log('iptv类型:', PlayerClass);
        this.xgPlayer = new PlayerClass({
            el: this.refs.iptvPlayer as any,
            url: this.state.resource.src,
            id: 'tomatox-iptv',
            width: '100%',
            height: '100%',
            volume: getPlayConfig().voice,
            playbackRate: [0.5, 0.75, 1, 1.5, 1.75, 2],
            defaultPlaybackRate: getPlayConfig().speed,
            videoInit: true, // 初始化显示视频首帧
            autoplay: true, // 自动播放
            cssFullscreen: true, // 网页样式全屏
            playsinline: true, // 内联模式
            useHls: true, // 移动端环境下打开hls.js解析功能
            isLive: true, // 直播场景设置为true
            crossOrigin: true, // 是否跨域
            playPrev: true,
            playNextOne: false,
            videoStop: true,
            showList: true,
            showHistory: true,
            quitMiniMode: true,
            videoTitle: true,
            ignores: ['replay', 'error'], // 为了切换播放器类型时避免显示错误刷新，暂时忽略错误
            preloadTime: 30 // 预加载时长(秒)
        });
        this.xgPlayer?.play();
        this.xgPlayer?.on('volumechange', this.updateVolumeConf);
        this.xgPlayer?.on('playbackrateChange', this.updateSpeedConf);
        for (const key in this.mainEventHandler) {
            shortcutManager.register(remote.getCurrentWindow(), key, this.mainEventHandler[key]);
        }
    }

    componentWillUnmount(): void {
        shortcutManager.unregister(remote.getCurrentWindow(), Object.keys(this.mainEventHandler));
        this.xgPlayer!.src = '';
        this.xgPlayer?.off('volumechange', this.updateVolumeConf);
        this.xgPlayer?.off('playbackrateChange', this.updateSpeedConf);
        this.xgPlayer?.destroy();
    }

    render(): React.ReactNode {
        return (
            <div className={[cssM.fullScreen, 'theme-content'].join(' ')}>
                <div className={[cssM.playFullHeader, 'theme-header'].join(' ')}>
                    <span
                        onClick={() => {
                            Control.go(-1);
                        }}>
                        <LeftOutlined /> 返回
                    </span>
                    <span>
                        <span>{this.state.resource.sourceName}</span>
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
                <div ref={'iptvPlayer'} />
            </div>
        );
    }
}
