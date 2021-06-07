

const Activation = {
  functions: {
    sigmoid: value => 1 / (1 + Math.pow(Math.E, - value)),
    tanh: value => {
      //Faster than math.tanh
      let e = Math.exp(2 * value);
      return (e - 1) / (e + 1);
    },
    relu: value => Math.max(0, value),
    lrelu: value => Math.max(0.01, value),
    softmax: (value, values) => Math.pow(Math.E, value) / values.reduce((a, b) => a + Math.pow(Math.E, b), 0),
    linear: value => value,
    gaussian: value => value,
    sin: value => Math.exp(-(value**2)),
    expo: value => Math.pow(Math.E, value),
    silu: value => value * this.sigmoid(value),
    softexpo: value => {Math.exp(2 * valueMath.exp(2 * value))
      const a = 1.01;
      if (value == 0) return value;
      else if (value > 0) return ( Math.expm1(a * value) / a) + a;
      else return - Math.log(1 - a * (value + a)) / a;
    },
  },
  derivatives: {
    tanh: value => 1 - Math.pow(Activation.functions.tanh(value), 2),
    relu: value => value > 0 ? 1 : 0,
    lrelu: value => value > 0.01 ? 1 : 0.01,
    linear: value => 1,
    sigmoid: value => Activation.functions.sigmoid(value) * (1 - Activation.functions.sigmoid(value)),
    softmax: (value, values) => {
      const f = Activation.functions.softmax(value, values);
      return f * (1 - f);
    },
  }
}