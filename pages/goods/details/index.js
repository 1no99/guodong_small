import Toast from 'tdesign-miniprogram/toast/index';
import { fetchGood } from '../../../services/good/fetchGood';
import { fetchSpecList } from '../../../services/good/fetchSpec';
import { cdnBase } from '../../../config/index';
import { requireLogin } from '../../../utils/auth';
import { addToCart, getCartCount } from '../../../services/cart/cart';

const imgPrefix = `${cdnBase}/`;

const recLeftImg = `https://we-retail-static-1300977798.cos.ap-guangzhou.myqcloud.com/retail-mp/common/rec-left.png`;
const recRightImg = `https://we-retail-static-1300977798.cos.ap-guangzhou.myqcloud.com/retail-mp/common/rec-right.png`;

Page({
  data: {
    commentsList: [],
    commentsStatistics: {
      badCount: 0,
      commentCount: 0,
      goodCount: 0,
      goodRate: 0,
      hasImageCount: 0,
      middleCount: 0,
    },
    isShowPromotionPop: false,
    recLeftImg,
    recRightImg,
    details: {},
    goodsTabArray: [
      {
        name: '商品',
        value: '', // 空字符串代表置顶
      },
      {
        name: '详情',
        value: 'goods-page',
      },
    ],
    jumpArray: [
      {
        title: '首页',
        url: '/pages/home/home',
        iconName: 'home',
      },
      {
        title: '购物车',
        url: '/pages/cart/index',
        iconName: 'cart',
        showCartNum: true,
      },
    ],
    isStock: true,
    cartNum: 0,
    soldout: false,
    buttonType: 1,
    buyNum: 1,
    selectedAttrStr: '',
    primaryImage: '',
    specImg: '',
    isSpuSelectPopupShow: false,
    isAllSelectedSku: false,
    buyType: 0,
    outOperateStatus: false, // 是否外层加入购物车
    operateType: 0,
    selectSkuSellsPrice: 0,
    maxLinePrice: 0,
    minSalePrice: 0,
    maxSalePrice: 0,
    list: [],
    spuId: '',
    startprce:'',
    spec_ids: [],
    specNames: [],
    navigation: { type: 'fraction' },
    current: 0,
    autoplay: true,
    duration: 500,
    interval: 5000,
    selectedAttrStrName:'',
    soldNum: 0, // 已售数量
  },

  handlePopupHide() {
    this.setData({
      isSpuSelectPopupShow: false,
    });
  },

  handleSpecChange(e) {
    const { index, specId, specName } = e.detail;
    console.log('规格选择变化:', { index, specId, specName });

    // 更新已选规格字符串
    if (index >= 0 && specId) {
      this.setData({
        selectedAttrStr: specId,
        selectedAttrStrName: specName,
      });
    } else {
      this.setData({
        selectedAttrStr: '',
        selectedAttrStrName: "",

      });
    }
  },

  showSkuSelectPopup(type) {
    this.setData({
      buyType: type || 0,
      outOperateStatus: type >= 1,
      isSpuSelectPopupShow: true,
    });
  },

  buyItNow() {
    this.showSkuSelectPopup(1);
  },

  toAddCart() {
    this.showSkuSelectPopup(2);
  },

  toNav(e) {
    const { url } = e.detail;
    wx.switchTab({
      url: url,
    });
  },

  onPageScroll({ scrollTop }) {
    const goodsTab = this.selectComponent('#goodsTab');
    goodsTab && goodsTab.onScroll(scrollTop);
  },


  normalizeSkuTree(skuTree) {
    const normalizedTree = {};
    skuTree.forEach((treeItem) => {
      normalizedTree[treeItem.specId] = treeItem.specValueList;
    });
    return normalizedTree;
  },



  addCart(val) {
    // 检查登录状态
    if (!requireLogin({ force: true })) {
      // 未登录，已自动跳转到登录页
      return;
    }

    const { selectedAttrStr, actNumId, buyNum, details, spuId } = this.data;
console.log(val);
    if (!val.detail.size) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择规格',
        icon: '',
        duration: 1000,
      });
      return;
    }

    // 调用添加购物车API
    addToCart({
      productId: spuId || details.spuId || details.id,
      skuId: val.detail.size,
      quantity: buyNum || 1,
      sizeMoney: val.detail.sizeMoney,
      actNumId: val.detail.actNumId,
    })
      .then(() => {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '已加入购物车',
          icon: '',
          duration: 500,
        });

        // 更新购物车数量

        // 关闭弹窗
        // this.handlePopupHide();
      })
      .catch((error) => {
        Toast({
          context: this,
          selector: '#t-toast',
          message: error.message || '添加失败',
          icon: '',
          duration: 2000,
        });
      });
  },



  gotoBuy(val) {
    console.log(122222222);
    // 检查登录状态
    if (!requireLogin({ force: true })) {
      // 未登录，已自动跳转到登录页
      return;
    }

    const { selectedAttrStr, selectedAttrStrName, buyNum, details } = this.data;
    if (!val.detail.size)  {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择规格',
        icon: '',
        duration: 1000,
      });
      return;
    }

    this.handlePopupHide();

    // 构建商品数据
    const goodsData = {
      actNumId: val.detail.actNumId,
      id: details.spuId || details.id,
      title: details.title,
      image: details.primaryImage || details.thumb,
      price: val.detail.sizeMoney,
      quantity: buyNum || 1,
      specName: val.detail.size,
    };

    // 跳转到订单确认页面
    wx.navigateTo({
      url: `/pages/order/confirm/index?goodsData=${encodeURIComponent(JSON.stringify(goodsData))}`,
    });
  },

  specsConfirm() {
    const { buyType } = this.data;
    if (buyType === 1) {
      this.gotoBuy();
    } else {
      this.addCart();
    }
    // this.handlePopupHide();
  },

  changeNum(e) {
    this.setData({
      buyNum: e.detail.buyNum,
    });
  },

  closePromotionPopup() {
    this.setData({
      isShowPromotionPop: false,
    });
  },

  showPromotionPopup() {
    this.setData({
      isShowPromotionPop: true,
    });
  },

  getDetail(spuId) {
    // 同时加载商品详情、活动列表和规格列表
    Promise.all([
      fetchGood(spuId),
    ]).then((res) => {
      let DetailInfo = res[0]
      DetailInfo.spec_idsName = []
      for(let y of DetailInfo.spec_ids){
        DetailInfo.spec_idsName.push(y.parentName)
      }
      DetailInfo.spec_idsName = [...new Set(DetailInfo.spec_idsName)]
      this.setData({
        details:DetailInfo,
        startprce:DetailInfo.spec_ids.length>0?DetailInfo.spec_ids[0].price:'0'
      })
      console.log(DetailInfo);
    }).catch((err) => {
      wx.showToast({
        title: '加载商品详情失败',
        icon: 'none',
      });
    });
  },

  onLoad(query) {
    const { spuId } = query;
    this.setData({
      spuId: spuId,
    });
    this.getDetail(spuId);
    // 加载购物车数量
  },

  onShow() {
    // 每次显示页面时更新购物车数量
  },
});
