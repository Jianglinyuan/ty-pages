import React, { Component } from "react";
import ReactDOM from "react-dom";
import queryString from "query-string";
import axios from "axios";
import {
  Button,
  WhiteSpace,
  Modal,
  WingBlank,
  Card,
  InputItem,
  Toast,
  Picker,
  List,
  ImagePicker
} from "antd-mobile";
import config from "./config";
import "./index.scss";
import "antd-mobile/dist/antd-mobile.css"; // or 'antd-mobile/dist/antd-mobile.less'

const alert = Modal.alert;

export default class Index extends Component {
  state = {
    pageTitle: "添加案例",
    type: ["anli"],
    pic: []
  };

  async componentDidMount() {
    const that = this;
    const parsedQuery = queryString.parse(location.search);

    const { data } = await axios.get(
      "https://siyan.tech/ty-api/getUser?openID=" + parsedQuery.openId
    );

    if (!parsedQuery.id && parsedQuery.isnew !== "1") {
      Toast.fail("错误的请求信息！");
      this.setState({
        error: true
      });
      return;
    }
    this.setState({
      type: [parsedQuery.type],
      isnew: parsedQuery.isnew === "1",
      user: data
    });
    this.id = parsedQuery.id;
    this.openId = parsedQuery.openId;
    const url = config[parsedQuery.type];
    const posturl = config[parsedQuery.type + "post"];
    this.url = url;
    this.posturl = posturl;

    const artEditor = (this.artEditor = new Eleditor({
      el: "#contentEditor",
      upload: {
        server: "/ty-api/upload",
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
          handle: function (select, controll) {
            //回调返回选择的dom对象和控制按钮对象
            /*因为上传要提前绑定按钮到webuploader，所以这里不做上传逻辑，写在mounted*/
            /*!!!!!!返回false编辑面板不会关掉*/
            return false;
          }
        },
        "undo",
        "cancel"
      ],
      mounted: function () {
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
        _videoUploader.on("uploadSuccess", function (_file, _call) {
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
      changer: function (value) {
        const _content = artEditor.getContent();
        that.setState({
          content: _content
        });
      }
    }));

    if (parsedQuery.isnew !== "1") {
      const { data } = await axios.get(`${url}?id=${parsedQuery.id}`);
      this.setState({
        title: data.title,
        pageTitle: "修改案例",
        pic: [{url: data.pic, id: 0}]
      });
      artEditor.append(data.content);
      that.setState({
        content: data.content
      });
    }
  }

  piconChange = (files, type, index) => {
    console.log(files)
    this.setState({
      pic: files,
    });
  }

  handerSubmit = () => {
    // wx.miniProgram.postMessage({ data: { content: this.state.content } });
    const that = this;
    alert("确认提交？", "请问您确认提交吗？", [
      { text: "取消", onPress: () => console.log("cancel") },
      {
        text: "确认",
        onPress: async () => {
          console.log(that.posturl);
          const result = await axios.post(config[that.state.type + "post"], {
            content: that.state.content,
            id: that.id,
            openId: that.openId,
            title: this.state.title,
            author: this.state.user.nickName,
            pic: this.state.pic[0].url
          });
          Toast.success("恭喜您操作成功");
          if (result.data.id) this.id = result.data.id;
          wx.miniProgram.navigateTo({
            url: "/pages/anlidetail?id=" + this.id
          });
        }
      }
    ]);
  };

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            height: "100%",
            alignItems: "center"
          }}
        >
          404
        </div>
      );
    }

    const seasons = [
      {
        label: "案例",
        value: "anli"
      },
      {
        label: "病例",
        value: "bingli"
      }
    ];

    return (
      <div style={{ height: "100%" }}>
        {/* <div className="edit-title">编辑内容</div>
        <div id="contentEditor" />
        <Button type="primary">primary</Button> */}
        <Card full>
          <Card.Header
            title={this.state.pageTitle}
            thumb="https://siyan.tech/ty/static/xiugai.png"
            thumbStyle={{ width: "20px" }}
          />
          <Card.Body>
            <InputItem
              clear
              placeholder="请输入文章标题"
              ref={el => (this.autoFocusInst = el)}
              value={this.state.title}
              onChange={value => this.setState({ title: value })}
            >
              标题
            </InputItem>
            <Picker
              data={seasons}
              title="选择类型"
              cols={1}
              disabled={!this.state.isnew}
              value={this.state.type}
              onChange={v => this.setState({ type: v })}
              onOk={v => this.setState({ type: v })}
            >
              <List.Item arrow="horizontal">文章类型</List.Item>
            </Picker>
            <div className="pic">
                <div className="pic-label">文章封面</div>
                <ImagePicker
                  files={this.state.pic}
                  onChange={this.piconChange}
                  onImageClick={(index, fs) => console.log(index, fs)}
                  selectable={this.state.pic.length < 1}
                  accept="image/gif,image/jpeg,image/jpg,image/png"
                />
              </div>
            <div id="contentEditor" />
          </Card.Body>
        </Card>
        <div className="submit">
          <Button
            onClick={this.handerSubmit}
            type="primary"
            icon="check-circle-o"
          >
            提交
          </Button>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById("app"));
