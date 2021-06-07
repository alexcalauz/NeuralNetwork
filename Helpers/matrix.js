Object.defineProperty(Array.prototype, 'to2D', {
  value: function(cols, rows, options = {}) {
    if(!rows || !cols) {
      throw new Error('Rows and Columns are not defined');
    }
    Object.defineProperty(this, 'size', {
      value: [cols, rows],
      configurable: true,
      writable: true,
      enumerable: false,
    });

    if(options.multiplyBy) {
      Object.defineProperty(this, 'multiplyBy', {
        writable: true,
        configurable: true,
        value: function(matrix) {
          const productMatrix = [];
          const cols = this.size[0];
          const rows = this.size[1];
          var mCols = matrix.size[0];
          let i = rows;
          while(i--) {
            let j = mCols;
            while(j--) {
              let product = 0;
              let k = cols;
              while(k--) {
                var weight = matrix[k * mCols + j];
                if (weight === null) {
                  continue
                }
                product += this[i * cols + k] * matrix[k * mCols + j];
              }
              productMatrix.push(product);
            }
          }
          productMatrix.reverse();
          productMatrix.to2D(matrix.size[0], rows, options);
          return productMatrix;
        }
      });
    }


    if(options.custom) {
      Object.defineProperty(this, 'custom', {
        writable: true,
        configurable: true,
        value: function(func) {
          const result = this.map(e => func(e, this));
          result.to2D(this.size[0], this.size[1], options);
          return result;
        }
      });
    }

    if(options.at) {
      Object.defineProperty(this, 'at', {
        writable: true,
        configurable: true,
        value: function(col, row) {
          return this[row * this.size[0] + col];
        }
      });
    }

    if(options.row) {
      Object.defineProperty(this, 'row', {
        writable: true,
        configurable: true,
        value: function(row) {
          return this.slice(row * this.size[0], row * this.size[0] + this.size[0]);
        }
      });
    }

    if(options.col) {

      Object.defineProperty(this, 'col', {
        writable: true,
        configurable: true,
        value: function(col) {
          return this.filter((value, key) => {
            return key % this.size[0] === col;
          });
        }
      });

      Object.defineProperty(this, 'colIndex', {
        writable: true,
        configurable: true,
        value: function(col) {
          const index = col * this.size[0];
          return [...Array(this.length).keys()].slice(index, index + this.size[0]);
        }
      });
    }

    if(options.plus) {
      Object.defineProperty(this, 'plus', {
        writable: true,
        configurable: true,
        value: function(by) {
          result = this.map((e, i) => e + by[i]);
          result.to2D(this.size[0], this.size[1]);
          return result;
        }
      });
    }

    if(options.minus) {
      Object.defineProperty(this, 'minus', {
        writable: true,
        configurable: true,
        value: function(by) {
          let result = 0;
          if(typeof by === 'object') {
            result = this.map((e, i) => e - by[i]);
          } else {
            result = this.map((e) => e - by);
          }
          result.to2D(this.size[0], this.size[1]);
          return result;
        }
      });
    }

    if(options.times) {
      Object.defineProperty(this, 'times', {
        writable: true,
        configurable: true,
        value: function(by) {
          let result = 0;
          if(typeof by === 'object') {
            result = this.map((e, i) => e * by[i]);
          } else {
            result = this.map((e) => e * by);
          }
          result.to2D(this.size[0], this.size[1]);
          return result;
        }
      });
    }

    if(options.over) {
      Object.defineProperty(this, 'over', {
        writable: true,
        configurable: true,
        value: function(by) {
          let result = 0;
          if(typeof by === 'object') {
            result = this.map((e, i) => e / by[i]);
          } else {
            result = this.map((e) => e / by);
          }
          result.to2D(this.size[0], this.size[1]);
          return result;
        }
      });
    }

    if(options.under) {
      Object.defineProperty(this, 'under', {
        writable: true,
        configurable: true,
        value: function(by) {
          let result;
          if(typeof by === 'object') {
            result = this.map((e, i) => by[i] / e);
          } else {
            result = this.map((e) => by / e);
          }
          result.to2D(this.size[0], this.size[1]);
          return result;
        }
      });
    }

    if(options.power) {
      Object.defineProperty(this, 'power', {
        writable: true,
        configurable: true,
        value: function(by) {
          let result;
          if(typeof by === 'object') {
            result = this.map((e, i) => Math.pow(e, by[i]));
          } else {
            result = this.map((e) => Math.pow(e, by));
          }
          result.to2D(this.size[0], this.size[1]);
          return result;
        }
      });
    }

    if(options.to1D) {
      Object.defineProperty(this, 'to1D', {
        writable: true,
        configurable: true,
        value: function() {
          delete this.size;
          delete this.at;
          delete this.row;

          delete this.multiplyBy;
          delete this.plus;
          delete this.minus;
          delete this.times;
          delete this.under;
          delete this.over;
          delete this.power;

          delete this.to2D;
          delete this.to1D;
        },
      });
    }






  },
  enumerable: false,
});