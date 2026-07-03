import { fetchDeliveryAddressList } from '../../../services/address/fetchAddress';
import { dispatchCommitPay } from '../../../services/order/orderConfirm';
import { removeFromCart } from '../../../services/cart/cart';
// 使用存储来共享地址选择数据
const ADDRESS_STORAGE_KEY = 'selected_address_for_order';
const GOODS_STORAGE_KEY = 'order_confirm_goods_data';


Page({
  data: {
    // 商品列表（支持多个商品）
    goodsList: [],

    // 收货地址
    addressInfo: null,
    addressList: [],

    // 订单备注
    remark: '',

    // 价格信息
    totalPrice: 0,
    totalPriceStr: '0.00',
    goodsAmountStr: '0.00',
    goodsCount: 0,
    _orderResult:'',
    // 成功弹窗
    showSuccessModal: false,
  },

  onLoad(options) {
    const { from } = options;
    console.log('订单确认页面加载，来源:', from);

    if (from === 'cart') {
      // 从购物车结算过来
      this.loadCartData();
    } else if (options.goodsData) {
      // 从商品详情页直接购买
      this.loadSingleGoodsData(options.goodsData);
    } else {
      // 尝试从本地存储恢复
      this.restoreFromStorage();
    }

    // 加载收货地址
    // this.loadAddressList();
  },

  // 加载购物车数据
  loadCartData() {
    console.log(12311);
    try {
      const cartGoodsStr = wx.getStorageSync('cart.selectedGoods');
      if (!cartGoodsStr) {
        wx.showToast({
          title: '购物车数据丢失',
          icon: 'none',
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }

      const goodsList = JSON.parse(cartGoodsStr);
      console.log('购物车商品列表:', goodsList);

      // 转换数据格式
      const formattedGoodsList = goodsList.map(goods => ({
        act_num_id: goods.act_num_id,
        id: goods.spuId,
        cartId: goods.cart_id,
        title: goods.title,
        image: goods.thumb,
        price: goods.price,
        quantity: goods.quantity,
        spec:goods.specInfo.join(),
        // specList: goods.spec.split(',') || [],
      }));

      this.calculatePrice(formattedGoodsList);
    } catch (err) {
      console.error('加载购物车数据失败:', err);
      wx.showToast({
        title: '数据错误',
        icon: 'none',
      });
    }
  },

  // 加载单个商品数据
  loadSingleGoodsData(goodsDataStr) {
    try {
      const goods = JSON.parse(decodeURIComponent(goodsDataStr));
      console.log(goods);
      const goodsList = [{
        act_num_id: goods.actNumId,
        id: goods.id,
        title: goods.title,
        image: goods.image,
        price: goods.price,
        quantity: goods.quantity,
        spec: goods.specName || '',
        specList: goods.specList || [],
      }];

      this.calculatePrice(goodsList);
    } catch (err) {
      console.error('解析商品数据失败:', err);
      wx.showToast({
        title: '数据错误',
        icon: 'none',
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 从本地存储恢复
  restoreFromStorage() {
    const savedData = wx.getStorageSync(GOODS_STORAGE_KEY);
    if (savedData) {
      console.log('从本地存储恢复数据:', savedData);
      this.setData({
        goodsList: savedData.goodsList,
        totalPrice: savedData.totalPrice,
        totalPriceStr: savedData.totalPriceStr,
        goodsAmountStr: savedData.goodsAmountStr,
        goodsCount: savedData.goodsCount,
      });
    }
  },

  // 计算价格
  calculatePrice(goodsList) {
    let totalPrice = 0;
    let goodsCount = 0;

    goodsList.forEach(goods => {
      totalPrice += goods.price * goods.quantity;
      goodsCount += goods.quantity;
    });

    const totalPriceStr = totalPrice.toFixed(2);
    const goodsAmountStr = totalPrice.toFixed(2);

    const data = {
      goodsList,
      totalPrice,
      totalPriceStr,
      goodsAmountStr,
      goodsCount,
    };

    // 保存到本地存储
    wx.setStorageSync(GOODS_STORAGE_KEY, data);

    this.setData(data);
  },

  onShow() {
    console.log('===== onShow 被调用 =====');
    // 检查是否有从地址列表返回的地址数据
    const selectedAddress = wx.getStorageSync(ADDRESS_STORAGE_KEY);
    if (selectedAddress) {
      // 先清除存储
      wx.removeStorageSync(ADDRESS_STORAGE_KEY);

      // 创建一个新的地址对象，确保响应式
      const newAddress = {
        id: selectedAddress.id,
        userName: selectedAddress.userName,
        phoneNumber: selectedAddress.phoneNumber,
        address: selectedAddress.address,
        tag: selectedAddress.tag,
        isDefault: selectedAddress.isDefault,
      };
      this.setData({
        addressInfo: newAddress,
      }, () => {
      
      });
    } else {
      console.log('存储中没有地址数据');
    }

    // 确保商品数据存在，如果丢失则从本地存储恢复
    if (!this.data.goodsList || this.data.goodsList.length === 0) {
      const savedData = wx.getStorageSync(GOODS_STORAGE_KEY);
      if (savedData) {
        console.log('从本地存储恢复商品数据:', savedData);
        this.setData({
          goodsList: savedData.goodsList,
          totalPrice: savedData.totalPrice,
          totalPriceStr: savedData.totalPriceStr,
          goodsAmountStr: savedData.goodsAmountStr,
          goodsCount: savedData.goodsCount,
        });
      }
    }

    console.log('===== onShow 结束 =====');
  },

  // 加载收货地址列表
  loadAddressList() {
    fetchDeliveryAddressList().then((list) => {
      if (list && Array.isArray(list)) {
        // 只在 addressInfo 为空时才设置默认地址
        // 避免覆盖用户从地址列表选择的地址
        if (!this.data.addressInfo) {
          // const defaultAddress = list.find((addr) => addr.isDefault) || list[0] || null;
          // console.log('设置默认地址:', defaultAddress);
          // this.setData({
          //   addressList: list,
          //   addressInfo: defaultAddress,
          // });
        } else {
          console.log('已有地址信息，不设置默认地址');
          this.setData({
            addressList: list,
          });
        }
      }
    }).catch((err) => {
      console.error('获取地址列表失败:', err);
    });
  },

  // 选择收货地址
  chooseAddress() {
    wx.navigateTo({
      url: `/pages/user/address/list/index?from=confirm`,
    });
  },

  // 数量变化
  onQuantityChange(e) {
    const index = e.currentTarget.dataset.index;  // 从 dataset 获取 index
    const value = e.detail.value;  // 从 detail 获取 value（TDesign stepper 的值）
    const goodsList = [...this.data.goodsList];

    console.log(`商品 ${index} 数量变化: ${value}`);

    goodsList[index].quantity = value;

    this.calculatePrice(goodsList);
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value,
    });
  },

  // 提交订单
  submitOrder() {
    const { addressInfo, goodsList } = this.data;

    // 检查是否选择了收货地址
    if (!addressInfo) {
      wx.showToast({
        title: '请选择收货地址',
        icon: 'none',
      });
      return;
    }

    // 检查商品列表
    if (!goodsList || goodsList.length === 0) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none',
      });
      return;
    }

    console.log('提交订单:', {
      addressInfo,
      goodsList,
      totalPrice: this.data.totalPrice,
      remark: this.data.remark,
    });

    //显示加载提示
    wx.showLoading({
      title: '提交中...',
      mask: true,
    });

    // 准备订单数据
    const orderData = {
      addressId: addressInfo.id,
      items: goodsList.map(g => ({
        act_num_id: g.act_num_id,
        spuId: g.id,
        productId: g.id,
        quantity: g.quantity,
        price: g.price,
        spec:g.spec
      })),
      remark: this.data.remark,
      totalAmount: this.data.totalPrice,
    };

    console.log('订单数据:', orderData,goodsList);
    // return
    dispatchCommitPay(orderData)
    .then((result) => {
      console.log('订单创建成功 ===>', result);
      wx.hideLoading();
    
      // 先清购物车
      const cartGoodsStr = wx.getStorageSync('cart.selectedGoods');
      if (cartGoodsStr) {
        try {
          const cartGoods = JSON.parse(cartGoodsStr);
          Promise.all(
            cartGoods.map(goods => 
              removeFromCart(goods.cart_id).catch(() => {})
            )
          ).then(() => {
            wx.removeStorageSync('cart.selectedGoods');
          });
        } catch (e) {}
      }
    
      // 保存订单信息用于分享
      this._orderResult = result.tradeNo;

      // 显示自定义成功弹窗
      this.setData({ showSuccessModal: true,_orderResult : result.tradeNo });
    
    })
    .catch((error) => {
      console.error('订单创建失败 ===>', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '订单创建失败',
        icon: 'none',
        duration: 3000
      });
    });
  },

  closeSuccessModal() {
    this.setData({ showSuccessModal: false });
  },

  goOrderList() {
    this.setData({ showSuccessModal: false });
    wx.redirectTo({ url: '/pages/order/order-list/index' });
  },

  onShareOrder() {
    const orderNo = this.data._orderResult || '';
     // 获取用户手机号
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = userInfo.phone || '';
    const text = `订单编号：${orderNo}\n下单人手机号：${phone}`;
    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({
          title: '已复制到剪切板',
          icon: 'success',
        });
      },
    });
  },

  onUnload() {
    // 页面卸载时清除商品数据本地存储
    wx.removeStorageSync(GOODS_STORAGE_KEY);
  },
});
