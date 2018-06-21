import React, { Component } from "react";
import ReactDOM from "react-dom";
import queryString from "query-string";
import axios from "axios";
import { Button, WhiteSpace, WingBlank, Card, InputItem } from "antd-mobile";
import config from "./config";
import "./index.scss";
import "antd-mobile/dist/antd-mobile.css"; // or 'antd-mobile/dist/antd-mobile.less'

export default class Index extends Component {
  state = {};

  async componentDidMount() {
    const parsedQuery = queryString.parse(location.search);
    const url = config[parsedQuery.type];

    const artEditor = (this.artEditor = new Eleditor({
      el: "#contentEditor",
      upload: {
        server: "/upload.php",
        fileSizeLimit: 2,
        compress: true
      },
      toolbars: [
        "insertText",
        "editText",
        "insertImage",
        "insertLink",
        "insertHr",
        "delete",
        //自定义一个视频按钮
        {
          id: "insertVideo",
          // tag: 'p,img', //指定P标签操作，可不填
          name: "插入视频",
          handle: function(select, controll) {
            //回调返回选择的dom对象和控制按钮对象
            /*因为上传要提前绑定按钮到webuploader，所以这里不做上传逻辑，写在mounted*/
            /*!!!!!!返回false编辑面板不会关掉*/
            return false;
          }
        },
        "undo",
        "cancel"
      ],
      mounted: function() {
        /*以下是扩展插入视频的演示*/
        var _videoUploader = WebUploader.create({
          auto: true,
          server: "服务器地址",
          /*按钮类就是[Eleditor-你的自定义按钮id]*/
          pick: $(".Eleditor-insertVideo"),
          duplicate: true,
          resize: false,
          accept: {
            title: "Images",
            extensions: "mp4",
            mimeTypes: "video/mp4"
          },
          fileVal: "video"
        });
        _videoUploader.on("uploadSuccess", function(_file, _call) {
          if (_call.status == 0) {
            return window.alert(_call.msg);
          }
          /*保存状态，以便撤销*/
          contentEditor.saveState();
          contentEditor.getEditNode().after(`
            <div class='Eleditor-video-area'>
              <video src="${_call.url}" controls="controls"></video>
            </div>
          `);
          contentEditor.hideEditorControllerLayer();
        });
      },
      changer: function(value) {
        const _content = artEditor.getContent();
        console.log("​Index -> componentDidMount -> _content", _content);
      }
    }));

    if (parsedQuery.isnew !== "1") {
      const { data } = await axios.get(`${url}?id=${parsedQuery.id}`);
      this.setState({
        title: data.title
      });
      artEditor.append(data.content);
    }
  }

  render() {
    return (
      <div>
        {/* <div className="edit-title">编辑内容</div>
        <div id="contentEditor" />
        <Button type="primary">primary</Button> */}
        <Card full>
          <Card.Header
            title="添加文章"
            thumb="http://photo.siyan.tech/xiugai.png"
            thumbStyle={{ width: "20px" }}
          />
          <Card.Body>
            <InputItem
              clear
              placeholder="请输入文章标题"
              ref={el => (this.autoFocusInst = el)}
              value={this.state.title}
              onChange={value => this.setState({title: value})}
            >
              标题
            </InputItem>
            <div id="contentEditor" />
          </Card.Body>
        </Card>
        <div className="submit">
          <Button type="primary" icon="check-circle-o">
            提交
          </Button>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById("app"));
