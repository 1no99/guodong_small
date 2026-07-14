/* eslint-disable no-param-reassign */
/* eslint-disable no-nested-ternary */
import Toast from 'tdesign-miniprogram/toast/index';

Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true,
  },

  lifetimes: {
    attached() {
      const sys = wx.getSystemInfoSync();
      this._vpW = sys.windowWidth;
      this._vpH = Math.round(sys.windowHeight * 0.8);
      this._vpTop = Math.round(sys.windowHeight * 0.1);
    },
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
    imageScale: 1,
    imageTranslateX: 0,
    imageTranslateY: 0,
    swiperOffset: 0,
    swiperTransition: 'none',
    _touchStartTime: 0,
    _lastTapTime: 0,
    _touchStartX: 0,
    _touchStartY: 0,
    _initialDistance: 0,
    _initialScale: 1,
    _isScaling: false,
    _isSwiping: false,
    _swipeDir: '',
    _swipeHandled: false,
    _swiperBaseOffset: 0,
    _panStartX: 0,
    _panStartY: 0,
    _panStartTX: 0,
    _panStartTY: 0,
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
      const list = Object.values(sizeMap);
      this.setData({
        allSizeList: list,
      });
      // 默认选中第一个尺码
      if (list.length > 0) {
        const first = list[0];
        const colorItems = [];
        let actNumskey = ''
        let stock = ''
        for (const y of this.properties.details.spec_ids) {
          if (y.childName === first.childName) {
            colorItems.push(y);
            if(!actNumskey){
              actNumskey = y.parentName
              stock = y.stock
            }
          }
        }
        console.log(actNumskey);
        this.setData({
          actSizeNum: first.childName,
          ColorList: colorItems,
          actNum:actNumskey,
          stock:stock
        });
      }
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
        imageScale: 1,
        imageTranslateX: 0,
        imageTranslateY: 0,
        swiperOffset: -currentIndex * this._vpW,
        swiperTransition: 'none',
      });
    },

    closeImagePreview() {
      this.setData({ showImagePreview: false, imageScale: 1, imageTranslateX: 0, imageTranslateY: 0, swiperOffset: 0, swiperTransition: 'none' });
    },

    // 图片预览 - 触摸开始
    onPreviewTouchStart(e) {
      const touches = e.touches;
      if (touches.length === 2) {
        // 双指：记录初始距离和缩放比
        const dx = touches[1].clientX - touches[0].clientX;
        const dy = touches[1].clientY - touches[0].clientY;
        this._initialDistance = Math.sqrt(dx * dx + dy * dy);
        this._initialScale = this.data.imageScale;
        this._isScaling = true;
      } else if (touches.length === 1) {
        const now = Date.now();
        const touch = touches[0];
        // 双击检测
        if (now - this._lastTapTime < 300 &&
          Math.abs(touch.clientX - this._touchStartX) < 50 &&
          Math.abs(touch.clientY - this._touchStartY) < 50) {
          // 双击：切换缩放
          const { imageScale } = this.data;
          if (imageScale > 1.2) {
            // 还原
            this.setData({ imageScale: 1, imageTranslateX: 0, imageTranslateY: 0 });
          } else {
            // 放大到3倍，以点击位置为中心
            const newScale = 3;
            const cx = (touch.clientX - this._vpW / 2);
            const cy = (touch.clientY - this._vpTop - this._vpH / 2);
            const tx = -cx * (newScale - 1) / newScale;
            const ty = -cy * (newScale - 1) / newScale;
            this._clampAndSetTranslate(newScale, tx, ty);
            this.setData({ imageScale: newScale });
          }
          this._lastTapTime = 0;
          return;
        }
        this._lastTapTime = now;
        this._touchStartX = touch.clientX;
        this._touchStartY = touch.clientY;
        // 记录平移起点
        this._panStartX = touch.clientX;
        this._panStartY = touch.clientY;
        this._panStartTX = this.data.imageTranslateX;
        this._panStartTY = this.data.imageTranslateY;
      }
    },

    // 图片预览 - 触摸移动
    onPreviewTouchMove(e) {
      const touches = e.touches;
      if (touches.length === 2 && this._isScaling) {
        // 双指缩放
        const dx = touches[1].clientX - touches[0].clientX;
        const dy = touches[1].clientY - touches[0].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let newScale = this._initialScale * (distance / this._initialDistance);
        newScale = Math.max(1, Math.min(4, newScale));
        const cx = (touches[0].clientX + touches[1].clientX) / 2 - this._vpW / 2;
        const cy = (touches[0].clientY + touches[1].clientY) / 2 - this._vpTop - this._vpH / 2;
        const tx = -cx * (newScale - 1) / newScale;
        const ty = -cy * (newScale - 1) / newScale;
        this._clampAndSetTranslate(newScale, tx, ty);
        this.setData({ imageScale: newScale });
      } else if (touches.length === 1 && !this._isScaling) {
        const touch = touches[0];
        const dx = touch.clientX - this._touchStartX;
        const dy = touch.clientY - this._touchStartY;
        const scale = this.data.imageScale;

        if (!this._swipeDir) {
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            this._swipeDir = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
          }
        }

        if (this._swipeDir === 'h' && scale <= 1.05 && !this._swipeHandled) {
          this._isSwiping = true;
          let offset = this._swiperBaseOffset + dx;
          const listLen = this.data.previewImageList.length;
          const minOffset = -(listLen - 1) * this._vpW;
          if (offset > 0) offset = offset * 0.3;
          if (offset < minOffset) offset = minOffset + (offset - minOffset) * 0.3;
          this.setData({ swiperOffset: offset, swiperTransition: 'none' });
        } else if (scale > 1 && !this._isSwiping) {
          let tx = this._panStartTX + (touch.clientX - this._panStartX);
          let ty = this._panStartTY + (touch.clientY - this._panStartY);
          this._clampAndSetTranslate(scale, tx, ty);
        }
      }
    },

    // 图片预览 - 触摸结束
    onPreviewTouchEnd(e) {
      if (e.touches.length < 2) {
        this._isScaling = false;
      }

      if (this._isSwiping && !this._swipeHandled) {
        this._swipeHandled = true;
        const dx = this.data.swiperOffset - this._swiperBaseOffset;
        const listLen = this.data.previewImageList.length;
        let newIndex = this.data.previewImageIndex;

        if (Math.abs(dx) > 80) {
          if (dx < 0 && newIndex < listLen - 1) newIndex++;
          else if (dx > 0 && newIndex > 0) newIndex--;
        }

        this.setData({
          previewImageIndex: newIndex,
          swiperOffset: -newIndex * this._vpW,
          swiperTransition: 'transform 0.3s ease',
          imageScale: 1,
          imageTranslateX: 0,
          imageTranslateY: 0,
        });
        this._swiperBaseOffset = -newIndex * this._vpW;
        this._updatePreviewSku(newIndex);
      }

      this._isSwiping = false;
      this._swipeDir = '';
      this._swipeHandled = false;

      if (this.data.imageScale <= 1.05) {
        this.setData({ imageScale: 1, imageTranslateX: 0, imageTranslateY: 0 });
      }
    },

    // 预览层点击遮罩关闭
    onOverlayTap() {
      this.closeImagePreview();
    },

    // 边界约束
    _clampAndSetTranslate(scale, tx, ty) {
      const maxTx = Math.max(0, (this._vpW / 2) * (scale - 1) / scale);
      const maxTy = Math.max(0, (this._vpH / 2) * (scale - 1) / scale);
      this.setData({
        imageTranslateX: Math.max(-maxTx, Math.min(maxTx, tx)),
        imageTranslateY: Math.max(-maxTy, Math.min(maxTy, ty)),
      });
    },

    // 切换图片时更新SKU信息
    _updatePreviewSku(index) {
      const color = this.data.previewImageList[index];
      if (!color || color.parentName === this.data.actNum) return;
      this.setData({
        actNum: color.parentName,
        sizeMoney: color.price,
        stock: color.stock,
        iconImg: color.typeimg,
        actNumId: color.id,
        buyNum: 1,
      });
    },

    // 预览层加入购物车
    onPreviewAddCart(e) {
      if (e.currentTarget.dataset.type && e.currentTarget.dataset.type == '2') {
        this.addCart();
      }
    },

    // 阻止预览层穿透滚动
    preventMove() {},

    specsConfirm() {
      const { isStock } = this.properties;
      if (!isStock) return;
    
      this.triggerEvent('specsConfirm');
    },

    addCart() {
      const { isStock } = this.properties;
      if (!isStock) return;
      console.log(this.data);
      if(!this.data.actNum || !this.data.actSizeNum){
       return  Toast({
          context: this,
          selector: '#t-toast',
          message: '请选择规格尺码和颜色类型',
          icon: '',
          duration: 500,
        });
      }
      this.properties.selectedAttrStr = this.data.actNum+','+this.data.actSizeNum
      this.triggerEvent('addCart',{size:this.properties.selectedAttrStr,sizeMoney:this.data.sizeMoney?this.data.sizeMoney:this.properties.details.price,actNumId:this.data.actNumId});
    },

    buyNow() {
      const { isAllSelectedSku } = this.data;
      const { isStock } = this.properties;
      if (!isStock) return;
      if(!this.data.actNum || !this.data.actSizeNum){
        return  Toast({
           context: this,
           selector: '#t-toast',
           message: '请选择规格尺码和颜色类型',
           icon: '',
           duration: 1000,
         });
       }
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
