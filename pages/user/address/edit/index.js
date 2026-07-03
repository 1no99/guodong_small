import Toast from 'tdesign-miniprogram/toast/index';
import { fetchDeliveryAddress, createAddress, updateAddress } from '../../../../services/address/fetchAddress';
// import { areaData } from 'http://106.54.55.38/ads.js';
import { resolveAddress, rejectAddress } from '../../../../services/address/list';

const innerPhoneReg = '^1(?:3\\d|4[4-9]|5[0-35-9]|6[67]|7[0-8]|8\\d|9\\d)\\d{8}$';
const innerNameReg = '^[a-zA-Z\\d\\u4e00-\\u9fa5]+$';


Page({
  options: {
    multipleSlots: true,
  },
  externalClasses: ['theme-wrapper-class'],
  data: {
    locationState: {
      cityName: '',
      cityCode: '',
      countryName: '',
      detailAddress: '',
      districtName: '',
      districtCode: '',
      isDefault: false,
      name: '',
      phone: '',
      provinceCode: '',
      provinceName: '',
    },
    areaPickerVisible:false,
    isFromOrder: false,
    areaData:[],
  },
  privateData: {
    verifyTips: '',
  },
  onLoad(options) {
    const { id, from = '' } = options;
    const isFromOrder = from === 'confirm';
    const that = this;
    wx.request({
      url: 'https://guodongyichu.fun/ads.json',
      success(res) {
        console.log(res.data.provinces);
        try {
          that.setData({
            isFromOrder: isFromOrder,
            areaData: res.data.provinces,
          });
          console.log(that.data.areaData);
        } catch (e) {
          console.error('解析 areaData 失败:', e);
        }
      },
      fail(err) {
        console.error('请求 areaData 失败:', err);
      }
    })
    this.init(id);
  },
  onShow() {

  },
  onUnload() {
    if (!this.hasSava) {
      rejectAddress();
    }

  },

  hasSava: false,

  init(id) {
    if (id) {
      // 编辑模式：获取地址详情
      this.getAddressDetail(Number(id));
    }
  },
  getAddressDetail(id) {
    fetchDeliveryAddress(id).then((detail) => {
      // 确保设置 addressId 字段
      const locationState = {
        ...detail,
        addressId: detail.id,
      };
      this.setData({ locationState }, () => {
        const { isLegal, tips } = this.onVerifyInputLegal();
        this.setData({
          submitActive: isLegal,
        });
        this.privateData.verifyTips = tips;
      });
    });
  },
  onInputValue(e) {
    const { item } = e.currentTarget.dataset;
    if (item === 'address') {
      // 处理省市区选择
      const { selectedOptions = [] } = e.detail;
      this.setData(
        {
          'locationState.provinceCode': selectedOptions[0].value,
          'locationState.provinceName': selectedOptions[0].label,
          'locationState.cityName': selectedOptions[1].label,
          'locationState.cityCode': selectedOptions[1].value,
          'locationState.districtCode': selectedOptions[2].value,
          'locationState.districtName': selectedOptions[2].label,
          areaPickerVisible: false,
        }
      );
    }
  },

  onInputChange(e) {
    const { item } = e.currentTarget.dataset;
    const { value } = e.detail;

    // 根据不同的 item 更新对应的字段
    const updateData = {};
    updateData[`locationState.${item}`] = value;
    this.setData(updateData);
  },
  onPickArea() {
    this.setData({ areaPickerVisible: true });
  },

  onCheckDefaultAddress({ detail }) {
    const { value } = detail;
    this.setData({
      'locationState.isDefault': value,
    });
  },

  onVerifyInputLegal() {
    const { name, phone, detailAddress, districtName } = this.data.locationState;
    const prefixPhoneReg = String(this.properties.phoneReg || innerPhoneReg);
    const prefixNameReg = String(this.properties.nameReg || innerNameReg);
    const nameRegExp = new RegExp(prefixNameReg);
    const phoneRegExp = new RegExp(prefixPhoneReg);

    if (!name || !name.trim()) {
      return {
        isLegal: false,
        tips: '请填写收货人',
      };
    }
    if (!nameRegExp.test(name)) {
      return {
        isLegal: false,
        tips: '收货人仅支持输入中文、英文（区分大小写）、数字',
      };
    }
    if (!phone || !phone.trim()) {
      return {
        isLegal: false,
        tips: '请填写手机号',
      };
    }
    if (!phoneRegExp.test(phone)) {
      return {
        isLegal: false,
        tips: '请填写正确的手机号',
      };
    }
    if (!districtName || !districtName.trim()) {
      return {
        isLegal: false,
        tips: '请选择省市区信息',
      };
    }
    if (!detailAddress || !detailAddress.trim()) {
      return {
        isLegal: false,
        tips: '请完善详细地址',
      };
    }
    if (detailAddress && detailAddress.trim().length > 50) {
      return {
        isLegal: false,
        tips: '详细地址不能超过50个字符',
      };
    }
    return {
      isLegal: true,
      tips: '添加成功',
    };
  },

  builtInSearch({ code, name }) {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (res) => {
          if (res.authSetting[code] === false) {
            wx.showModal({
              title: `获取${name}失败`,
              content: `获取${name}失败，请在【右上角】-小程序【设置】项中，将【${name}】开启。`,
              confirmText: '去设置',
              confirmColor: '#FA550F',
              cancelColor: '取消',
              success(res) {
                if (res.confirm) {
                  wx.openSetting({
                    success(settingRes) {
                      if (settingRes.authSetting[code] === true) {
                        resolve();
                      } else {
                        console.warn('用户未打开权限', name, code);
                        reject();
                      }
                    },
                  });
                } else {
                  reject();
                }
              },
              fail() {
                reject();
              },
            });
          } else {
            resolve();
          }
        },
        fail() {
          reject();
        },
      });
    });
  },
  formSubmit() {

    const { locationState } = this.data;

    // 显示加载提示
    wx.showLoading({
      title: '保存中...',
      mask: true,
    });
    console.log(locationState);
    // 构建地址数据
    const addressData = {
      name: locationState.name,
      phone: locationState.phone,
      provinceName: locationState.provinceName,
      cityName: locationState.cityName,
      districtName: locationState.districtName,
      detailAddress: locationState.detailAddress,
      isDefault: locationState.isDefault,
      user_phone: wx.getStorageSync('userInfo').phone
    };

    // 判断是创建还是更新
    const promise = locationState.addressId
      ? updateAddress(locationState.addressId, addressData)
      : createAddress(addressData);

    promise
      .then((result) => {
        wx.hideLoading();
        this.hasSava = true;

        Toast({
          context: this,
          selector: '#t-toast',
          message: locationState.addressId ? '更新成功' : '添加成功',
          theme: 'success',
        });

        // 通知地址列表刷新
        // resolveAddress(returnAddress);
        const { isFromOrder } = this.data;
        let url = isFromOrder ? `/pages/user/address/list/index?from=confirm` : `/pages/user/address/list/index`
        wx.navigateTo({
          url: url
        })
        // setTimeout(() => {
        //   wx.navigateBack({ delta: 1 });
        // }, 100);
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('保存地址失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: err.message || '保存失败，请重试',
          theme: 'error',
        });
      });
  },

  getWeixinAddress(e) {
    const { locationState } = this.data;
    const weixinAddress = e.detail;
    this.setData(
      {
        locationState: { ...locationState, ...weixinAddress },
      },
      () => {
        const { isLegal, tips } = this.onVerifyInputLegal();
        this.setData({
          submitActive: isLegal,
        });
        this.privateData.verifyTips = tips;
      },
    );
  },
});
