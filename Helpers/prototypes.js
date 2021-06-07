
/**
* Replaces all occurrences in a string
* @param {String} search Needle
* @param {String} replacement Replacement
* @return {String} The formatted string
*/

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};

/**
* Formats a number
* @param {Number} [decimalPlaces = 2] The number of decimals
* @return {Number} The formatted number
*/

Object.defineProperty(Number.prototype, 'format', {
  value: function(decimalPlaces) {
    return parseFloat(this.toFixed(decimalPlaces || 2));
  }
});

/**
* Gets the key of the largest number in an array
* @return {Number} The array key
*/

Object.defineProperty(Array.prototype, 'max', {
  value: function() {
    return this.indexOf(Math.max.apply(null, this));
  }
});

/**
* Gets index of the largest element in array based on probability
* Used to get the output of a softmax function
* @param {Array} weights The weights (output of the neural network)
* @return {Number} The array key
*/

Object.defineProperty(Array.prototype, 'weightedRandom', {
  value: function() {
    let i, sum = 0, r = Math.random();
    for (i in this) {
      sum += this[i];
      if (r <= sum) {
        return i * 1;
      }
    }
  }
});

/**
* Gets the key of largest number in an array based on probability
* Used to get the output of a softmax function
* @return {Number} The array key
*/

Object.defineProperty(Array.prototype, 'getProbableItem', {
  value: function() {
    const rand = Math.random();
    let limit = 0;
    for(let i in this) {
      if(rand >= limit && rand < limit + this[i]) return i * 1;
      limit += this[i];
    }
  }
});

/**
* Randomlizes the elements of an array
* @return {Array} The shuffled array
*/

Object.defineProperty(Array.prototype, 'shuffle', {
  value: function() {
    let currentIndex = this.length;
    let temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while(0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = this[currentIndex];
      this[currentIndex] = this[randomIndex];
      this[randomIndex] = temporaryValue;
    }
    return this;
  }
});

/**
* Divides an array into many arrays of specified size
* @param {Number} batchSize The batch size
* @return {Array} The array
*/

Object.defineProperty(Array.prototype, 'batch', {
  value: function(batchSize) {
    let groupedData = [];
    for(let i = 0; i < Math.ceil(this.length / batchSize); i++) {
      groupedData.push(this.slice(i * batchSize, (i + 1) * batchSize));
    }
    return groupedData;
  }
});

Math.randomBetween = function(min, max) {
  return this.random() * (max - min) + min;
}

Math.randomIntBetween = function(min, max) {
  return Math.floor(this.random() * (max - min + 1) + min );
}