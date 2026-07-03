import { config } from '../../config/index';
import { isLoggedIn, requireLogin } from '../../utils/auth';
const { get, post, put, delete: deleteRequest } = require('../../utils/request');

/** 获取收货地址 */
export function fetchDeliveryAddress(id = 0) {
  if (config.useMock) {
    // Mock 模式下的实现
    return Promise.resolve({
      id: 0,
      userName: '',
      phoneNumber: '',
      name: '',
      phone: '',
      address: '',
      tag: '',
      addressTag: '',
      isDefault: false,
      provinceName: '',
      cityName: '',
      districtName: '',
      detailAddress: '',
      postalCode: '',
      addressId: 0,
      labelIndex: null,
    });
  }

  // 调用真实后端API（不需要传递手机号）
  return get(`/user/address/${id}`, {}, true)
    .then((data) => {
      if (data.code === 0) {
        const address = data.data;
        return {
          id: address.id,
          userName: address.receiver_name || '',
          phoneNumber: address.receiver_phone || '',
          name: address.receiver_name || '',
          phone: address.receiver_phone || '',
          address: `${address.province || ''}${address.city || ''}${address.district || ''}${address.detail_address || ''}`,
          tag: address.tag || '',
          addressTag: address.tag || '',
          isDefault: address.is_default === 1,
          // 编辑页面需要的额外字段
          provinceName: address.province || '',
          cityName: address.city || '',
          districtName: address.district || '',
          detailAddress: address.detail_address || '',
          postalCode: address.postal_code || '',
          addressId: address.id,
          labelIndex: null, // 标签索引，根据tag来设置
        };
      }
      throw new Error(data.message || '获取收货地址失败');
    });
}

/** 获取收货地址列表 */
function mockFetchDeliveryAddressList() {
  // Mock 模式下返回空数组
  return Promise.resolve([]);
}

/** 获取收货地址列表 */
export function fetchDeliveryAddressList() {
  if (config.useMock) {
    return mockFetchDeliveryAddressList();
  }

  // 从本地存储获取手机号
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  // 检查登录状态
  if (!phone) {
    // 手机号为空，检查是否登录
    if (!isLoggedIn()) {
      // 未登录，跳转到登录页
      requireLogin({
        redirectUrl: '/pages/user/address/list/index',
      });
      // 返回一个 rejected Promise，阻止后续操作
      return Promise.reject(new Error('未登录'));
    }
    // 已登录但手机号为空，继续请求（后端会处理）
  }

  // 调用真实后端API，传递手机号参数
  return get('/user/address', { phone }, true)
    .then((data) => {
      if (data.code === 0) {
        const addresses = data.data || [];
        return addresses.map((address) => ({
          id: address.id,
          userName: address.receiver_name,
          phoneNumber: address.receiver_phone,
          address: `${address.province}${address.city}${address.district}${address.detail_address}`,
          tag: address.tag || '',
          isDefault: address.is_default === 1,
        }));
      }
      throw new Error(data.message || '获取收货地址列表失败');
    });
}

/** 创建收货地址 */
export function createAddress(addressData) {
  return post('/user/address', {
    name: addressData.name,
    phone: addressData.phone, // 添加用户手机号
    province: addressData.provinceName,
    city: addressData.cityName,
    district: addressData.districtName,
    detail_address: addressData.detailAddress,
    is_default: addressData.isDefault ? 1 : 0,
    user_phone: addressData.user_phone
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data;
      }
      throw new Error(data.message || '创建地址失败');
    });
}

/** 更新收货地址 */
export function updateAddress(id, addressData) {
  return put(`/user/address/${id}`, {
    name: addressData.name,
    phone: addressData.phone, // 添加用户手机号
    province: addressData.provinceName,
    city: addressData.cityName,
    district: addressData.districtName,
    detail_address: addressData.detailAddress,
    is_default: addressData.isDefault ? 1 : 0,
    user_phone: addressData.user_phone
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data;
      }
      throw new Error(data.message || '更新地址失败');
    });
}

/** 删除收货地址 */
export function deleteAddress(id) {
  return deleteRequest(`/user/address/${id}`, {}, true)
    .then((data) => {
      if (data.code === 0) {
        return true;
      }
      throw new Error(data.message || '删除地址失败');
    });
}
