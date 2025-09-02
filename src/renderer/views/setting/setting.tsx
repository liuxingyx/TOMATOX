import React from 'react';
import { Input, Radio, Row, Space, Col, Button, message, Checkbox } from 'antd';
import cssM from './setting.scss';
import { getEnabledOrigin, setEnabledOrigin } from '@/utils/db/storage';
import Indexed from '@/utils/db/indexed';
import { TABLES } from '@/utils/constants';
import store from '@/utils/store';
import { querySourceResource } from '@/utils/request/modules/querySource';
import { dialog } from 'electron';

const path = require('path');
const fs = require("fs");
//获取本地json文件文件的路径
const source_path = path.join('tomatoxsource.json').replace(/\\/g, "/");

export default class Setting extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            enableOrigin: getEnabledOrigin(),
            selectableOrigins: []
        };
    }

    componentWillMount(): void {
        querySourceResource();
        Indexed.instance!.queryAll(TABLES.TABLE_ORIGIN).then(res => {
            const result = res as Iorigin[];
            result.sort((a, b) => a.addTime - b.addTime);
            this.setState({
                selectableOrigins: result
            });
        });
    }

    private onChange = (e: Iorigin) => {
        if (e.id === this.state.enableOrigin) {
            return;
        }
        this.setState({
            enableOrigin: e.id
        });
        setEnabledOrigin(e.id);
        store.setState('SITE_ADDRESS', e);
        message.success('切换成功');
    };

    private deleteOrigin = (id: string) => {
        this.setState({
            selectableOrigins: this.state.selectableOrigins.filter(
                (item: Iorigin) => item.id !== id
            )
        });
        Indexed.instance!.deleteById(TABLES.TABLE_ORIGIN, id);
    };
    
    private addOrigin = () => {
        const name = (this.refs.oriNameInput as Input).state.value.trim();
        const addr = (this.refs.oriAddrInput as Input).state.value.trim();
        if (this.state.selectableOrigins.filter((item: Iorigin) => item.id === name).length) {
            message.warn('名称已存在');
        } else if (!name || !/^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(name)) {
            message.warn('名称不能为空且只能输入大小写字母和数字');
        } else if (!addr || !/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/.test(addr)) {
            message.warn('地址不合法');
        } else {
            const newOri: Iorigin = { id: name, api: addr, addTime: Date.now() };
            Indexed.instance!.insertOrUpdateOrigin(TABLES.TABLE_ORIGIN, newOri);
            this.setState({
                selectableOrigins: [...this.state.selectableOrigins, newOri]
            });
            (this.refs.oriNameInput as Input).setValue('');
            (this.refs.oriAddrInput as Input).setValue('');
        }
    };

    // 在某个事件处理函数中调用 showOpenDialog
    openFile = async () => {
        await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
    };

    selectFile = async (event: any) => {
        var inputObj = document.getElementById("fileInput") as HTMLInputElement;
        inputObj.click();
    };

    jsReadFiles=(files: any)=> {
        Indexed.instance?.deleteAll(TABLES.TABLE_ORIGIN);
        const inputObj = files.target.files[0];
        let result = JSON.parse(fs.readFileSync(inputObj.path));
        let resSource = ((result) as Array<Iorigin>) || [];
        console.log(resSource);
        let id = 0;
        for (const value of resSource) {
            value.addTime = Date.now() + id++;
            Indexed.instance?.insertOrUpdateOrigin(TABLES.TABLE_ORIGIN, value);
        }
        Indexed.instance!.queryAll(TABLES.TABLE_ORIGIN).then(res => {
            const result = res as Iorigin[];
            result.sort((a, b) => a.addTime - b.addTime);
            this.setState({
                selectableOrigins: result
            });
        });
        this.render();
    }

    render(): React.ReactNode {
        return (
            <div className={cssM.settingWrapper}>
                <span className={cssM.settingTitle}>视频源</span>
                <input type="file" id="fileInput" style={{ display: "none" }} onChange={this.jsReadFiles.bind(this)}/>
                <span className={cssM.sourceBtn}><Button onClick={this.selectFile}>导入</Button></span>
                <div className={cssM.settingContent}>
                    {this.state.selectableOrigins.map((item: Iorigin) => (
                        <Checkbox
                            key={item.id}
                            className={[cssM.origins, 'theme-color'].join(' ')}
                            checked={this.state.enableOrigin === item.id}
                            onChange={() => {
                                this.onChange(item);
                            }}>
                            <Row>
                                <Col span={4} className={cssM.originItem}>
                                    名称：{item.id}
                                </Col>
                                <Col span={16} className={cssM.originItem}>
                                    地址：{item.api}
                                </Col>
                                {this.state.enableOrigin !== item.id && (
                                    <Col span={2}>
                                        <span
                                            className={cssM.originBtn}
                                            onClick={() => {
                                                this.deleteOrigin(item.id);
                                            }}>
                                            删除
                                        </span>
                                    </Col>
                                )}
                            </Row>
                        </Checkbox>
                    ))}
                </div>
                <span className={cssM.settingTitle}>添加视频源</span>
                <div className={[cssM.settingContent, 'theme-input'].join(' ')}>
                    <Row gutter={30}>
                        <Col span={6}>
                            <Input ref={'oriNameInput'} addonBefore={'名称'} />
                        </Col>
                        <Col span={13}>
                            <Input ref={'oriAddrInput'} addonBefore={'地址'} />
                        </Col>
                        <Col span={4}>
                            <Button onClick={this.addOrigin}>添加</Button>
                        </Col>
                    </Row>
                </div>
            </div>
        );
    }
}
