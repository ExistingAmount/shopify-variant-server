let scene, camera, renderer, controls, box;
let uiVisible = true;
let cartItems = 0;

init();
drawBox();

function addToCart() {
  cartItems++;
  alert(`Box added to cart! You now have ${cartItems} item(s) in your cart.`);
  
  const button = document.querySelector('.add-to-cart-btn');
  const originalText = button.textContent;
  
  button.textContent = "ADDED!";
  button.style.background = "#28A745";
  
  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = "#1F7941";
  }, 1500);
}

function updateCostPosition() {
  const costDisplay = document.querySelector('.cost-display');
  const uiContainer = document.getElementById('ui');
  
  costDisplay.style.left = '50%';
  costDisplay.style.transform = 'translateX(-50%)';
}

function calculateTotalCost() {
  const widthA = parseFloat(document.getElementById('widthA').value);
  const widthB = parseFloat(document.getElementById('widthB').value);
  const height = parseFloat(document.getElementById('height').value);
  
  const dimensionCost = (widthA + widthB + height) * 1.9;
  
  const endCapNeeded = document.querySelector('input[name="endCap"]:checked').value === 'yes';
  const endCapCost = endCapNeeded ? 12.5 : 0;
  
  const zipDigit = document.querySelector('input[name="zipDigit"]:checked').value;
  let shippingCost = 0;
  
  switch(zipDigit) {
    case '0': shippingCost = 35; break;
    case '1': shippingCost = 25; break;
    case '2': shippingCost = 35; break;
    case '3': shippingCost = 45; break;
    case '4': shippingCost = 45; break;
    case '5': shippingCost = 35; break;
    case '6': shippingCost = 55; break;
    case '7': shippingCost = 60; break;
    case '8': shippingCost = 65; break;
    case '9': shippingCost = 70; break;
    default: shippingCost = 35;
  }
  
  const totalCost = dimensionCost + endCapCost + shippingCost;
  
  document.querySelector('.cost-display span').textContent = `TOTAL COST: $${totalCost.toFixed(2)}`;
  
  return totalCost;
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x333333);
  
  camera = new THREE.PerspectiveCamera(75, getAspectRatio(), 0.1, 1000);
  camera.position.set(15, 15, 20);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(getCanvasWidth(), getCanvasHeight());
  document.getElementById('canvas-container').appendChild(renderer.domElement);
  
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  
  const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
  light1.position.set(5, 5, 5);
  scene.add(light1);
  
  const light2 = new THREE.DirectionalLight(0xffffff, 0.8);
  light2.position.set(-5, -2, -5);
  scene.add(light2);
  
  const light3 = new THREE.DirectionalLight(0xffffff, 0.6);
  light3.position.set(0, 10, 0);
  scene.add(light3);
  
  scene.add(new THREE.AmbientLight(0xaaaaaa, 0.5));
  
  animate();
  
  window.addEventListener('resize', onWindowResize);
  
  updateCostPosition();
  
  calculateTotalCost();
}

function getCanvasWidth() {
  const container = document.getElementById('canvas-container');
  return container.clientWidth;
}

function getCanvasHeight() {
  const container = document.getElementById('canvas-container');
  return container.clientHeight;
}

function getAspectRatio() {
  return getCanvasWidth() / getCanvasHeight();
}

function drawBox() {
  const widthA = parseFloat(document.getElementById('widthA').value);
  const widthB = parseFloat(document.getElementById('widthB').value);
  const height = parseFloat(document.getElementById('height').value);
  const endCapNeeded = document.querySelector('input[name="endCap"]:checked').value === 'yes';
  
  const width = widthA;
  const length = height;
  const boxHeight = widthB;
  
  const wallThickness = 0.125;
  
  if (box) {
    scene.remove(box);
  }
  
  box = new THREE.Group();
  
  const material = new THREE.MeshStandardMaterial({ 
    color: 0xB5C0C9,
    side: THREE.DoubleSide
  });
  
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  
  const topGeometry = new THREE.BoxGeometry(width, wallThickness, length);
  const topMesh = new THREE.Mesh(topGeometry, material);
  topMesh.position.y = boxHeight/2 - wallThickness/2;
  
  const bottomGeometry = new THREE.BoxGeometry(width, wallThickness, length);
  const bottomMesh = new THREE.Mesh(bottomGeometry, material);
  bottomMesh.position.y = -boxHeight/2 + wallThickness/2;
  
  const leftGeometry = new THREE.BoxGeometry(wallThickness, boxHeight - 2*wallThickness, length);
  const leftMesh = new THREE.Mesh(leftGeometry, material);
  leftMesh.position.x = -width/2 + wallThickness/2;
  
  const rightGeometry = new THREE.BoxGeometry(wallThickness, boxHeight - 2*wallThickness, length);
  const rightMesh = new THREE.Mesh(rightGeometry, material);
  rightMesh.position.x = width/2 - wallThickness/2;
  
  box.add(topMesh);
  box.add(bottomMesh);
  box.add(leftMesh);
  box.add(rightMesh);
  
  if (endCapNeeded) {
    const frontGeometry = new THREE.BoxGeometry(width, boxHeight, wallThickness);
    const frontMesh = new THREE.Mesh(frontGeometry, material);
    frontMesh.position.z = length/2 - wallThickness/2;
    box.add(frontMesh);
  }
  
  const outerGeometry = new THREE.BoxGeometry(width, boxHeight, length);
  const outerEdges = new THREE.EdgesGeometry(outerGeometry);
  const outerWireframe = new THREE.LineSegments(outerEdges, lineMaterial);
  
  const innerGeometry = new THREE.BoxGeometry(
    width - 2 * wallThickness, 
    boxHeight - 2 * wallThickness, 
    length - (endCapNeeded ? 2 * wallThickness : 0)
  );
  const innerEdges = new THREE.EdgesGeometry(innerGeometry);
  const innerWireframe = new THREE.LineSegments(innerEdges, lineMaterial);
  
  box.add(outerWireframe);
  box.add(innerWireframe);
  
  scene.add(box);
  
  calculateTotalCost();
}

function resetView() {
  document.getElementById('widthA').value = 14;
  document.getElementById('widthB').value = 8;
  document.getElementById('height').value = 20;
  
  document.querySelector('input[name="lipSize"][value="0.25"]').checked = true;
  document.querySelector('input[name="endCap"][value="no"]').checked = true;
  document.querySelector('input[name="zipDigit"][value="0"]').checked = true;
  
  camera.position.set(15, 15, 20);
  controls.target.set(0, 0, 0);
  controls.update();
  
  drawBox();
  
  calculateTotalCost();
}

function validateInput(input) {
  let value = parseFloat(input.value);
  
  if (!isNaN(value)) {
    if (value < parseFloat(input.min)) {
      value = parseFloat(input.min);
    } else if (value > parseFloat(input.max)) {
      value = parseFloat(input.max);
    }
    
    value = Math.round(value * 1000) / 1000;
    
    input.value = value;
    
    drawBox();
    
    calculateTotalCost();
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = getAspectRatio();
  camera.updateProjectionMatrix();
  renderer.setSize(getCanvasWidth(), getCanvasHeight());
  
  updateCostPosition();
}