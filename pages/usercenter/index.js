import { fetchUserCenter } from '../../services/usercenter/fetchUsercenter';
import Toast from 'tdesign-miniprogram/toast/index';
import { isLoggedIn, requireLogin, logout } from '../../utils/auth';
import { get } from '../../utils/request';
const menuData = [
  
  [
    {
      title: '收货地址',
      tit: '',
      url: '',
      type: 'address',
    },
   
  ],
  [
   
    {
      title: '联系客服',
      tit: '',
      url: '',
      type: 'service',
      icon: 'service',
    },
  ],
];

const orderTagInfos = [
  {
    title: '待付款',
    iconName: 'wallet',
    orderNum: 0,
    tabType: 0,  // 对应 OrderStatus.PENDING_PAYMENT
    status: 1,
  },
  {
    title: '已确认',
    iconName: 'deliver',
    orderNum: 0,
    tabType: 1,  // 对应 OrderStatus.PENDING_CONFIRM
    status: 1,
  },
  {
    title: '已发货',
    iconName: 'package',
    orderNum: 0,
    tabType: 2,  // 对应 OrderStatus.PENDING_DELIVERY
    status: 1,
  },
  // {
  //   title: '已完成',
  //   iconName: 'deliver',
  //   orderNum: 0,
  //   tabType: 4,  // 对应 OrderStatus.COMPLETE
  //   status: 1,
  // }
];


Page({
  data: {
    showMakePhone: false,
    userInfo: {
      avatarUrl: '',
      nickName: '正在登录...',
      phoneNumber: '',
    },
    menuData,
    orderTagInfos,
    customerServiceInfo: {},
    currAuthStep: 1,
    showKefu: true,
    versionNo: '',
    userInfoObj:{},
  },
  
  onLoad() {
    this.getVersionInfo();
  },

  onShow() {
    this.getTabBar().init();
    this.init();
    this.getuserInfoFun()
  },
  onPullDownRefresh() {
    this.init();
  },
getuserInfoFun(){
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';
  if(!phone){
    return false
  }
  get('/user/info/by-phone', {
    phone: phone,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        this.setData({
          userInfoObj:data.data
        })
      }
      return [];
    })
    .catch(() => {
      return [];
    });
},
  init() {
    // 检查登录状态
    if (!isLoggedIn()) {
      // 未登录状态
      this.setData({
        userInfo: {
          avatarUrl: '',
          nickName: '未登录',
          phoneNumber: '',
        },
        currAuthStep: 1,
      });
      wx.stopPullDownRefresh();
      return;
    }

    // 已登录，检查是否绑定了手机号
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.phone) {
      wx.navigateTo({
        url: '/pages/user/login/index?redirect=' + encodeURIComponent('/pages/usercenter/index'),
      });
      wx.stopPullDownRefresh();
      return;
    }

    // 已登录且已绑定手机号，获取用户信息
    this.fetUseriInfoHandle();
  },

  fetUseriInfoHandle() {
    fetchUserCenter().then(({ userInfo, countsData, orderTagInfos: orderInfo, customerServiceInfo }) => {
      // 安全检查：确保 menuData[0] 存在
      if (menuData && menuData[0] && Array.isArray(menuData[0])) {
        menuData[0].forEach((v) => {
          if (countsData && Array.isArray(countsData)) {
            countsData.forEach((counts) => {
              if (counts.type === v.type) {
                // eslint-disable-next-line no-param-reassign
                v.tit = counts.num;
              }
            });
          }
        });
      }
      const info = Array.isArray(orderTagInfos) && Array.isArray(orderInfo)
        ? orderTagInfos.map((v, index) => ({
            ...v,
            ...(orderInfo[index] || {}),
          }))
        : orderTagInfos;
      this.setData({
        userInfo,
        menuData,
        orderTagInfos: info,
        customerServiceInfo,
        currAuthStep: 2,
      });
      wx.stopPullDownRefresh();
    }).catch((err) => {
      console.error('获取用户信息失败', err);
      // Token可能过期，显示未登录状态
      this.setData({
        userInfo: {
          avatarUrl: '',
          nickName: '未登录',
          phoneNumber: '',
        },
        currAuthStep: 1,
      });
      wx.stopPullDownRefresh();
    });
  },

  onClickCell({ currentTarget }) {
    const { type } = currentTarget.dataset;

    // 需要登录的功能
    if (type === 'address') {
      if (!requireLogin()) {
        return;
      }
    }

    switch (type) {
      case 'address': {
        wx.navigateTo({ url: '/pages/user/address/list/index' });
        break;
      }
      case 'service': {
        this.openMakePhone();
        break;
      }
      case 'help-center': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了帮助中心',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'point': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了积分菜单',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'coupon': {
        wx.navigateTo({ url: '/pages/coupon/coupon-list/index' });
        break;
      }
      default: {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '未知跳转',
          icon: '',
          duration: 1000,
        });
        break;
      }
    }
  },

  jumpNav(e) {
    // 检查登录状态
    if (!requireLogin()) {
      return;
    }

    const status = e.detail.tabType;
      wx.navigateTo({ url: `/pages/order/order-list/index?status=${status}` });
  },

  jumpAllOrder() {
    // 检查登录状态
    if (!requireLogin()) {
      return;
    }

    wx.navigateTo({ url: '/pages/order/order-list/index' });
  },

  openMakePhone() {
    this.setData({ showMakePhone: true });
  },

  closeMakePhone() {
    this.setData({ showMakePhone: false });
  },

  call() {
    wx.makePhoneCall({
      phoneNumber: '15760083771',
    });
  },

  gotoUserEditPage() {
    const { currAuthStep } = this.data;
    if (currAuthStep === 2) {
      wx.navigateTo({ url: '/pages/user/person-info/index' });
    } else {
      // 未登录，跳转到登录页
      requireLogin({ redirectUrl: '/pages/usercenter/index' });
    }
  },

  getVersionInfo() {
    const versionInfo = wx.getAccountInfoSync();
    const { version, envVersion = __wxConfig } = versionInfo.miniProgram;
    this.setData({
      versionNo: envVersion === 'release' ? version : envVersion,
    });
  },

  handleLogout() {
    // 显示确认弹窗
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 用户点击确定
          logout();
          // 重新初始化页面状态
          this.setData({
            userInfo: {
              avatarUrl: '',
              nickName: '未登录',
              phoneNumber: '',
            },
            currAuthStep: 1,
            userInfoObj:{}
          });
          Toast({
            context: this,
            selector: '#t-toast',
            message: '已退出登录',
            icon: '',
            duration: 1500,
          });
        }
      },
    });
  },
});
