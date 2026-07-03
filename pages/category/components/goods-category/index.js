Component({
  externalClasses: ['custom-class'],

  properties: {
    category: {
      type: Array,
    },
   
    isSlotRight: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    changCategory(event) {
      const { item } = event.currentTarget.dataset;
      this.triggerEvent('changeCategory', {
        item,
      });
    },
  
  },
});
