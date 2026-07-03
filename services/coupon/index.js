import { get } from '../../utils/request';

/**
 * 获取优惠券列表
 */
export function fetchCouponList() {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return get('/coupon/list', {
    phone: phone,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data.list || [];
      }
      return [];
    })
    .catch(() => {
      return [];
    });
}

/**
 * 获取可用优惠券
 */
export function fetchAvailableCoupons(orderAmount) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return get('/coupon/available', {
    phone: phone,
    orderAmount: orderAmount,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data.list || [];
      }
      return [];
    })
    .catch(() => {
      return [];
    });
}

/**
 * 领取优惠券
 */
export function receiveCoupon(couponId) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return get('/coupon/receive', {
    phone: phone,
    couponId: couponId,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return true;
      }
      throw new Error(data.message || '领取失败');
    });
}
