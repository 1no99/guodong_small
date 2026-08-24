import Dialog from 'tdesign-miniprogram/dialog/index';
import Toast from 'tdesign-miniprogram/toast/index';
import { fetchCartGroupData, updateCartItem, removeFromCart, clearCart } from '../../services/cart/cart';

Page({
  data: {
    cartGroupData: null,
    loading: true,
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
      // 计算购物车统计数据
      let totalAmount = 0;
      let selectedGoodsCount = 0;
      let isAllSelected = true;

      if (cartGroupData.goodsList.length === 0) {
        isAllSelected = false;
      } else {
        cartGroupData.goodsList.forEach((goods) => {
          if (goods.isSelected) {
            totalAmount += goods.good_type[0].price * goods.quantity;
            selectedGoodsCount += goods.quantity;
          } else {
            isAllSelected = false;
          }
        });
      }

      cartGroupData.isAllSelected = isAllSelected;
      cartGroupData.totalAmount = totalAmount.toFixed(2);
      cartGroupData.selectedGoodsCount = selectedGoodsCount;
    
      this.setData({ cartGroupData, loading: false });
    }).catch((error) => {
      this.setData({
        cartGroupData: {
          goodsList: [],
          isNotEmpty: false,
          isAllSelected: false,
          totalAmount: '0.00',
          selectedGoodsCount: 0,
        },
        loading: false,
      });
    });
  },

  findGoods(product_id, act_num_id) {
    const { goodsList } = this.data.cartGroupData;
    for (const goods of goodsList) {
      if (goods.product_id === product_id && goods.act_num_id === act_num_id) {
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
  selectGoodsService({ product_id, act_num_id, isSelected }) {
    const { currentGoods } = this.findGoods(product_id, act_num_id);
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
  changeQuantityService({  product_id, act_num_id, quantity }) {
    //console.log( product_id, act_num_id, quantity);
    const { currentGoods } = this.findGoods( product_id, act_num_id);
    //console.log(currentGoods);
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


  // 预览商品大图
  onPreviewImage(e) {
    const src = e.currentTarget.dataset.src;
    if (!src) return;
    wx.previewImage({
      current: src,
      urls: [src],
    });
  },

  onGoodsSelect(e) {
    const goods = e.currentTarget.dataset.goods;
    //console.log(goods);
    const { act_num_id, product_id } = goods;
    //console.log(act_num_id, product_id);
    const { currentGoods } = this.findGoods(product_id, act_num_id );
    //console.log(currentGoods);
    const isSelected = !currentGoods.isSelected;
    this.selectGoodsService({  act_num_id, product_id , isSelected }).then(() => {
      //console.log(this.data.cartGroupData);
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
          //console.log(goods);
          totalAmount += goods.good_type[0].price * goods.quantity;
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
    const { product_id, act_num_id } = goods;
    const { currentGoods } = this.findGoods(product_id, act_num_id);

    let newQuantity = currentGoods.quantity;
    if (type === 'minus') {
      newQuantity = Math.max(1, newQuantity - 1);
    } else if (type === 'plus') {
      newQuantity = newQuantity + 1;
    }

    const stockQuantity = currentGoods.good_type[0].stock > 0 ? currentGoods.good_type[0].stock : 0;

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
        confirmBtn: '最大可购买数量',
        cancelBtn: '取消',
      })
        .then(() => {
          this.changeQuantityService({
            product_id, act_num_id,
            quantity: stockQuantity,
          }).then(() => this.refreshData());
        })
        .catch(() => {});
      return;
    }
    //console.log(product_id, act_num_id,newQuantity);
    this.changeQuantityService({ product_id, act_num_id, quantity: newQuantity }).then(() => this.refreshData());
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
    //console.log(e);
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
    //console.log(goods);
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
  onGoodsDeletefalse(e) {
   for(let y of this.data.cartGroupData.invalidGoodsList)
      removeFromCart(y.cart_id).then(() => {
        this.refreshData();
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
    //console.log(goodsRequestList,this.data.cartGroupData.goodsList);
    let cartIds = []
    for(let y of goodsRequestList){
      cartIds.push({
        act_num_id: y.act_num_id,
        cartId: y.cart_id,
        id:y.product_id,
        title: y.name,
        image: y.typeimg,
        price: y.good_type[0].price,
        quantity: y.quantity,
        spec:y.sku_id,
      })
    }
    wx.setStorage({
      key: "cart.selectedGoods",
      data: JSON.stringify(cartIds),
      success: () => {}
    })
    const url = '/pages/order/confirm/index?from=cart';
    wx.navigateTo({ url });
  },
  onGotoHome() {
    wx.switchTab({ url: '/pages/category/index' });
  },
});
