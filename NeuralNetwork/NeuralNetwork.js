class NeuralNetwork {
  constructor(model, weights = [], biases = []) {
    this.model = model;
    this.weights = weights;
    this.biases = biases;

    //Settings

    // this.learningRate = .001;
    // this.generateRandomNulls = false;
    // this.crossoverNullValues = true;
    this.matrixOptions = {
      multiplyBy: true,
      custom: true,
      col: true,
      row: true,
      at: true,//please remove
    }

    if(weights.length === 0) {
      this.generateWeights();
    } else {
      this.weights = weights;
      for(let i = 1; i < this.model.length; i++) {
        this.weights[i - 1].to2D(this.model[i][0], this.model[i - 1][0], this.matrixOptions);
      }
    }
    if(biases.length === 0) {
      this.generateBiases();
    } else {
      this.biases = biases;
    }
  }

  generateWeights() {
    for(let i = 1; i < this.model.length; i++) {
      let matrixSize = this.model[i][0] * this.model[i - 1][0];
      let layerWeights = [...Array(matrixSize)].map(() => Math.random() * 2 - 1);
      layerWeights.to2D(this.model[i][0], this.model[i - 1][0], this.matrixOptions);
      this.weights.push(layerWeights)
    }
  }

  generateBiasesOld() {
    for(let i in this.model) {
      if(i == 0) {
        continue;
      }
      if(this.model[i][2]) {
        const layerBias = (Math.randomBetween(-1, 1));
        this.biases.push(layerBias);
      }
      if(this.model[i][3]) {
        const layerBiases = [];
        for(let j = 0; j < this.model[i][0]; j++) {
          const layerBias = (Math.randomBetween(-1, 1));
          layerBiases.push(layerBias);
        }
        this.biases.push(layerBiases);
      }
    }
  }

  generateBiases() {
    for(let i = 1; i < this.model.length; i++) {
      this.biases.push([...Array(this.model[i][0])].map(() => Math.random() * 2 - 1));
      // if(this.model[i][2]) {
      //   const layerBias = (Math.randomBetween(-1, 1));
      //   this.biases.push(layerBias);
      // }
    }
  }

  run(input, blockedOutputs = []) {
    //input
    let result = input;
    result.to2D(input.length, 1, this.matrixOptions);

    for(let i in this.weights) {
      // times weight
      result = result.multiplyBy(this.weights[i]);
      const s1 = result.size[0];
      const s2 = result.size[1];

      // add a bias
      result = result.map((e, j) => e + this.biases[i][j]);
      result.to2D(s1, s2, this.matrixOptions);

      // activate
      if(blockedOutputs.length && i == this.weights.length - 1) {
        for(let j in blockedOutputs) {
          result.splice(blockedOutputs[j] - j, 1);
        }
      }
      result = result.custom(Activation.functions[this.model[parseInt(i) + 1][1]]);
    }

    return result;
  }

  //Mutate weights by adding a random number
  //Pickes  weights by random choice
  mutateWeights(mutateRate, pickRate) {
    for(let i in this.weights) {
      for(let j in this.weights[i]) {
        if(this.weights[i][j] !== null && Math.floor(Math.random() * 1 / pickRate) === 0) {
          this.weights[i][j] += Math.randomBetween(-mutateRate, mutateRate);
        }
      }
    }
  }

  //Mutate weights by adding a random number
  //Picks weights of a single random neuron
  mutateWeights2(mutateRate) {
    for(let i = 1; i < this.weights.length; i++) {
      // const layerIndex = Math.randomIntBetween(1, this.model.length - 1);
      const layerIndex = i;
      const neuronIndex = Math.randomIntBetween(0, this.model[layerIndex][0] - 1);

      let neuronIndexes = this.weights[layerIndex - 1].colIndex(neuronIndex);

      for(let i in neuronIndexes) {
        this.weights[layerIndex - 1][neuronIndexes[i]] += Math.randomBetween(-mutateRate, mutateRate);
      }
    }
  }

  mutateBiases(mutateRate, pickRate) {
    for(let i in this.biases) {
      if(typeof(this.biases[i]) == 'object') {
        for(let j in this.biases[i]) {
          if(Math.floor(Math.random() * 1 / pickRate) === 0) {
            this.biases[i][j] += Math.randomBetween(-mutateRate, mutateRate);
          }
        }
      } else {
        this.biases[i] += Math.randomBetween(-mutateRate, mutateRate);
      }
    }
  }

  mutateBiases2(mutateRate, pickRate) {
    for(let i in this.biases) {
      if(typeof(this.biases[i]) == 'object') {
        const biasIndex = Math.randomIntBetween(0, this.biases[i].length - 1);
        this.biases[i][biasIndex] += Math.randomBetween(-mutateRate, mutateRate);
      } else {
        this.biases[i] += Math.randomBetween(-mutateRate, mutateRate);
      }
    }
  }

  mutate(pickRate) {
    const mutationRates = [1, 1];
    this.mutateWeights(mutationRates[0], pickRate);
    //this.mutateBiases2(mutationRates[1], pickRate);
  }

  clone() {
    return new NeuralNetwork(this.model, this.weights, this.biases);
  }

  cloneAndMutate(mutationRates) {
    const weights = this.mutate(JSON.parse(JSON.stringify(this.weights)), mutationRates[0]);
    const biases = this.mutateBiases(JSON.parse(JSON.stringify(this.biases)), mutationRates[1]);

    const clone = new NeuralNetwork(this.layout);
    clone.weights = weights;
    clone.biases = biases;

    return clone;
  }

  crossover(secondParent) {
    const newChild = this.clone();
    newChild.weights = newBrain.crossoverWeights2(secondParent.brain);
    newChild.biases = newBrain.crossoverBiases2(secondParent.brain);
    return newChild;
  }

  crossoverWeights(otherNetwork) {
    const weightData = JSON.parse(JSON.stringify(this.weights));
    for(let i in weightData) {
      for(let j in weightData[i]) {
        if(weightData[i][j] !== null && Math.randomIntBetween(0, 2)) {
          weightData[i][j] = otherNetwork.weights[i][j];
        }
      }
      weightData[i].to2D(this.model[parseInt(i) + 1][0], this.model[i][0], this.matrixOptions);
    }
    return weightData;
  }

  crossoverWeights2(otherNetwork) {
    const weightData = JSON.parse(JSON.stringify(this.weights));
    for(let i in weightData) {
      if(!Math.randomIntBetween(0, 2)) {
        weightData[i] = JSON.parse(JSON.stringify(otherNetwork.weights[i]));
      }
      weightData[i].to2D(this.model[parseInt(i) + 1][0], this.model[i][0], this.matrixOptions);
    }
    return weightData;
  }

  crossoverWeights4(otherNetwork) {
    //Need to try
    const weightData = JSON.parse(JSON.stringify(this.weights));
    const rnd = Math.randomIntBetween(0, 2);

    weightData[rnd] = JSON.parse(JSON.stringify(otherNetwork.weights[rnd]));
    for(let i in weightData) {
      weightData[i].to2D(this.model[parseInt(i) + 1][0], this.model[i][0], this.matrixOptions);
    }
    return weightData;
  }

  crossoverBiases(otherNetwork) {
    const biasData = JSON.parse(JSON.stringify(this.biases));
    for(let i in biasData) {
      if(typeof(biasData[i]) === 'object') {
        for(let j in biasData[i]) {
          if((biasData[i][j] !== null || this.crossoverNullValues) && Math.randomIntBetween(0, 2)) {
            biasData[i][j] = otherNetwork.biases[i][j];
          }
        }
      }
    }
    return biasData;
  }

  crossoverBiases2(otherNetwork) {
    const biasData = JSON.parse(JSON.stringify(this.biases));
    for(let i in biasData) {
      if(!Math.randomIntBetween(0, 2)) {
        biasData[i] = JSON.parse(JSON.stringify(otherNetwork.biases[i]));
      }
    }
    return biasData;
  }

  crossoverBiases4(otherNetwork) {
    const biasData = JSON.parse(JSON.stringify(this.biases));
    const rnd = Math.randomIntBetween(0, 2);

    biasData[rnd] = JSON.parse(JSON.stringify(otherNetwork.biases[rnd]));
    return biasData;
  }

  crossover(otherNetwork) {
    const weights = this.crossoverWeights(otherNetwork);
    const biases = this.crossoverBiases(otherNetwork);
    return new NeuralNetwork(this.model, weights, biases);
  }

  getValues(input) {
    //input
    let result = input;
    const neuronValues = [result];
    const neuronBeforeValues = [result];
    result.to2D(input.length, 1, this.matrixOptions);

    for(let i in this.weights) {
      // times weight
      result = result.multiplyBy(this.weights[i]);
      const s1 = result.size[0];
      const s2 = result.size[1];

      // add a bias
      result = result.map((e, j) => e + this.biases[i][j]);
      result.to2D(s1, s2, this.matrixOptions);
      neuronBeforeValues.push(result);

      // activate
      result = result.custom(Activation.functions[this.model[parseInt(i) + 1][1]]);
      neuronValues.push(result);
    }
    return [neuronBeforeValues, neuronValues];
  }

  //Not Working properly yet

  //G = (neuronValue - expectedOutputValue) * activationDerivative

  //W' = G * prevNeuronValue
  //

	getGammas(neuronValues, expectedOutput) {
    const gammas = [];
    let i = this.model.length;

    while(i--) {
      //For Each Layer
      const activationFunctionName = this.model[i][1];
      const layerGammas = [];
      if(i === this.model.length - 1) {
        //Last Layer
        let j = this.model[i][0];
        while(j--) {
          //For Each Neuron
          const errorDerivative = 2 * (expectedOutput[j] - neuronValues[1][i][j]);
          //const errorDerivative = 2 * error;
          const neuronGamma = errorDerivative * Activation.derivatives[activationFunctionName](neuronValues[0][i][j], neuronValues[0][i]);
          layerGammas.unshift(neuronGamma);
        }
      } else {
        //Other Layers except the first
        if(i === 0) {
          continue;
        }
        let j = this.model[i][0];

        while(j--) {
          //For each neuron
          let k = this.model[i + 1][0];
          let neuronGamma = 0;

          while(k--) {
            //For each neuron in the next layer
            //row * this.size[1] + col
            neuronGamma += gammas[0][k] * this.weights[i][j * this.model[i + 1][0] + k]
          }
          layerGammas.unshift(neuronGamma * Activation.derivatives[activationFunctionName](neuronValues[0][i][j]));
        }
      }
      gammas.unshift(layerGammas);
    }
    return gammas;
  }

  //Not yet Working properly
  backpropagate(input, output) {
    const values = this.getValues(input);
    const gammas = this.getGammas(values, output);

    //console.log(values);

    //update weights
    for(let i = 0; i < this.model.length - 1; i++) {
      for(let j = 0; j < this.model[i][0]; j++) {
        for(let k = 0; k < this.model[i + 1][0]; k++) {
          const delta = gammas[i][k] * values[1][i][j];
          this.weights[i][j * this.model[i + 1][0] + k] += delta * this.learningRate;
        }
      }
    }
    //update biases
    for(let i = 0; i < this.model.length - 1; i++) {
      for(let j = 0; j < this.model[i + 1][0]; j++) {
        const delta = gammas[i][j];
        //console.log(this.biases[i, j], gammas[i][j]);
        this.biases[i][j] += delta * this.learningRate;
      }
    }
  }

  //Not Working properly
  train(inputs, correctOutputs) {
    const values = this.getValues(input);
    const error = this.getMSE(inputs, correctOutputs);
    const errorDeriv = this.getMSEDeriv(inputs, correctOutputs);
    const gammas = this.getGammas(values, output, errorDeriv);


  }

  //Not tested

  getMSE(inputs, correctOutputs) {
    const errors = new Array(inputs[0].length).fill(0);
    for(let i in inputs) {
      const result = net.run(inputs[i]);
      for(let j in inputs[i]) {
        errors[j] += Math.pow(result[j] - correctOutputs[i][j], 2);
      }
    }
    return errors.map((err) => err / inputs.length);
  }

  //Not tested
  getMSEDeriv(inputs, correctOutputs) {
    const errors = new Array(inputs[0].length).fill(0);
    for(let i in inputs) {
      const result = net.run(inputs[i]);
      for(let j in inputs[i]) {
        errors[j] += (result[j] - correctOutputs[i][j]);
      }
    }
    return errors.map((err) => err / inputs.length);
  }
}
