Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    // 打开隐私协议文档
    openPrivacyContract() {
      wx.openPrivacyContract({
        success: () => {},
        fail: () => {
          wx.showToast({
            title: '打开失败',
            icon: 'none',
          });
        },
      });
    },

    // 同意授权
    onAgree() {
      this.triggerEvent('agree');
    },

    // 不同意
    onDisagree() {
      this.triggerEvent('disagree');
    },
  },
});
