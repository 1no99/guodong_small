/* eslint-disable no-param-reassign */
/* eslint-disable no-nested-ternary */
import Toast from 'tdesign-miniprogram/toast/index';

Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true,
  },

  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(show) {
        if (show && this.properties.details && this.properties.details.spec_ids) {
          this.initAllSizeList();
        }
      },
    },
    selectedAttrStr:{
      type: String,
      value: '',
    },
    details: {
      type: Object,
      value: '',
    },
    isStock: {
      type: Boolean,
      value: true,
    },

    count: {
      type: Number,
      value: 1,
      observer(count) {
        this.setData({
          buyNum: count,
        });
      },
    },
  },

  initStatus: false,
  selectedSku: {},
  selectSpecObj: {},

  data: {
    actNum:null,
    actSizeNum:null,
    buyNum: 1,
    sizeMoney:null,
    SizeList:[],
    allSizeList:[],
    ColorList:[],
    checkType:[],
    SizeListNum:0,
    isAllSelectedSku: false,
    selectedSpecStr: '',
    selectedSpecIndex: -1,
    stock:0,
    actNumId:'',
    iconImg:'',
    showImagePreview: false,
    previewImageList: [],
    previewImageIndex: 0,
  },

  methods: {
    // 初始化所有尺码列表（弹窗打开时调用）
    initAllSizeList() {
      const specIds = this.properties.details.spec_ids || [];
      const sizeMap = {};
      specIds.forEach(item => {
        if (!sizeMap[item.childName]) {
          sizeMap[item.childName] = {
            childName: item.childName,
            stock: item.stock,
            typeimg: item.typeimg,
          };
        } else {
          sizeMap[item.childName].stock += item.stock;
        }
      });
      this.setData({
        allSizeList: Object.values(sizeMap),
      });
    },

    // 选尺码 → 关联出颜色
    showSizeList(row) {
      let FunInfo = row.currentTarget.dataset
      let arrDate = []
      for (let y of this.properties.details.spec_ids) {
        if (y.childName == FunInfo.name.childName) {
          arrDate.push(y)
        }
      }
      this.setData({
        actSizeNum: FunInfo.name.childName,
        ColorList: arrDate,
        actNum: '',
        sizeMoney: null,
        stock: 0,
        iconImg: '',
        actNumId: '',
      })
    },

    // 选颜色 → 确定最终SKU
    showGGList(row) {
      let FunInfo = row.currentTarget.dataset
      this.setData({
        actNum: FunInfo.name.parentName,
        sizeMoney: FunInfo.money,
        stock: FunInfo.name.stock,
        iconImg: FunInfo.name.typeimg,
        actNumId: FunInfo.name.id,
      })
    },
    checkSkuStockQuantity(specValueId, skuList) {
      let hasStock = false;
      const array = [];
      skuList.forEach((item) => {
        (item.specInfo || []).forEach((subItem) => {
          if (subItem.specValueId === specValueId && item.quantity > 0) {
            const subArray = [];
            (item.specInfo || []).forEach((specItem) => {
              subArray.push(specItem.specValueId);
            });
            array.push(subArray);
            hasStock = true;
          }
        });
      });
      return {
        hasStock,
        specsArray: array,
      };
    },

    onSpecTap(e) {
      const { index, specId } = e.currentTarget.dataset;
      const { selectedSpecIndex } = this.data;

      // 如果点击的是已选中的，则取消选中
      const newIndex = selectedSpecIndex === index ? -1 : index;

      this.setData({
        selectedSpecIndex: newIndex,
      });

      // 触发事件，通知父组件规格选择变化
      this.triggerEvent('specChange', {
        index: newIndex,
        specId: newIndex >= 0 ? this.properties.spec_ids[newIndex] : null,
        specName: newIndex >= 0 ? this.properties.specNames[newIndex] : null,
      });
    },

    flatten(input) {
      const stack = [...input];
      const res = [];
      while (stack.length) {
        const next = stack.pop();
        if (Array.isArray(next)) {
          stack.push(...next);
        } else {
          res.push(next);
        }
      }
      return res.reverse();
    },

    getIntersection(array, nextArray) {
      return array.filter((item) => nextArray.includes(item));
    },

    handlePopupHide() {
      this.triggerEvent('closeSpecsPopup', {
        show: false,
      });
    },

    previewImage() {
      const colorList = this.data.ColorList || [];
      const imageColors = colorList.filter(item => item.typeimg);
      if (imageColors.length === 0) {
        // 没有颜色图片，直接预览主图
        const url = this.data.iconImg || this.data.details.main_image;
        if (!url) return;
        wx.previewImage({ current: url, urls: [url] });
        return;
      }
      // 找到当前图片对应的索引
      let currentIndex = 0;
      if (this.data.iconImg) {
        const idx = imageColors.findIndex(item => item.typeimg === this.data.iconImg);
        if (idx >= 0) currentIndex = idx;
      } else if (this.data.actNum) {
        const idx = imageColors.findIndex(item => item.parentName === this.data.actNum);
        if (idx >= 0) currentIndex = idx;
      }
      this.setData({
        showImagePreview: true,
        previewImageList: imageColors,
        previewImageIndex: currentIndex,
      });
    },

    onPreviewSwiperChange(e) {
      const index = e.detail.current;
      const color = this.data.previewImageList[index];
      if (!color || color.parentName === this.data.actNum) return;
      // 自动选中该颜色类型（同 showGGList 逻辑）
      this.setData({
        previewImageIndex: index,
        actNum: color.parentName,
        sizeMoney: color.price,
        stock: color.stock,
        iconImg: color.typeimg,
        actNumId: color.id,
      });
    },

    closeImagePreview() {
      this.setData({ showImagePreview: false });
    },

    // 阻止预览层穿透滚动
    preventMove() {},

    // 阻止预览层点击关闭（仅点击遮罩关闭）
    preventClose() {},

    specsConfirm() {
      const { isStock } = this.properties;
      if (!isStock) return;
    
      this.triggerEvent('specsConfirm');
    },

    addCart() {
      const { isStock } = this.properties;
      if (!isStock) return;
      this.properties.selectedAttrStr = this.data.actNum+','+this.data.actSizeNum
      this.triggerEvent('addCart',{size:this.properties.selectedAttrStr,sizeMoney:this.data.sizeMoney?this.data.sizeMoney:this.properties.details.price,actNumId:this.data.actNumId});
    },

    buyNow() {
      const { isAllSelectedSku } = this.data;
      const { isStock } = this.properties;
      if (!isStock) return;
      this.triggerEvent('buyNow', {size:this.data.actNum+','+this.data.actSizeNum,sizeMoney:this.data.sizeMoney?this.data.sizeMoney:this.properties.details.price,actNumId:this.data.actNumId});
    },

    // 总处理
    setBuyNum(buyNum) {
      this.setData({
        buyNum,
      });
      this.triggerEvent('changeNum', {
        buyNum,
      });
    },

    handleBuyNumChange(e) {
      const { value } = e.detail;
      this.setData({
        buyNum: value,
      });
      // 通知父组件数量变化
      this.triggerEvent('changeNum', {
        buyNum: value,
      });
    },
  },
});
