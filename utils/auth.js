import { login, wechatLogin, checkLogin } from '../services/auth/index';

/**
 * 检查用户是否登录
 * @returns {boolean} 是否已登录
 */
export function isLoggedIn() {
  try {
    const token = wx.getStorageSync('token');
    return !!token;
  } catch (e) {
    return false;
  }
}

/**
 * 获取用户信息
 * @returns {object|null} 用户信息
 */
export function getUserInfo() {
  try {
    return wx.getStorageSync('userInfo') || null;
  } catch (e) {
    return null;
  }
}

/**
 * 保存用户信息
 * @param {object} userInfo 用户信息
 */
export function setUserInfo(userInfo) {
  try {
    wx.setStorageSync('userInfo', userInfo);
  } catch (e) {
    console.error('保存用户信息失败', e);
  }
}

/**
 * 清除用户信息
 */
export function clearUserInfo() {
  try {
    wx.removeStorageSync('userInfo');
  } catch (e) {
    console.error('清除用户信息失败', e);
  }
}

/**
 * 检查登录状态，如果未登录则跳转到登录页
 * @param {object} options 配置选项
 * @param {boolean} options.force 是否强制跳转（默认true）
 * @param {string} options.redirectUrl 登录成功后跳转的地址
 * @returns {boolean} 是否已登录
 */
export function requireLogin(options = {}) {
  const {
    force = true,
    redirectUrl,
  } = options;

  const loggedIn = isLoggedIn();

  if (!loggedIn && force) {
    // 未登录，跳转到登录页
    let url = '/pages/user/login/index';

    if (redirectUrl) {
      // 保存跳转地址，登录成功后返回
      wx.setStorageSync('loginRedirectUrl', redirectUrl);
      url += `?redirect=${encodeURIComponent(redirectUrl)}`;
    }

    wx.navigateTo({
      url,
      fail: () => {
        // 如果navigateTo失败，尝试使用switchTab
        wx.switchTab({
          url: '/pages/usercenter/index',
        });
      },
    });
  }

  return loggedIn;
}

/**
 * 退出登录
 */
export function logout() {
  // 清除token
  try {
    wx.removeStorageSync('token');
  } catch (e) {
    console.error('清除token失败', e);
  }

  // 清除用户信息
  clearUserInfo();

  // 跳转到首页或用户中心
  wx.switchTab({
    url: '/pages/home/index',
  });
}

/**
 * 显示登录提示弹窗
 * @param {object} options 配置选项
 * @param {string} options.content 提示内容
 * @param {string} options.confirmText 确认按钮文字
 * @param {string} options.cancelText 取消按钮文字
 * @returns {Promise<boolean>} 用户是否点击了确认
 */
export function showLoginPrompt(options = {}) {
  const {
    content = '请先登录后再进行操作',
    confirmText = '去登录',
    cancelText = '取消',
  } = options;

  return new Promise((resolve) => {
    wx.showModal({
      title: '提示',
      content,
      confirmText,
      cancelText,
      success: (res) => {
        if (res.confirm) {
          // 跳转到登录页
          const pages = getCurrentPages();
          const currentPage = pages[pages.length - 1];
          const currentUrl = `/${currentPage.route}`;

          let url = '/pages/user/login/index';
          url += `?redirect=${encodeURIComponent(currentUrl)}`;

          wx.navigateTo({
            url,
          });

          resolve(true);
        } else {
          resolve(false);
        }
      },
    });
  });
}

/**
 * 检查权限并在需要时显示登录提示
 * @param {object} options 配置选项
 * @param {boolean} options.showPrompt 是否显示提示（默认true）
 * @param {string} options.promptContent 提示内容
 * @returns {boolean} 是否已登录
 */
export function checkPermission(options = {}) {
  const {
    showPrompt = true,
    promptContent = '请先登录后再进行操作',
  } = options;

  if (isLoggedIn()) {
    return true;
  }

  if (showPrompt) {
    showLoginPrompt({ content: promptContent });
  }

  return false;
}
