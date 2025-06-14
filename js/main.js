let scene, camera, renderer, controls, box;
let uiVisible = true;

init();
drawBox();
calculateTotalCost();

async function addToCart() {
  const widthA = document.getElementById('widthA').value;
  const widthB = document.getElementById('widthB').value;
  const height = document.getElementById('height').value;
  const lipSize = document.querySelector('input[name="lipSize"]:checked').value;
  const endCap = document.querySelector('input[name="endCap"]:checked').value;
  const zipDigit = document.querySelector('input[name="zipDigit"]:checked').value;

  const optionValue = `W${widthA}xB${widthB}xH${height} - Lip:${lipSize}" - EndCap:${endCap} - Zip:${zipDigit}`;
  const dimensionCost = (parseFloat(widthA) + parseFloat(widthB) + parseFloat(height)) * 1.9;
  const endCapCost = endCap === 'yes' ? 12.5 : 0;

  let shippingCost = 35;
  switch (zipDigit) {
    case '1': shippingCost = 25; break;
    case '3':
    case '4': shippingCost = 45; break;
    case '5': shippingCost = 35; break;
    case '6': shippingCost = 55; break;
    case '7': shippingCost = 60; break;
    case '8': shippingCost = 65; break;
    case '9': shippingCost = 70; break;
    default: shippingCost = 35;
  }

  const totalPrice = dimensionCost + endCapCost + shippingCost;

  try {
    const response = await fetch('https://shopify-custom-plenum.onrender.com/create-variant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: "10105912983867",
        optionValues: [optionValue],
        price: totalPrice.toFixed(2)
      })
    });

    const data = await response.json();

    if (data && data.variant && data.variant.id) {
      const variantId = data.variant.id;
      window.location.href = `https://1b1d86-3.myshopify.com/cart/${variantId}:1`;
    } else {
      alert("Variant creation failed. Check console.");
      console.log(data);
    }
  } catch (err) {
    alert("Something went wrong.");
    console.error(err);
  }
}

function calculateTotalCost() {
  const widthA = parseFloat(document.getElementById('widthA').value);
  const widthB = parseFloat(document.getElementById('widthB').value);
  const height = parseFloat(document.getElementById('height').value);
  const endCap = document.querySelector('input[name="endCap"]:checked').value;
  const zipDigit = document.querySelector('input[name="zipDigit"]:checked').value;

  const dimensionCost = (widthA + widthB + height) * 1.9;
  const endCapCost = endCap === 'yes' ? 12.5 : 0;

  let shippingCost = 35;
  switch (zipDigit) {
    case '1': shippingCost = 25; break;
    case '3':
    case '4': shippingCost = 45; break;
    case '5': shippingCost = 35; break;
    case '6': shippingCost = 55; break;
    case '7': shippingCost = 60; break;
    case '8': shippingCost = 65; break;
    case '9': shippingCost = 70; break;
    default: shippingCost = 35;
  }

  const total = dimensionCost + endCapCost + shippingCost;
  document.getElementById('costDisplay').innerText = `Total: $${total.toFixed(2)}`;
  return total;
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / 400, 0.1, 1000);
  camera.position.set(12, 10, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, 400);
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const light1 = new THREE.DirectionalLight(0xffffff, 1);
  light1.position.set(10, 10, 10);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
  light2.position.set(-10, -10, -10);
  scene.add(light2);

  scene.add(new THREE.AmbientLight(0x404040));

  animate();

  document.getElementById('widthA').addEventListener('input', () => {
    drawBox();
    calculateTotalCost();
  });

  document.getElementById('widthB').addEventListener('input', () => {
    drawBox();
    calculateTotalCost();
  });

  document.getElementById('height').addEventListener('input', () => {
    drawBox();
    calculateTotalCost();
  });

  document.querySelectorAll('input[name="endCap"]').forEach(input => {
    input.addEventListener('change', () => {
      drawBox();
      calculateTotalCost();
    });
  });

  document.querySelectorAll('input[name="zipDigit"]').forEach(input => {
    input.addEventListener('change', calculateTotalCost);
  });

  document.querySelectorAll('input[name="lipSize"]').forEach(input => {
    input.addEventListener('change', drawBox);
  });
}

function drawBox() {
  const widthA = parseFloat(document.getElementById('widthA').value);
  const widthB = parseFloat(document.getElementById('widthB').value);
  const height = parseFloat(document.getElementById('height').value);

  if (box) {
    scene.remove(box);
  }

  box = new THREE.Mesh(
    new THREE.BoxGeometry(widthA, widthB, height),
    new THREE.MeshStandardMaterial({ color: 0x999999 })
  );

  scene.add(box);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
