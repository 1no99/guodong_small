import { wechatLogin, bindPhone } from '../../../services/auth/index';
import { setUserInfo } from '../../../utils/auth';
import { setToken } from '../../../utils/request';
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    loading: false,
    redirectUrl: '', // 登录成功后跳转的地址
    isLoggedIn: false, // 是否已微信登录
    hasPhone: false, // 是否已绑定手机号
    phoneNumber: '', // 用户输入的手机号
    submitting: false, // 是否正在提交绑定
    avatarUrl: '', // 获取的头像URL
    nickname: '', // 微信昵称
  },

  onLoad(options) {
    const { redirect } = options;

    if (redirect) {
      this.setData({
        redirectUrl: decodeURIComponent(redirect),
      });
    }

    // 自动触发微信登录
    this.handleWechatLogin();
  },

  // 微信登录
  async handleWechatLogin() {
    const { loading } = this.data;

    if (loading) {
      return;
    }

    this.setData({
      loading: true,
    });

    try {
      // 获取微信登录code
      const { code } = await wx.login();
      console.log('wx.login code:', code);

      const res = await wechatLogin(code);
      console.log('wechatLogin response:', JSON.stringify(res));

      if (res && res.code == 0) {
        const { token, user } = res.data || {};

        if (!user) {
          console.error('登录成功但未返回用户信息');
          Toast({
            context: this,
            selector: '#t-toast',
            message: '登录失败：未获取到用户信息',
            theme: 'error',
          });
          this.setData({ loading: false });
          return;
        }

        // 判断是否已有手机号
        if (user.phone) {
          // 已有手机号，直接登录成功
          setToken(token);
          setUserInfo(user);
          this.loginSuccess();
        } else {
          // 未绑定手机号，进入绑定流程（仅存储 token，用户信息待绑定完成后存储）
          setToken(token);
          wx.removeStorageSync('userInfo');

          // 检查隐私授权状态
          const authorized = await this.checkPrivacyAuthorize();
          if (!authorized) {
            Toast({
              context: this,
              selector: '#t-toast',
              message: '需要同意隐私协议才能继续',
              theme: 'warning',
            });
          }

          this.setData({
            loading: false,
            isLoggedIn: true,
            hasPhone: false,
          });
        }
      } else {
        Toast({
          context: this,
          selector: '#t-toast',
          message: (res && res.message) || '登录失败',
          theme: 'error',
        });

        setTimeout(() => {
          this.setData({ loading: false });
        }, 2000);
      }
    } catch (err) {
      console.error('微信登录失败', err);
      Toast({
        context: this,
        selector: '#t-toast',
        message: err.message || '登录失败，请重试',
        theme: 'error',
      });

      setTimeout(() => {
        this.setData({ loading: false });
      }, 2000);
    }
  },
  gotopages(){
    wx.switchTab({
      url: '/pages/home/home',
    });
  },
  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      phoneNumber: e.detail.value,
    });
  },

  // 获取头像（确认绑定按钮触发）
  onGetAvatar(e) {
    const { avatarUrl } = e.detail;
    if (avatarUrl) {
      this.setData({ avatarUrl });
    }
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  // 检查隐私授权状态
  checkPrivacyAuthorize() {
    return new Promise((resolve, reject) => {
      wx.getPrivacySetting({
        success: (res) => {
          if (res.needAuthorization) {
            // 需要隐私授权，调用系统隐私弹窗
            wx.requirePrivacyAuthorize({
              success: () => {
                console.log('隐私授权成功');
                resolve(true);
              },
              fail: (err) => {
                console.error('隐私授权失败', err);
                resolve(false);
              },
            });
          } else {
            // 已经授权过
            resolve(true);
          }
        },
        fail: (err) => {
          console.error('获取隐私设置失败', err);
          // 获取失败时默认允许
          resolve(true);
        },
      });
    });
  },

  // 点击确认绑定 → 获取头像 → 提交全部数据
  onGetAvatarAndSubmit(e) {
    // 先获取头像
    const { avatarUrl } = e.detail;
    if (avatarUrl) {
      this.setData({ avatarUrl });
    }
    // 提交
    this.onSubmitPhone();
  },

  // 将头像临时文件转换为base64
  avatarToBase64(filePath) {
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager();
      fs.readFile({
        filePath: filePath,
        encoding: 'base64',
        success: (res) => {
          // 获取文件扩展名来确定MIME类型
          const ext = filePath.split('.').pop().toLowerCase();
          const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp' };
          const mime = mimeMap[ext] || 'png';
          resolve(`data:image/${mime};base64,${res.data}`);
        },
        fail: (err) => {
          console.error('读取头像文件失败', err);
          reject(new Error('读取头像失败'));
        },
      });
    });
  },

  // 提交绑定手机号（同时提交头像和昵称）
  async onSubmitPhone() {
    const { phoneNumber, avatarUrl, nickname } = this.data;

    // 昵称必填校验
    if (!nickname || !nickname.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入昵称',
        theme: 'warning',
      });
      return;
    }

    // 手机号必填校验
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入正确的手机号',
        theme: 'warning',
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      // 将头像转换为base64
      let finalAvatar = '';
      if (avatarUrl) {
        finalAvatar = await this.avatarToBase64(avatarUrl);
      }

      // 昵称存到username字段
      const finalUsername = nickname ? nickname.trim() : '';

      // 调用绑定手机号接口，同时传递头像(base64)和昵称
      const res = await bindPhone(phoneNumber, finalUsername, finalAvatar);

      if (res.code == 0) {
        const { token, user } = res.data;
        setToken(token);
        setUserInfo(user);

        this.setData({
          submitting: false,
          isLoggedIn: true,
          hasPhone: true,
        });

        this.loginSuccess();
      } else {
        Toast({
          context: this,
          selector: '#t-toast',
          message: res.message || '绑定手机号失败',
          theme: 'error',
        });
        this.setData({ submitting: false });
      }
    } catch (err) {
      console.error('绑定手机号失败', err);
      Toast({
        context: this,
        selector: '#t-toast',
        message: err.message || '绑定失败，请重试',
        theme: 'error',
      });
      this.setData({ submitting: false });
    }
  },

  // 登录成功处理
  loginSuccess() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '登录成功',
      theme: 'success',
    });

    setTimeout(() => {
      this.handleLoginSuccess();
    }, 1500);
  },

  // 重新登录
  retryLogin() {
    this.handleWechatLogin();
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      fail: () => {
        // 如果没有上一页，跳转到首页
        wx.switchTab({
          url: '/pages/home/home',
        });
      },
    });
  },

  // 登录成功处理
  handleLoginSuccess() {
    const { redirectUrl } = this.data;

    if (redirectUrl) {
      // 跳转到指定页面
      wx.redirectTo({
        url: redirectUrl,
        fail: () => {
          // 如果跳转失败，返回上一页
          wx.navigateBack();
        },
      });
    } else {
      // 返回上一页
      wx.navigateBack({
        fail: () => {
          // 如果没有上一页，跳转到首页
          wx.switchTab({
            url: '/pages/home/home',
          });
        },
      });
    }
  },
});
