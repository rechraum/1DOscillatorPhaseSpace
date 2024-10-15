let oscillators = [];
let selectedOscillator = null;

function setup() {
  // Create a canvas that fills the window
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container');

  // Ensure the canvas has the correct positioning
  canvas.style('position', 'absolute');
  canvas.style('top', '0');
  canvas.style('left', '0');

  // Add event listeners to buttons
  document.getElementById('addOscillator').addEventListener('click', addOscillator);
  document.getElementById('clearOscillators').addEventListener('click', clearOscillators);
}

function draw() {
  updateDeltaTime();

  background(220);

  // Draw dividing line
  stroke(0);
  line(width / 2, 0, width / 2, height);

  // Define static global min and max values based on slider limits
  const minAmplitude = 10;
  const maxAmplitude = 200;
  const minFrequency = 0.1;
  const maxFrequency = 1.0;

  const minDisplacement = -maxAmplitude;
  const maxDisplacement = maxAmplitude;

  const minAngularFrequency = TWO_PI * minFrequency;
  const maxAngularFrequency = TWO_PI * maxFrequency;

  const maxVelocity = maxAmplitude * maxAngularFrequency;
  const minVelocity = -maxVelocity;

  // Draw axes on the phase space visualization using static global min and max
  drawPhaseSpaceAxes(minDisplacement, maxDisplacement, minVelocity, maxVelocity);

  // Update and display each oscillator
  for (let oscillator of oscillators) {
    oscillator.update();
    oscillator.display();
    oscillator.displayPhaseSpace(minDisplacement, maxDisplacement, minVelocity, maxVelocity);
  }
}

// Oscillator Class
class Oscillator {
  constructor() {
    this.angle = random(0, TWO_PI);
    this.amplitude = random(50, 150);
    this.frequency = random(0.1, 1.0); // Frequency in Hz
    this.angularFrequency = TWO_PI * this.frequency; // Angular frequency in radians/sec
    this.color = color(random(100, 255), random(100, 255), random(100, 255));

    // Unit vector in the direction of the angle
    this.direction = createVector(cos(this.angle), sin(this.angle));

    this.timeOffset = random(0, TWO_PI); // Random phase offset
    this.position = createVector(0, 0);
    this.displacement = 0;
    this.velocity = 0;
    this.path = []; // For phase space trajectory
    this.maxPathLength = 500;

    // Create sliders for this oscillator
    this.createSliders();

    // Flag to reset phase space when parameters change
    this.parametersChanged = false;
  }

  update() {
    let time = millis() / 1000; // Time in seconds

    if (this.parametersChanged) {
      // Reset path when parameters change
      this.path = [];
      this.angularFrequency = TWO_PI * this.frequency;
      this.parametersChanged = false;
    }

    // Calculate displacement along the line
    this.displacement = this.amplitude * cos(this.angularFrequency * time + this.timeOffset);

    // Position vector in 2D space
    this.position = p5.Vector.mult(this.direction, this.displacement);

    // Calculate velocity along the line
    this.velocity = -this.angularFrequency * this.amplitude * sin(this.angularFrequency * time + this.timeOffset);

    // Store displacement and velocity for phase space
    this.path.push({ x: this.displacement, y: this.velocity });
    if (this.path.length > this.maxPathLength) {
      this.path.shift(); // Limit path length
    }
  }

  display() {
    // Draw oscillator on the left half of the canvas
    fill(this.color);
    noStroke();
    ellipse(this.position.x + width / 4, this.position.y + height / 2, 10, 10);

    // Draw the line of oscillation
    stroke(this.color);
    strokeWeight(1);
    let lineLength = 200; // Reduced length to ensure the line doesn't cross over phase space
    let lineStart = p5.Vector.mult(this.direction, -lineLength);
    let lineEnd = p5.Vector.mult(this.direction, lineLength);
    line(
      lineStart.x + width / 4,
      lineStart.y + height / 2,
      lineEnd.x + width / 4,
      lineEnd.y + height / 2
    );
  }

  displayPhaseSpace(minDisplacement, maxDisplacement, minVelocity, maxVelocity) {
    // Plot displacement vs. velocity on the right half of the canvas
    noFill();
    stroke(this.color);
    beginShape();
    for (let point of this.path) {
      let x = map(
        point.x,
        minDisplacement,
        maxDisplacement,
        width / 2 + 40,
        width - 40
      );
      let y = map(
        point.y,
        minVelocity,
        maxVelocity,
        height - 40,
        40
      );
      vertex(x, y);
    }
    endShape();
  }

  createSliders() {
    const slidersDiv = document.getElementById('sliders');

    // Create a container for this oscillator's sliders
    this.sliderGroup = document.createElement('div');
    this.sliderGroup.className = 'slider-group';

    // Angle Slider
    this.angleSlider = this.createSliderControl('Angle', 0, TWO_PI, this.angle, 0.01);

    // Amplitude Slider
    this.amplitudeSlider = this.createSliderControl('Amplitude', 10, 200, this.amplitude, 1);

    // Frequency Slider (0.1 Hz to 1 Hz)
    this.frequencySlider = this.createSliderControl('Frequency', 0.1, 1.0, this.frequency, 0.01);

    // Append sliders to the group
    this.sliderGroup.appendChild(this.angleSlider.container);
    this.sliderGroup.appendChild(this.amplitudeSlider.container);
    this.sliderGroup.appendChild(this.frequencySlider.container);

    // Append the group to the sliders div
    slidersDiv.appendChild(this.sliderGroup);
  }

  createSliderControl(labelText, min, max, value, step) {
    const container = document.createElement('div');

    const label = document.createElement('label');
    label.innerText = labelText;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;

    // Update oscillator property when slider changes
    slider.addEventListener('input', () => {
      let val = parseFloat(slider.value);
      this[labelText.toLowerCase()] = val;

      // Set flag to reset phase space trajectory
      this.parametersChanged = true;

      if (labelText === 'Angle') {
        // Update direction vector
        this.direction = createVector(cos(this.angle), sin(this.angle));
      } else if (labelText === 'Frequency') {
        // Update angular frequency
        this.angularFrequency = TWO_PI * this.frequency;
      } else if (labelText === 'Amplitude') {
        // Update displacement range and velocity range accordingly
        // Not necessary here, as we're using static global min and max values
        // But we set parametersChanged to true to reset the path
      }
    });

    container.appendChild(label);
    container.appendChild(slider);

    return { container, slider };
  }

  // Remove sliders when oscillator is deleted
  removeSliders() {
    this.sliderGroup.remove();
  }
}

// Function to add a new oscillator
function addOscillator() {
  const oscillator = new Oscillator();
  oscillators.push(oscillator);
}

// Function to clear all oscillators
function clearOscillators() {
  // Remove sliders
  for (let oscillator of oscillators) {
    oscillator.removeSliders();
  }
  oscillators = [];
}

// Handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Variables to store deltaTime in milliseconds and seconds
let deltaTimeMillis = 0;
let deltaTimeSeconds = 0;
let lastTime = 0;

function updateDeltaTime() {
  let currentTime = millis();
  deltaTimeMillis = currentTime - lastTime;
  deltaTimeSeconds = deltaTimeMillis / 1000;
  lastTime = currentTime;
}

// Function to draw axes on the phase space visualization
function drawPhaseSpaceAxes(minDisplacement, maxDisplacement, minVelocity, maxVelocity) {
  stroke(0);
  strokeWeight(1);

  // Displacement axis (horizontal)
  line(width / 2 + 40, height / 2, width - 40, height / 2);
  // Velocity axis (vertical)
  line(width * 3 / 4, 40, width * 3 / 4, height - 40);

  // Axis labels
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(14);

  // Labels for displacement axis
  text('Displacement', (width / 2 + width - 40) / 2, height / 2 + 30);
  text('0', width * 3 / 4, height / 2 + 20);
  textAlign(RIGHT, CENTER);
  text(
    '+' + nf(maxDisplacement, 1, 0),
    width - 45,
    height / 2 + 20
  );
  textAlign(LEFT, CENTER);
  text(
    nf(minDisplacement, 1, 0),
    width / 2 + 45,
    height / 2 + 20
  );

  // Labels for velocity axis
  textAlign(CENTER, BOTTOM);
  text('Velocity', width * 3 / 4, 30);
  textAlign(CENTER, TOP);
  text('0', width * 3 / 4 + 20, height / 2);
  text(
    '+' + nf(maxVelocity, 1, 0),
    width * 3 / 4 + 20,
    45
  );
  text(
    nf(minVelocity, 1, 0),
    width * 3 / 4 + 20,
    height - 45
  );
}
