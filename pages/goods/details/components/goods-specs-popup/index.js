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
    checkType:[],
    SizeListNum:0,
    isAllSelectedSku: false,
    selectedSpecStr: '',
    selectedSpecIndex: -1,
    stock:0,
    actNumId:'',
    iconImg:''
  },

  methods: {
    showGGList(row){
      console.log(row);
      let FunInfo = row.currentTarget.dataset
      let arrDate = []
      for(let y of this.properties.details.spec_ids){
        if(y.parentName == FunInfo.name){
          arrDate.push(y)
        }
      }
      
      this.setData({
        actNum:FunInfo.name,
        SizeList:arrDate,
        actSizeNum:''
      })
      console.log(this.data);
    },
    showSizeList(row){
      let FunInfo = row.currentTarget.dataset
      console.log(FunInfo);
      this.setData({
        sizeMoney:FunInfo.money,
        actSizeNum:FunInfo.name.childName,
        stock:FunInfo.name.stock,
        iconImg:FunInfo.name.typeimg,
        actNumId:FunInfo.name.id
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
      const url = this.data.iconImg || this.data.details.main_image;
      if (!url) return;
      wx.previewImage({
        current: url,
        urls: [url],
      });
    },

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
