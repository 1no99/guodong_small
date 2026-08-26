import { formatTime } from '../../../utils/util';
import {  fetchOrderDetail } from '../../../services/order/orderDetail';
import Toast from 'tdesign-miniprogram/toast/index';
import { get,put } from '../../../utils/request';
import { config } from '../../../config/index';
Page({
  data: {
    order: {}, // 后台返回的原始数据
    orderNo:''
  },

  onLoad(query) {
    let orderNo = query.orderNo;
    this.setData({
      orderNo:orderNo,
    })
    this.getDetail();
  },

  getDetail() {
    return fetchOrderDetail( this.data.orderNo).then((res) => {
       const order = res;
      this.setData({
        order:res
      })
      //console.log(this.data.order,res.data,order);
    });
  },
  updateStatus(){
    put('/order/update-status', {
      id:  this.data.orderNo,
      order_status: 4,
    }, true)
      .then((data) => {
        //console.log(data);
        if(data.code == 0){
          Toast({
            context: this,
            selector: '#t-toast',
            message: '取消成功',
            icon: '',
          });
          wx.navigateTo({ url: `/pages/order/order-list/index?status=0` });
        }else{
          Toast({
            context: this,
            selector: '#t-toast',
            message: '取消失败',
            icon: '',
          });
        }
       
      })
      .catch((err) => {
        console.error('fetchOrderDetail error:', err);
        throw err;
      });
  },

  downloadImage(e) {
    let url = e.currentTarget.dataset.url;
    if (!url) return;
    if (!url.startsWith('http')) {
      url = `${config.apiBase.replace('/api', '')}${url}`;
    }
    wx.showLoading({ title: '保存中...' });
    wx.request({
      url,
      responseType: 'arraybuffer',
      success(res) {
        if (res.statusCode === 200) {
          const fs = wx.getFileSystemManager();
          const filePath = `${wx.env.USER_DATA_PATH}/download_${Date.now()}.png`;
          try {
            fs.writeFile({
              filePath,
              data: res.data,
              encoding: 'binary',
              success() {
                wx.saveImageToPhotosAlbum({
                  filePath,
                  success() {
                    wx.hideLoading();
                    wx.showToast({ title: '保存成功', icon: 'success' });
                  },
                  fail(err) {
                    wx.hideLoading();
                    console.error('保存失败:', err);
                    if (err.errMsg && err.errMsg.indexOf('auth') !== -1) {
                      wx.showModal({
                        title: '授权提示',
                        content: '需要您授权保存图片到相册',
                        confirmText: '去授权',
                        success(modalRes) {
                          if (modalRes.confirm) wx.openSetting();
                        }
                      });
                    } else {
                      wx.showToast({ title: '保存失败', icon: 'none' });
                    }
                  }
                });
              },
              fail(err) {
                wx.hideLoading();
                console.error('写入失败:', err);
                wx.showToast({ title: '保存失败', icon: 'none' });
              }
            });
          } catch (err) {
            wx.hideLoading();
            console.error('写入异常:', err);
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        } else {
          wx.hideLoading();
          wx.showToast({ title: '下载失败', icon: 'none' });
        }
      },
      fail(err) {
        wx.hideLoading();
        console.error('下载失败:', err);
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  }
})
