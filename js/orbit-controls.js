function OrbitControls(object, domElement) {
  this.object = object;
  this.domElement = domElement;
  this.enableDamping = false;
  this.dampingFactor = 0.05;
  
  this.minDistance = 0;
  this.maxDistance = Infinity;
  
  this.minPolarAngle = 0;
  this.maxPolarAngle = Math.PI;
  
  this.target = new THREE.Vector3();
  
  const STATE = { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2 };
  let state = STATE.NONE;
  
  const EPS = 0.000001;
  const spherical = new THREE.Spherical();
  const sphericalDelta = new THREE.Spherical();
  
  let scale = 1;
  const panOffset = new THREE.Vector3();
  let zoomChanged = false;
  
  const rotateStart = new THREE.Vector2();
  const rotateEnd = new THREE.Vector2();
  const rotateDelta = new THREE.Vector2();
  
  const panStart = new THREE.Vector2();
  const panEnd = new THREE.Vector2();
  const panDelta = new THREE.Vector2();
  
  const dollyStart = new THREE.Vector2();
  const dollyEnd = new THREE.Vector2();
  const dollyDelta = new THREE.Vector2();
  
  const scope = this;
  
  function handleMouseDownRotate(event) {
    rotateStart.set(event.clientX, event.clientY);
  }
  
  function handleMouseMoveRotate(event) {
    rotateEnd.set(event.clientX, event.clientY);
    rotateDelta.subVectors(rotateEnd, rotateStart);
    
    const element = scope.domElement;
    sphericalDelta.theta -= 2 * Math.PI * rotateDelta.x / element.clientWidth;
    sphericalDelta.phi -= 2 * Math.PI * rotateDelta.y / element.clientHeight;
    
    rotateStart.copy(rotateEnd);
    scope.update();
  }
  
  function onMouseDown(event) {
    event.preventDefault();
    
    if (event.button === 0) {
      state = STATE.ROTATE;
      handleMouseDownRotate(event);
    }
    
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseup', onMouseUp, false);
  }
  
  function onMouseMove(event) {
    event.preventDefault();
    
    if (state === STATE.ROTATE) {
      handleMouseMoveRotate(event);
    }
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);
    state = STATE.NONE;
  }
  
  function onMouseWheel(event) {
    event.preventDefault();
    
    if (event.deltaY < 0) {
      scale /= 1.1;
    } else {
      scale *= 1.1;
    }
    
    zoomChanged = true;
    scope.update();
  }
  
  this.domElement.addEventListener('mousedown', onMouseDown, false);
  this.domElement.addEventListener('wheel', onMouseWheel, false);
  
  this.update = function() {
    const position = scope.object.position;
    
    const offset = new THREE.Vector3();
    offset.copy(position).sub(scope.target);
    
    spherical.setFromVector3(offset);
    
    spherical.theta += sphericalDelta.theta;
    spherical.phi += sphericalDelta.phi;
    
    spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
    spherical.makeSafe();
    
    if (zoomChanged) {
      spherical.radius *= scale;
      spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));
      zoomChanged = false;
    }
    
    if (scope.enableDamping) {
      sphericalDelta.theta *= (1 - scope.dampingFactor);
      sphericalDelta.phi *= (1 - scope.dampingFactor);
    } else {
      sphericalDelta.set(0, 0, 0);
    }
    
    scale = 1;
    
    offset.setFromSpherical(spherical);
    position.copy(scope.target).add(offset);
    scope.object.lookAt(scope.target);
  };
  
  this.reset = function() {
    sphericalDelta.set(0, 0, 0);
    panOffset.set(0, 0, 0);
    scale = 1;
    zoomChanged = false;
  };
}