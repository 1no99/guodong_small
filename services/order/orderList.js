import { get } from '../../utils/request';

/**
 * 获取订单列表
 */
export function fetchOrders(params) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  // 页面传递的参数结构：{ parameter: { pageSize, pageNum, orderStatus } }
  const { parameter = {} } = params;

  // 构建后端期望的参数
  const queryParams = {
    phone: phone,
    page: parameter.pageNum || 1,
    pageSize: parameter.pageSize || 20,
  };

  // 只有当 orderStatus 不为 -1 和 undefined 时才传递 order_status
  if (parameter.orderStatus !== undefined && parameter.orderStatus !== -1) {
    queryParams.order_status = parameter.orderStatus;
  }
  return get('/order/list', queryParams, true)
    .then((data) => {
      if (data.code === 0) {
        const list = data.data.orders || [];
       

        const result = {
          list: list,
          total: data.data.total || 0,
        };
        return result;
      }
      throw new Error(data.message || '获取订单列表失败');
    })
    .catch((err) => {
      // 返回空数据而不是抛出错误
      return {
        data: { orders: [] },
        list: [],
        total: 0,
      };
    });
}
