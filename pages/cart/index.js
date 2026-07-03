import Dialog from 'tdesign-miniprogram/dialog/index';
import Toast from 'tdesign-miniprogram/toast/index';
import { fetchCartGroupData, updateCartItem, removeFromCart, clearCart } from '../../services/cart/cart';

Page({
  data: {
    cartGroupData: null,
  },

  // 调用自定义tabbar的init函数，使页面与tabbar激活状态保持一致
  onShow() {
    this.getTabBar().init();
    // 每次显示页面时重新加载购物车数据
    this.refreshData();
  },

  onLoad() {
    // this.refreshData();
  },

  refreshData() {
    return fetchCartGroupData().then((cartGroupData) => {
      console.log(cartGroupData);
      // 确保 cartGroupData 结构正确
      if (!cartGroupData || typeof cartGroupData !== 'object') {
        this.setData({
          cartGroupData: {
            goodsList: [],
            isNotEmpty: false,
            isAllSelected: false,
            totalAmount: '0.00',
            selectedGoodsCount: 0,
          }
        });
        return;
      }

      // 确保 goodsList 是数组
      if (!Array.isArray(cartGroupData.goodsList)) {
        cartGroupData.goodsList = [];
      }

     

      // 计算购物车统计数据
      let totalAmount = 0;
      let selectedGoodsCount = 0;
      let isAllSelected = true;

      if (cartGroupData.goodsList.length === 0) {
        isAllSelected = false;
      } else {
        cartGroupData.goodsList.forEach((goods) => {
          if (goods.isSelected) {
            totalAmount += goods.price * goods.quantity;
            selectedGoodsCount += goods.quantity;
          } else {
            isAllSelected = false;
          }
        });
      }

      cartGroupData.isAllSelected = isAllSelected;
      cartGroupData.totalAmount = totalAmount.toFixed(2);
      cartGroupData.selectedGoodsCount = selectedGoodsCount;
      for(let y of cartGroupData.goodsList){
        y.specInfo = y.skuId?y.skuId.split(','):[]
        y.act_num_id = y.act_num_id
      }
      console.log(cartGroupData);
      this.setData({ cartGroupData });
    }).catch((error) => {
      this.setData({
        cartGroupData: {
          goodsList: [],
          isNotEmpty: false,
          isAllSelected: false,
          totalAmount: '0.00',
          selectedGoodsCount: 0,
        }
      });
    });
  },

  findGoods(spuId, skuId) {
    const { goodsList } = this.data.cartGroupData;
    for (const goods of goodsList) {
      if (goods.spuId === spuId && goods.skuId === skuId) {
        return { currentGoods: goods };
      }
    }
    return { currentGoods: null };
  },

  findGoodsByCartId(cartId) {
    const { goodsList } = this.data.cartGroupData;
    // 先在有效商品中查找
    for (const goods of goodsList) {
      if (goods.cart_id === cartId) {
        return { currentGoods: goods };
      }
    }
    return { currentGoods: null };
  },

  // 选择单个商品（前端状态管理，不调用后端）
  selectGoodsService({ spuId, skuId, isSelected }) {
    const { currentGoods } = this.findGoods(spuId, skuId);
    currentGoods.isSelected = isSelected;
    // 更新视图
    this.setData({
      cartGroupData: this.data.cartGroupData
    });
    return Promise.resolve();
  },

  // 全选商品
  selectAllService({ isSelected }) {
    const { goodsList } = this.data.cartGroupData;
    goodsList.forEach((goods) => {
      goods.isSelected = isSelected;
    });
    return Promise.resolve();
  },

  // 加购数量变更
  changeQuantityService({ spuId, skuId, quantity }) {
    const { currentGoods } = this.findGoods(spuId, skuId);
    return updateCartItem(currentGoods.cart_id, quantity)
      .then(() => {
        currentGoods.quantity = quantity;
        return Promise.resolve();
      })
      .catch((error) => {
        Toast({
          context: this,
          selector: '#t-toast',
          message: error.message || '更新数量失败',
          icon: '',
        });
        return Promise.reject(error);
      });
  },


  onGoodsSelect(e) {
    const goods = e.currentTarget.dataset.goods;
    const { spuId, skuId } = goods;
    const { currentGoods } = this.findGoods(spuId, skuId);
    const isSelected = !currentGoods.isSelected;
    this.selectGoodsService({ spuId, skuId, isSelected }).then(() => {
      this.updateCartStatistics();
    });
  },

  // 更新购物车统计数据
  updateCartStatistics() {
    const { cartGroupData } = this.data;
    let totalAmount = 0;
    let selectedGoodsCount = 0;
    let isAllSelected = true;

    if (!cartGroupData.goodsList || cartGroupData.goodsList.length === 0) {
      isAllSelected = false;
    } else {
      cartGroupData.goodsList.forEach((goods) => {
        if (goods.isSelected) {
          totalAmount += goods.price * goods.quantity;
          selectedGoodsCount += goods.quantity;
        } else {
          isAllSelected = false;
        }
      });
    }

    cartGroupData.isAllSelected = isAllSelected;
    cartGroupData.totalAmount = totalAmount.toFixed(2);
    cartGroupData.selectedGoodsCount = selectedGoodsCount;

    this.setData({ cartGroupData });
  },

  onSelectAll() {
    const currentIsAllSelected = this.data.cartGroupData?.isAllSelected || false;
    const newIsAllSelected = !currentIsAllSelected;
    // 更新所有商品的选中状态
    if (this.data.cartGroupData?.goodsList) {
      this.data.cartGroupData.goodsList.forEach((goods) => {
        goods.isSelected = newIsAllSelected;
      });
    }

    this.updateCartStatistics();
  },

  onStepperChange(e) {
    const { type } = e.currentTarget.dataset;
    const goods = e.currentTarget.dataset.goods;
    const { spuId, skuId } = goods;
    const { currentGoods } = this.findGoods(spuId, skuId);

    let newQuantity = currentGoods.quantity;
    if (type === 'minus') {
      newQuantity = Math.max(1, newQuantity - 1);
    } else if (type === 'plus') {
      newQuantity = newQuantity + 1;
    }

    const stockQuantity = currentGoods.stockQuantity > 0 ? currentGoods.stockQuantity : 0;

    // 加购数量超过库存数量
    if (newQuantity > stockQuantity) {
      if (currentGoods.quantity === stockQuantity && newQuantity - stockQuantity === 1) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '当前商品库存不足',
          icon: '',
        });
        return;
      }
      Dialog.confirm({
        context: this,
        selector: '#t-dialog',
        title: '商品库存不足',
        content: `当前商品库存不足，最大可购买数量为${stockQuantity}件`,
        confirmBtn: '修改为最大可购买数量',
        cancelBtn: '取消',
      })
        .then(() => {
          this.changeQuantityService({
            spuId,
            skuId,
            quantity: stockQuantity,
          }).then(() => this.refreshData());
        })
        .catch(() => {});
      return;
    }

    this.changeQuantityService({ spuId, skuId, quantity: newQuantity }).then(() => this.refreshData());
  },

  onStoreSelect(e) {
    const {
      store: { storeId },
      isSelected,
    } = e.detail;
    this.selectStoreService({ storeId, isSelected }).then(() => this.refreshData());
  },

  goCollect() {
    // 促销详情页已移除
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
    });
  },

  goGoodsDetail(e) {
    const quantity = e.currentTarget.dataset.spuid;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${quantity}`,
    });
  },

  clearInvalidGoods() {
    // 实际场景时应该调用接口清空失效商品
    this.clearInvalidGoodsService().then(() => this.refreshData());
  },

  onGoodsDelete(e) {
    const goods = e.currentTarget.dataset.goods;
    console.log(goods);
    const { cart_id } = goods;
    Dialog.confirm({
      context: this,
      selector: '#t-dialog',
      content: '确认删除该商品吗?',
      confirmBtn: '确定',
      cancelBtn: '取消',
    }).then(() => {
      removeFromCart(cart_id).then(() => {
        Toast({ context: this, selector: '#t-toast', message: '商品删除成功' });
        this.refreshData();
      });
    });
  },

  onToSettle() {
    const goodsRequestList = [];
    const selectedCount = this.data.cartGroupData?.selectedGoodsCount || 0;
    if (selectedCount === 0) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先选择商品',
        icon: '',
      });
      return;
    }

    this.data.cartGroupData.goodsList.forEach((goods) => {
      if (goods.isSelected === true) {
        goodsRequestList.push(goods);
      }
    });
    console.log(goodsRequestList,this.data.cartGroupData.goodsList);
    wx.setStorageSync('cart.selectedGoods', JSON.stringify(goodsRequestList));
    const url = '/pages/order/confirm/index?from=cart';
    wx.navigateTo({ url });
  },
  onGotoHome() {
    wx.switchTab({ url: '/pages/category/index' });
  },
});
