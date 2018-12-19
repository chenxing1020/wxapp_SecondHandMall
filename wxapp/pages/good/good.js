const app = getApp();

// pages/goods/goods.js
Page({

  data: {
    cmtAt: '询问更多，欢迎留个言',
    cmtAtName: null,
    cmtAtId: null,
    cmt: "",
    gId: null,
    gData: {},
    cmtData: {},
    college: app.globalData.college,
    swiperCurrent: 0,
    userInfo: {},
    hasUserInfo: false,
    hasFavor: false,
    favor: 0
  },

  onLoad: function(options) {
    var that = this;
    that.data.gId = options._id;
    wx.showLoading({
      title: '加载中'
    });

    //请求商品和评论信息
    wx.request({
      url: app.globalData.requestUrl + 'good',
      data: {
        _id: options._id
      },
      success: function(res) {
        wx.hideLoading();
        let hf = wx.getStorageSync(options._id)
        if (!hf) hf = false;
        that.setData({
          gData: res.data.gData,
          cmtData: res.data.cmtData,
          hasFavor: hf,
          favor: res.data.gData.favor
        })
      },
    });
  },

  onShow: function() {
    if (app.globalData.userInfo != null) {
      if (this.data.hasUserInfo == false) {
        this.setData({
          userInfo: app.globalData.userInfo,
          hasUserInfo: true
        })
      }
    }
  },

  //滑块视图切换事件
  swiperChange: function(e) {
    if (e.detail.source == 'touch') {
      this.setData({
        swiperCurrent: e.detail.current
      })
    }
  },

  //留言评论
  submitComment: function() {
    let that = this;
    if (that.data.hasUserInfo == false) {
      wx.showToast({
        title: '请您先登录！',
        icon: 'none',
        mask: true,
        duration: 2000
      });
    } else {
      let gData = that.data.gData,
        sessionId = app.globalData.sessionId,
        cuId = gData.uId,
        cuName = gData.uName;
      //评论回复其他买家，否则认为回复卖家
      if (that.data.cmtAtId != null) {
        cuId = that.data.cmtAtId;
        cuName = that.data.cmtAtName;
      }
      wx.request({
        url: app.globalData.requestUrl + 'submitCmt',
        method: 'POST',
        data: {
          gId: that.data.gId,
          sessionId: sessionId,
          cuId: cuId,
          cuName: cuName,
          cmt: that.data.cmt
        },
        success: function(res) {
          //评论成功就将刷新留言
          that.loadComment();
          wx.showToast({
            title: '留言成功！',
            icon: 'none',
            mask: true,
            duration: 2000
          });
        },
      });
    }
  },

  //刷新评论并将输入框置空
  loadComment: function() {
    let that = this;
    wx.request({
      url: app.globalData.requestUrl + 'comment',
      data: {
        gId: that.data.gId
      },
      success: function(res) {
        that.setData({
          cmtData: res.data,
          cmt: ""
        })
      },
    })
  },


  //点击评论指定回复
  commentAt: function(e) {
    this.setData({
      cmtAt: '回复@' + e.currentTarget.dataset.name,
      cmtAtName: e.currentTarget.dataset.name,
      cmtAtId: e.currentTarget.dataset.uid
    })
  },
  //预览图片
  previewImage: function(e) {
    wx.previewImage({
      current: this.data.gData.imgList[e.currentTarget.dataset.index], // 当前显示图片的http链接
      urls: this.data.gData.imgList // 需要预览的图片http链接列表
    })
  },

  inputChange: function(e) {
    this.data.cmt = e.detail.value;
  },

  //单击收藏状态改变
  changeFavor: function() {
    let that = this;
    let hf = that.data.hasFavor;
    let fnum = 0;
    if (hf == false) { //未收藏，在缓存中添加id键，数据库中favor增量置1
      wx.setStorageSync(this.data.gId, true);
      hf = true;
      fnum = 1;
    } else { //已收藏，删除缓存中的id键，数据库favor增量置-1
      wx.removeStorageSync(this.data.gId);
      hf = false;
      fnum = -1;
    }
    wx.request({
      url: app.globalData.requestUrl + 'favor',
      method: 'PUT',
      data: {
        gId: that.data.gId,
        fnum: fnum
      },
      success: (res) => {
        wx.showToast({
          title: res.data.fstate,
          icon: 'none',
          mask: true,
          duration: 2000
        })
      }
    })
    that.setData({
      hasFavor: hf,
      favor: that.data.favor + fnum
    })

  }
})