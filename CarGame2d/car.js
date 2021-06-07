class CarGame2D {
  constructor(brain = null, render = false, isAI = true) {
    this.render = render;
    this.gears = [
      [0.025, -0.00016, 0.0016],
      [0.09, 0.0001, 0],
      [0.020, 0.00016, 0.0014],
      [0.050, 0.0001, 0.0011],
      [0.090, 0.00004, 0.0008],
      [0.140, 0.00006, 0.0004],
      [0.200, 0.00007, 0.0001],
      // [0.175, 0.00005, 0.0001],
    ]

    /**
      Controls:
        Up:     Accel
        Down:   Break
        Left:   Left
        Right:  Right
        LCtrl:  Gear Up
        LAlt:   Gear Down
    */

    this.status;

    this.gear = 1;
    this.speed = 0;

    this.distance = 0;
    this.maxRpm = this.gears[1][0];
    this.powerFactor = this.gears[1][1];
    this.reverseFactor = 0.0005;

    this.drag = 0.95;
    this.angularDrag = 0.95;
    this.laps = 0;
    this.lapTime = null;

    this.lastChangedLaps = Date.now()

    this.arrowKeys = {
      up: 38,
      down: 40,
      left: 37,
      right: 39
    };

    const carElement = document.createElement('div');
    carElement.classList.add('car');
    this.carElement = carElement;
    document.querySelector('.scene').appendChild(carElement);

    const circuitElement = document.querySelector('#circuit');
    this.map = {
      circuit: this.getCircuit(circuitElement),
      path: circuitElement,
      linesContainer: document.querySelector('#lines'),
      distanceElement: document.querySelector('#distance'),
    }
    this.svg = document.querySelector('#svgroot');
    this.collisionElement = document.querySelector('#svgroot #collision');

    const startLine = circuitElement.getAttribute('startlineparams').split(',').map((el) => el * 1);

    this.mapStartOffset = startLine[0];
    this.mapStartHeight = startLine[1];

    document.querySelector("#start").style.height = startLine[1] + 'px';
    document.querySelector("#start").style.left = startLine[0] - 1 + 'px';
    document.querySelector("#start").style.top = '0px';

    this.car = {
      el: carElement,
      x: this.mapStartOffset + 1,
      y: this.mapStartHeight / 2,
      xVelocity: 0,
      yVelocity: 0,
      rpm: 0,
      reverse: 0,
      angle: 1.57,
      angularVelocity: 0,
      isThrottling: false,
      isReversing: false
    };

    this.wheel = document.querySelector('.wheel');
    this.speedometer = document.querySelector('.speedometer');

    this.lastX = this.car.x;
    this.time = Date.now();

    this.keysDown = {};

    this.lastTime;
    this.acc = 0;
    this.step = 1 / 120;

    this.highRevTime = 0;

    this.sensorLines = [];
    this.sensors = [];

    this.gearChange = 0;

    this.running = true;

    this.attachEvents();

    if(isAI) {
      const brainModel = [
        [9],
        [26, 'linear'],
        [26, 'tanh'],
        [6, 'sigmoid'],
      ];

      this.brain = brain || new NeuralNetwork(brainModel);
    }

    this.int = setInterval(() => {
      this.frame();

      this.writeLines(false);
      this.sensors = this.getSensors();

      if(this.brain) {
        const rpm = this.car.rpm / this.maxRpm;
        const steeringAngle = this.car.angularVelocity * 66;
        const gear = (this.gear - 1) / (this.gears.length - 2);
        const speed = this.car.rpm / this.gears[this.gears.length - 1][0];

        const moves = this.brain.run([...this.sensors, rpm, speed, steeringAngle, gear]);

        for(let i = 0; i < 4; i++) {
          this.keysDown[37 + i] = moves[i] > 0.5;
        }

        if(moves[4] > 0.5) {
          this.gearUp();
        }

        if(moves[5] > 0.5) {
          this.gearDown();
        }

      }

      this.renderCar();

      if(this.render) {
        this.renderUI();
      }

    }, 1000 / 60);

    if(this.render) {
      document.querySelector('.ui').style.display = 'block';
    }
  }

  getPower() {

  }

  renderUI() {
    // console.log(this.car.rpm / this.maxRpm);
    // console.log(this.car.angularVelocity / 0.023);
    console.log();
    const angle = this.car.angularVelocity * 90 / 0.03789;
    document.querySelector('.wheel').style.transform = 'rotate(' + angle + 'deg)';

    const rpm = this.car.rpm * 180 / this.maxRpm - 90;
    document.querySelector('.tachometer div').style.transform = 'rotate(' + rpm + 'deg)';

    const speed = this.car.rpm * 180 / this.gears[this.gears.length - 1][0] - 90;
    document.querySelector('.speedometer div').style.transform = 'rotate(' + speed + 'deg)';

    document.querySelector('.gear').innerHTML = this.gear - 1;

    if(this.keysDown[38]) {
      document.querySelector('.pedal.gas').classList.add('active');
    } else {
      document.querySelector('.pedal.gas').classList.remove('active');
    }
    if(this.keysDown[40]) {
      document.querySelector('.pedal.break').classList.add('active');
    } else {
      document.querySelector('.pedal.break').classList.remove('active');
    }
  }

  getGearboxFitness() {
    const fitness = (this.distance * this.distance) / this.lapTime;
    const errors = ['GEARBOX_BROKEN', 'ENGINE_BROKEN', 'ENGINE_STALL'];

    if(errors.indexOf(this.status) >= 0) {
      fitness -= fitness / 3
    }

    return fitness;
  }

  stop(reason) {
    if(!this.running) {
      return;
    }
    document.querySelector('.ui').style.display = 'none';
    this.status = reason;
    this.running = false;
    this.lapTime = Date.now() - this.time;
    this.distance = this.getDistance();

    this.score = this.getScore();

    this.car.rpm = 0;
    this.car.angle = 0;
    this.car.angularVelocity = 0;
    clearInterval(this.int);
    this.car.el.remove();

    console.log('Game Over: ' + reason);

    this.carElement.dispatchEvent(new Event('gameOver'));
  }

  gearUp() {
    this.gearChange++;
    this.gear = Math.min(this.gear + 1, this.gears.length - 1);
    this.maxRpm = this.gears[this.gear][0];
    this.powerFactor = this.gears[this.gear][1];
    this.turnSpeed = this.gears[this.gear][2];
  }

  gearDown() {
    this.gearChange++;
    this.gear = Math.max(this.gear - 1, 0);
    this.maxRpm = this.gears[this.gear][0];
    this.powerFactor = this.gears[this.gear][1];
    this.turnSpeed = this.gears[this.gear][2];
  }

  keyActive(key) {
    return this.keysDown[this.arrowKeys[key]] || false;
  };

  attachEvents() {
    window.addEventListener('keydown', e => {
      this.keysDown[e.which] = true;
    });

    window.addEventListener('keyup', e => {
      this.keysDown[e.which] = false;
    });

    window.addEventListener('keydown', e => {
      if(e.which === 17) {
        this.gearUp();
      }
      if(e.which === 18) {
        this.gearDown();
      }
    });
  }

  update() {

    if (this.car.isThrottling && this.gear !== 1) {
      this.car.rpm += this.powerFactor * this.car.isThrottling;
    } else {
      this.car.rpm -= this.powerFactor / 2;
    }
    if (this.car.isReversing) {
      this.car.rpm -= this.powerFactor * 3;
    }

    if(this.car.rpm > 0.001 && this.gear < 1) {
      this.stop('GEARBOX_BROKEN');
    }

    if(this.gear > 2 && this.maxRpm / this.car.rpm > 3.9) {
      this.stop('ENGINE_STALL');
    }

    const normalizedPower = Math.min(this.maxRpm, this.car.rpm);
    if(this.gear === 0) {
      this.car.rpm = Math.min(0, normalizedPower);
    } else {
      this.car.rpm = Math.max(0, normalizedPower);
    }

    const turnSpeed = (0.00028 / Math.pow(this.car.rpm, 0.3));

    if (this.car.isTurningLeft) {
      this.car.angularVelocity -= turnSpeed * this.car.isTurningLeft;
    }
    if (this.car.isTurningRight) {
      this.car.angularVelocity += turnSpeed * this.car.isTurningRight;
    }

    this.car.xVelocity += Math.sin(this.car.angle) * this.car.rpm;
    this.car.yVelocity += Math.cos(this.car.angle) * this.car.rpm;
    this.car.x += this.car.xVelocity;
    this.car.y -= this.car.yVelocity;
    this.car.xVelocity *= this.drag;
    this.car.yVelocity *= this.drag;
    this.car.angle += this.car.angularVelocity;
    this.car.angularVelocity *= this.angularDrag;
    if(this.car.angle > 6.28319) {
      this.car.angle -= 6.28319;
    }
    if(this.car.angle < 0) {
      this.car.angle += 6.28319;
    }
  }

  frame() {
    if(Date.now() - this.time > 3000 && this.car.rpm === 0) {
      this.stop('IDLE');
    }
    if(this.gearChange > 20) {
      this.stop('GEARBOX_BROKEN_TOO_MANY_SHIFTS');
    }
    const r = this.car.rpm / this.maxRpm;
    if(r >= 0.9 && r <= 1) {
      if(Date.now() - this.highRevTime > 2500) {
        this.stop('ENGINE_BROKEN');
      }
    } else {
      this.highRevTime = Date.now();
    }

    if(this.sensors.filter(x => (x <= 0.05 && x >= -0.05)).length) {
      this.car.xVelocity = 0;
      this.car.yVelocity = 0;
      this.car.rpm = 0;
      this.stop('COLLISION');
      return;
    }
    let canTurn = this.car.rpm > 0.0040;

    const pressingUp = this.keyActive('up');
    const pressingDown = this.keyActive('down');

    if (this.car.isThrottling !== pressingUp || this.car.isReversing !== pressingDown) {
      this.car.isThrottling = pressingUp;
      this.car.isReversing = pressingDown;
    }

    const turnLeft = canTurn && this.keyActive('left');
    const turnRight = canTurn && this.keyActive('right');

    if (this.car.isTurningLeft !== turnLeft) {
      this.car.isTurningLeft = turnLeft;
    }
    if (this.car.isTurningRight !== turnRight) {
      this.car.isTurningRight = turnRight;
    }

    const ms = Date.now();
    if (this.lastTime) {
      this.acc += (ms - this.lastTime) / 1000;
      while (this.acc > this.step) {
        this.update();
        this.acc -= this.step;
      }
    }

    const passedCheckpointCw = this.lastX < this.mapStartOffset && this.car.x >= this.mapStartOffset;
    const passedCheckpointCcw = this.lastX >= this.mapStartOffset && this.car.x < this.mapStartOffset;

    if((passedCheckpointCcw || passedCheckpointCw) && this.car.y > 0 && this.car.y <= this.mapStartHeight) {
      let orientation;
      if(this.car.angle > 0 && this.car.angle < 3.14) {
        orientation = 'e';
      }
      if(this.car.angle > 3.14 && this.car.angle < 6.28) {
        orientation = 'w'
      }
      if((orientation === 'e' && passedCheckpointCw) || (orientation === 'w' && passedCheckpointCw)) {
        this.laps++;
        if(winners.length <= 4) {
          winners.push(this);
        }
      }
      if((orientation === 'e' && passedCheckpointCcw) || (orientation === 'w' && passedCheckpointCcw)) {
      // if((orientation === 'e' && passedCheckpointCcw)) {
        this.laps--;
      }
      this.lastChangedLaps = Date.now();
    }
    this.lastX = this.car.x;

    if(this.laps === -1) {
      this.stop('ILLEGAL_CHECKPOINT_PASS');
    }
    if(this.laps === 1) {
      this.stop('LAP_COMPLETED');
    }

    this.lastTime = ms;
  }

  getScore() {
    let score = this.distance;
    score += this.distance / this.lapTime * 1000 * 5;
    if(this.laps === 1) {
      score += 1000;
    }
    return score;
  }

  renderCar() {
    const { x, y, angle } = this.car;
    this.car.el.style.transform = `translate(${x}px, ${y}px) rotate(${angle * 180 / Math.PI}deg)`;
  }

  writeLines(render = true) {
    this.sensorLines = [];
    const angles = [-1.5708, -0.785398, 0, 0.785398, 1.5708];
    this.map.linesContainer.innerHTML = '';
    for(let i in angles) {
      const coords = Geometry.lineByAngle(this.car.angle, this.car.x, this.car.y, angles[i]);
      if(render) {
        this.writeLine(coords);
      }
      this.sensorLines.push(coords);
    }
  }

  writeLine(coords) {
    var svg = this.map.linesContainer;
    var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'line');
    newElement.setAttribute('class', 'line');
    newElement.setAttribute("x1",coords[0]);
    newElement.setAttribute("y1",coords[1]);
    newElement.setAttribute("x2",coords[2]);
    newElement.setAttribute("y2",coords[3]);
    newElement.style.stroke = "black";
    newElement.style.strokeWidth = "0.25px";
    svg.appendChild(newElement);
  }

  getSquareIndex() {
    const p = this.svg.createSVGPoint()
    p.x = this.car.x;
    p.y = this.car.y;
    let squareIndex = 0;
    const squares = this.svg.querySelectorAll('#collision path');
    for(let i = 0; i < squares.length; i++) {
      if(squares[4 - i].isPointInFill(p)) {
        squareIndex = 4 - i;
      }
    }
    return squareIndex;

    const coords = this.map.distanceElement.getAttribute('d').replace('M', '').replace('z', '').split('L').map(x => [x.split(',')[0] * 1, x.split(',')[1] * 1])
  }

  altDistance() {
    for(let i = 0; i < this.map.circuit.length / 2; i ++) {
      var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
      var d = 'M' + this.map.circuit[i][0] + ',' + this.map.circuit[i][1] + 'L' + this.map.circuit[i][2] + ',' + this.map.circuit[i][3] + 'L' + this.map.circuit[9 - i][0] + ',' + this.map.circuit[9 - i][1] + 'L' + this.map.circuit[9 - i][2] + ',' + this.map.circuit[9 - i][3];
      newElement.setAttribute('d', d);
      newElement.setAttribute('fill', 'rgb(' + Math.randomIntBetween(0, 255) + ',' + Math.randomIntBetween(0, 255) + ',' + Math.randomIntBetween(0, 255) + ')');
      newElement.setAttribute('coords', this.map.circuit[i].join(','));
      document.querySelector('#svgroot #collision').appendChild(newElement);
    }
  }

  getCircuit(circuitElement) {
    const lines = [];
    const d = circuitElement.getAttribute('d');
    const paths = d.split('zM');
    paths[0] = paths[0].replace('M', '');
    paths[1] = paths[1].replace('z', '');
    for(let i in paths) {
      const coords = paths[i].trim().split('L').map(coords => coords.split(',').map(coord => coord * 1));
      for(let j in coords) {
        const nextIndex = parseInt(j) + 1 < coords.length ? parseInt(j) + 1 : 0;
        lines.push([...coords[j], ...coords[nextIndex]]);
      }
    }
    return lines;
  }

  getSensors() {
    const sensors = Array.from({length: 5}, () => 1);
    for(let i in this.map.circuit) {
      for(let j in this.sensorLines) {
        const intersect = Geometry.lineIntersect.apply(null, [...this.sensorLines[j], ...this.map.circuit[i]]);
        if(intersect) {
          const value = Geometry.getDistance.apply(null, [...intersect, ...[this.car.x, this.car.y]]) / 150;
          if(sensors[j] === 1 || sensors[j] > value) {
            sensors[j] = value;
          }
        }
      }
    }
    return sensors;
  }

  // getSensors2() {
  //   const sensors = Array.from({length: 5}, () => -1);

  //   const r = this.svg.createSVGRect();
  //   r.x = this.car.x - 150;
  //   r.y = this.car.y - 150;
  //   r.height = 300
  //   r.width = 300;
  //   const intersections = this.svg.getIntersectionList(r, this.collisionElement);

  //   for(let i in this.sensorLines) {
  //     const p = this.svg.createSVGPoint();
  //     p.x = this.sensorLines[i][2];
  //     p.y = this.sensorLines[i][3];
  //     if(false && this.map.path.isPointInFill(p)) {

  //     } else {
  //       for(let j = 0; j < intersections.length; j++) {
  //         const coords = intersections[j].getAttribute('coords').split(',').map(x => x * 1);
  //         const intersect = Geometry.lineIntersect.apply(null, [...this.sensorLines[i], ...coords]);
  //         if(intersect) {
  //           const value = Geometry.getDistance.apply(null, [...intersect, ...[this.car.x, this.car.y]]) / 150;
  //           if(sensors[i] === -1 || sensors[i] > value) {
  //             sensors[i] = value;
  //           }
  //         }
  //       }
  //     }
  //   }
  //   return sensors;
  // }

  getDistance() {
    const path = this.map.distanceElement;
    const totalDistance = path.getTotalLength();

    const i = this.approximateLengthByPoint(0, totalDistance, totalDistance / 20, path, true);
    const j = this.approximateLengthByPoint(i * (totalDistance / 20), (i + 1) * (totalDistance / 20 ), totalDistance / 200, path);
    const k = this.approximateLengthByPoint(j * (totalDistance / 200), (j + 1) * (totalDistance / 200), 1, path);

    let distance = i * (totalDistance / 20) + j * (totalDistance / 200) + k;

    if(this.laps < 0) {
      distance = 0;
    } else {
      distance += this.laps * totalDistance;
    }
    return distance;
  }

  approximateLengthByPoint(start, end, step, path, closed = false) {
    let length = start;
    const distances = [];
    const b = closed ? end : end + 1;
    while(length < b) {
      const p = path.getPointAtLength(length);
      const distance = Geometry.getDistance(p.x, p.y, this.car.x, this.car.y);
      length += step;
      distances.push(distance);
    }
    const index = distances.indexOf(distances.reduce((a,b) => Math.min(a,b)));
    distances[index] = 99999;
    const index2 = distances.indexOf(distances.reduce((a,b) => Math.min(a,b)));
    let i = Math.min(index, index2);
    let a = closed ? 9 : 10;
    if(Math.abs(index - index2) === a) {
      i = 9;
    }
    return i;
  }
}

const Geometry = {
  getAngle: function(points) {
    var AB = Math.sqrt(Math.pow(points[1][0] - points[0][0], 2) + Math.pow(points[1][1] - points[0][1], 2));
    var BC = Math.sqrt(Math.pow(points[1][0] - points[2][0], 2) + Math.pow(points[1][1] - points[2][1], 2));
    var AC = Math.sqrt(Math.pow(points[2][0] - points[0][0], 2) + Math.pow(points[2][1] - points[0][1], 2));
    return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
  },

  radToDeg: function(radians) {
    return radians * (180 / Math.PI);
  },

  lineIntersect: function(x1, y1, x2, y2, x3, y3, x4, y4) {
    let ua, ub, denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom == 0) {
      return null;
    }
    ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if(ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return [
        x1 + ua * (x2 - x1),
        y1 + ua * (y2 - y1),
      ];
    } else {
      return false;
    }
  },

  lineByAngle: function(objectAngle, x, y, offset = 0) {
    const angle = objectAngle % 6.28319 + offset;
    return [x, y, x + Math.sin(angle) * 150, y + Math.cos(angle) * -150];
  },

  getDistance(p1x, p1y, p2x, p2y) {
    return Math.sqrt(Math.pow(p1x - p2x, 2) + Math.pow(p1y - p2y, 2));
  },

  getPointOnLine(points) {
    const angle = this.getAngle(points);
    const distance = this.getDistance(points[2][0], points[2][1], points[0][0], points[0][1]);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    return [cosAngle * cosAngle * distance, cosAngle * sinAngle * distance];
  },
}
