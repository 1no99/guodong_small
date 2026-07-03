Component({
  options: {
    multipleSlots: true,
  },
  properties: {
    title: {
      type: String,
      value: '',
    },
    type: {
      type: String,
      value: '',
    },
    status: {
      type: String,
      value: 'useful',
    },
    desc: {
      type: String,
      value: '',
    },
    value: {
      type: String,
      value: '',
    },
    tag: {
      type: String,
      value: '',
    },
    timeLimit: {
      type: String,
      value: '',
    },
  },
});
