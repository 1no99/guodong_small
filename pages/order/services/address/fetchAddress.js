const { get, post, put, delete: deleteRequest } = require('../../../../utils/request');

/**
 * 获取当前用户手机号
 */
function getUserPhone() {
  const userInfo = wx.getStorageSync('userInfo') || {};
  return userInfo.phone || '';
}

/**
 * 获取收货地址列表
 */
export function fetchDeliveryAddressList() {
  return get('/user/address', { phone: getUserPhone() }, true)
    .then((data) => {
      if (data.code === 0) {
        const addresses = data.data || [];
        return addresses.map((address) => ({
          id: address.id,
          userName: address.receiver_name || '',
          phoneNumber: address.receiver_phone || '',
          address: `${address.province || ''}${address.city || ''}${address.district || ''}${address.detail_address || ''}`,
          tag: address.tag || '',
          isDefault: address.is_default === 1,
        }));
      }
      return [];
    })
    .catch((err) => {
      console.error('获取地址列表失败:', err);
      return [];
    });
}

/**
 * 获取地址详情
 */
export function fetchDeliveryAddress(id) {
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
      throw new Error('获取地址详情失败');
    })
    .catch((err) => {
      console.error('获取地址详情失败:', err);
      throw err;
    });
}

/**
 * 创建收货地址
 */
export function createAddress(addressData) {
  return post('/user/address', {
    phone: getUserPhone(),
    receiver_name: addressData.name,
    receiver_phone: addressData.phone,
    province: addressData.provinceName,
    city: addressData.cityName,
    district: addressData.districtName,
    detail_address: addressData.detailAddress,
    postal_code: addressData.postalCode || '',
    is_default: addressData.isDefault ? 1 : 0,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data;
      }
      throw new Error(data.message || '创建地址失败');
    });
}

/**
 * 更新收货地址
 */
export function updateAddress(id, addressData) {
  return put(`/user/address/${id}`, {
    phone: getUserPhone(),
    receiver_name: addressData.name,
    receiver_phone: addressData.phone,
    province: addressData.provinceName,
    city: addressData.cityName,
    district: addressData.districtName,
    detail_address: addressData.detailAddress,
    postal_code: addressData.postalCode || '',
    is_default: addressData.isDefault ? 1 : 0,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data;
      }
      throw new Error(data.message || '更新地址失败');
    });
}

/**
 * 删除收货地址
 */
export function deleteAddress(id) {
  return deleteRequest(`/user/address/${id}`, {}, true)
    .then((data) => {
      if (data.code === 0) {
        return true;
      }
      throw new Error(data.message || '删除地址失败');
    });
}
