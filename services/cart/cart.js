import { get, post, put, delete as deleteRequest } from '../../utils/request';
import { fetchSpecList } from '../good/fetchSpec';

/**
 * 添加到购物车
 */
export function addToCart(cartData) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return post('/cart/add', {
    phone: phone,
    product_id: cartData.productId,
    sku_id: cartData.skuId || null,
    quantity: cartData.quantity || 1,
    sizeMoney:cartData.sizeMoney,
    actNumId:cartData.actNumId
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data;
      }
      throw new Error(data.message || '添加失败');
    });
}

/** 更新购物车项 */
export function updateCartItem(cartId, quantity) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return put(`/cart/item/${cartId}`, {
    phone: phone,
    quantity,
  }, true);
}

/** 删除购物车项 */
export function removeFromCart(cartId) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return deleteRequest(`/cart/item/${cartId}`, {
    phone: phone,
  }, true);
}

/** 清空购物车 */
export function clearCart() {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';

  return deleteRequest('/cart/clear', {
    phone: phone,
  }, true);
}

/** 获取购物车数量 */
export function getCartCount() {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';
  return get('/cart/count', {
    phone: phone,
  }, true)
    .then((data) => {
      if (data.code === 0) {
        return data.data.count || 0;
      }
      return 0;
    })
    .catch(() => 0);
}

/** 获取购物车列表 */
export function fetchCartGroupData() {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';
  if (!phone) {
    return Promise.resolve({
      storeGoods: [],
      isNotEmpty: false,
    });
  }
  // 先获取购物车列表
  return get('/cart/list', { phone: phone }, true)
    .then((cartData) => {
      if (cartData.code === 0) {
        // 获取购物车商品列表
        const cartList = Array.isArray(cartData.data?.list) ? cartData.data.list : [];

        if (cartList.length === 0) {
          return {
            goodsList: [],
            invalidGoodsList: [],
            isNotEmpty: false,
          };
        }
        return transformCartData({ list: cartList });
      }
    })
    .catch((error) => {
      // 返回空购物车而不是抛出错误
      return {
        storeGoods: [],
        invalidGoodItems: [],
        isNotEmpty: false,
      };
    });
}

/** 转换后端数据为前端期望的格式 */
function transformCartData(backendData) {
  // 确保 backendData 是一个对象
  if (!backendData || typeof backendData !== 'object') {
    return {
      goodsList: [],
      invalidGoodsList: [],
      isNotEmpty: false,
    };
  }

  // 确保 list 是一个数组
  const cartList = Array.isArray(backendData.list) ? backendData.list : [];
  // 直接返回商品列表，不涉及店铺维度
  const validGoodsList = [];
  const invalidGoodsList = [];

  if (cartList.length === 0) {
    return {
      goodsList: [],
      invalidGoodsList: [],
      isNotEmpty: false,
    };
  }

  cartList.forEach(item => {
    // 确保 is_valid 是布尔值，默认为 true（商品有效）
    const isValid = item.is_valid === true || item.is_valid === undefined;
    // 获取该商品的规格数据
    const specMap = item.specData?.map || {};

    // 使用 sku_id 作为规格ID去匹配
    let specs = [];
    if (item.sku_id && specMap && Object.keys(specMap).length > 0) {
      const skuIdStr = String(item.sku_id).trim();

      const specValue = specMap[skuIdStr];
      if (specValue) {
        specs.push({
          specId: skuIdStr,
          specValue: specValue,
          specName: specValue
        });
      }
    } else {

    }


    const goodsItem = {
      cart_id: item.cart_id,
      act_num_id: item.act_num_id,
      spuId: item.product_id,
      skuId: item.sku_id || null,
      title: item.name,
      thumb: item.main_image,
      price: parseFloat(item.size_money) || 0,
      quantity: item.quantity,
      stockQuantity: item.stock || 0,
      isSelected: true,
      is_valid: isValid,
      specs: specs,
      specInfo: specs,
    };

    if (isValid) {
      validGoodsList.push(goodsItem);
    } else {
      invalidGoodsList.push(goodsItem);
    }
  });

  const result = {
    goodsList: validGoodsList,
    invalidGoodsList: invalidGoodsList,
    isNotEmpty: validGoodsList.length > 0,
  };


  return result;
}
