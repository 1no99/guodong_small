/* eslint-disable no-param-reassign */
import { fetchDeliveryAddressList, deleteAddress } from '../../../../services/address/fetchAddress';
import Toast from 'tdesign-miniprogram/toast/index';
import { resolveAddress, rejectAddress } from '../../../../services/address/list';

Page({
  data: {
    addressList: [],
    selectedId: '',
    selectMode: false,
    hasSelect: false,
    isFromOrder: false,
    isFromUserCenter: false, // 是否从用户中心进入
  },

  onLoad(options) {
    const { selectMode = '', from = '' } = options;
    const selectModeEnabled = selectMode === 'true';
    const isFromOrder = from === 'confirm';
    const isFromUserCenter = !from; // 如果没有 from 参数，说明是从用户中心进入

    this.setData({
      selectMode: selectModeEnabled,
      isFromOrder: isFromOrder,
      isFromUserCenter: isFromUserCenter,
    });

    this.init();
  },

  onShow() {
    // 页面显示时重新加载地址列表（新增或编辑地址后返回）
    this.getAddressList();
  },

  onUnload() {
    if (this.data.selectMode && !this.data.hasSelect) {
      rejectAddress();
    }
  },

  init() {
    this.getAddressList();
  },

  // 处理返回按钮点击
  onBack() {
    console.log(133);
    if (this.data.isFromUserCenter) {
      // 从用户中心进入，直接返回用户中心
      wx.switchTab({
        url: '/pages/usercenter/index',
      });
    } else {
      // 从其他页面进入，使用默认返回
      wx.navigateBack({ delta: 1 });
    }
  },

  // 获取地址列表
  getAddressList() {
    wx.showLoading({
      title: '加载中...',
      mask: true,
    });

    fetchDeliveryAddressList()
      .then((addressList) => {
        wx.hideLoading();
        this.setData({
          addressList: addressList || [],
        });

        // 如果有默认地址，默认选中第一个
        if (addressList && addressList.length > 0 && !this.data.selectedId) {
          const defaultAddress = addressList.find((addr) => addr.isDefault);
          if (defaultAddress) {
            this.setData({
              selectedId: defaultAddress.id,
            });
          }
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('获取地址列表失败:', err);

        // 如果是未登录错误，不显示提示（因为会自动跳转到登录页）
        if (err.message === '未登录') {
          return;
        }

        Toast({
          context: this,
          selector: '#t-toast',
          message: '加载失败，请重试',
          icon: '',
          duration: 1500,
        });
      });
  },

  // 选择地址（点击圆圈）
  selectAddress(e) {
    const { id } = e.currentTarget.dataset;

    if (this.data.selectMode) {
      // 选择模式：选中后立即返回
      const address = this.data.addressList.find((item) => item.id === id);
      this.setData({
        hasSelect: true,
        selectedId: id,
      });
      resolveAddress(address);
      wx.navigateBack({ delta: 1 });
    } else {
      // 普通模式：切换选中状态
      const newSelectedId = this.data.selectedId === id ? '' : id;
      this.setData({
        selectedId: newSelectedId,
      });
    }
  },

  // 编辑地址
  editAddress(e) {
    const { id } = e.currentTarget.dataset;
    this.editAddressById(id);
  },

  editAddressById(id) {
    const {  isFromOrder } = this.data;
    let url = isFromOrder?`/pages/user/address/edit/index?from=confirm&id=${id}`:`/pages/user/address/edit/index?id=${id}`
    wx.navigateTo({
      url: url,
    });
  },

  // 删除地址
  deleteAddress(e) {
    const { id } = e.currentTarget.dataset;
    const address = this.data.addressList.find((item) => item.id === id);

    if (!address) return;

    wx.showModal({
      title: '提示',
      content: '确定要删除这个地址吗？',
      success: (res) => {
        if (res.confirm) {
          this.confirmDelete(id);
        }
      },
    });
  },

  // 确认删除
  confirmDelete(id) {
    wx.showLoading({
      title: '删除中...',
      mask: true,
    });

    // 调用删除接口
    deleteAddress(id)
      .then(() => {
        wx.hideLoading();
        Toast({
          context: this,
          selector: '#t-toast',
          message: '删除成功',
          theme: 'success',
          duration: 1000,
        });
        // 重新加载地址列表
        this.getAddressList();
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('删除地址失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: err.message || '删除失败，请重试',
          theme: 'error',
          duration: 1500,
        });
      });
  },

  // 新建地址
  createAddress() {
    const { isFromOrder } = this.data;
    let url = isFromOrder?`/pages/user/address/edit/index?from=confirm`:`/pages/user/address/edit/index`
    wx.navigateTo({
      url: url,
    });
  },

  // 确认选中的地址（从订单确认页跳转过来时使用）
  confirmSelectedAddress() {
    const { selectedId, addressList, isFromOrder } = this.data;

    if (!selectedId) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先选择一个地址',
        icon: '',
        duration: 1500,
      });
      return;
    }

    const selectedAddress = addressList.find((item) => item.id === selectedId);

    if (!selectedAddress) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '地址信息不存在',
        icon: '',
        duration: 1500,
      });
      return;
    }

      // 从订单确认页跳转过来：存储到本地存储，然后返回
      try {
        wx.setStorageSync('selected_address_for_order', selectedAddress);
        wx.navigateTo({
          url: '/pages/order/confirm/index'
        })
      } catch (err) {
        console.error('存储地址失败:', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '操作失败，请重试',
          icon: '',
        });
      }
   
  },
});
