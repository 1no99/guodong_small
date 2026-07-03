import { formatTime } from '../../../utils/util';
import {  fetchOrderDetail } from '../../../services/order/orderDetail';
import Toast from 'tdesign-miniprogram/toast/index';
import { get,put } from '../../../utils/request';
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
      console.log(this.data.order,res.data,order);
    });
  },
  updateStatus(){
    put('/order/update-status', {
      id:  this.data.orderNo,
      order_status: 4,
    }, true)
      .then((data) => {
        console.log(data);
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
  }

})