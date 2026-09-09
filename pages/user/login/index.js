import { wechatLogin, bindPhoneByCode } from '../../../services/auth/index';
import { setUserInfo ,logout} from '../../../utils/auth';
import { setToken } from '../../../utils/request';
import Toast from 'tdesign-miniprogram/toast/index';
Page({
  data: {
    loading: false,
    redirectUrl: '',
    isLoggedIn: false,
    hasPhone: false,
    submitting: false,
    nickname: '',
    avatarUrl: '',
    currentStep: 1, // 1=昵称, 2=头像, 3=手机号
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
      console.log('wechatLogin response:', res);

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

  // 昵称输入
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  // 选择头像回调
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    if (avatarUrl) {
      this.setData({ avatarUrl, currentStep: 3 });
    }
  },

  // 步骤1：确认昵称，进入下一步
  onNextToAvatar() {
    const { nickname } = this.data;
    if (!nickname || !nickname.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入昵称',
        theme: 'warning',
      });
      return;
    }
    this.setData({ currentStep: 2 });
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
                //console.log('隐私授权成功');
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

  // 授权手机号回调（步骤3）
  async onGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '需要授权手机号才能完成注册',
        theme: 'warning',
      });
      return;
    }

    const { nickname, avatarUrl } = this.data;

    this.setData({ submitting: true });

    try {
      let finalAvatar = '';
      if (avatarUrl) {
        finalAvatar = await this.avatarToBase64(avatarUrl);
      }

      const finalUsername = nickname.trim();

      // 调用绑定接口，传code由后端解密获取手机号
      const res = await bindPhoneByCode(e.detail.code, finalUsername, finalAvatar);

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

  // 将头像临时文件转换为base64
  avatarToBase64(filePath) {
    const fs = wx.getFileSystemManager();

    const readAsBase64 = (localPath) => {
      return new Promise((resolve) => {
        const ext = localPath.split('.').pop().toLowerCase();
        const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp' };
        const mime = mimeMap[ext] || 'png';
        fs.readFile({
          filePath: localPath,
          encoding: 'base64',
          success: (res) => {
            resolve(`data:image/${mime};base64,${res.data}`);
          },
          fail: () => {
            resolve('/pages/user/login/1.png');
          },
        });
      });
    };

    // 如果是网络临时地址，先下载到本地
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return new Promise((resolve) => {
        wx.downloadFile({
          url: filePath,
          success: (res) => {
            if (res.statusCode === 200) {
              readAsBase64(res.tempFilePath).then(resolve);
            } else {
              console.error('下载头像失败，使用默认头像');
              resolve('');
            }
          },
          fail: (err) => {
            console.error('下载头像失败，使用默认头像', err);
            resolve('');
          },
        });
      });
    }

    // 本地路径直接读取
    return readAsBase64(filePath);
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
