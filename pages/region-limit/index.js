Page({
  data: {
    message: '当前地区暂未开放访问',
  },

  onLoad(options) {
    if (options && options.msg) {
      let message = options.msg;
      try {
        message = decodeURIComponent(message);
      } catch (e) {
        // 部分基础库会自动解码，失败时保留原值
      }
      this.setData({ message });
    }
  },

  onRetry() {
    wx.reLaunch({
      url: '/pages/home/home',
    });
  },

  // superadmin 用户需要先登录，后端才能识别并放行
  onLogin() {
    wx.navigateTo({
      url: `/pages/user/login/index?redirect=${encodeURIComponent(
        '/pages/home/home',
      )}`,
    });
  },
});
