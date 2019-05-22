const { THREE } = window;

export const AXIS_MAP = {
  X: 'X',
  Y: 'Y',
  Z: 'Z',
};

export const PLANE_MAP = {
  XY: 'XY',
  YZ: 'YZ',
  XZ: 'XZ',
  XYZ: 'XYZ',
};

export const ROTATE_MAP = {
  RX: 'RX',
  RY: 'RY',
  RZ: 'RZ',
  XYZE: 'XYZE',
  E: 'E',
};

const SPACE = {
  LOCAL: 'local',
  WORLD: 'world',
}

class TransformControls {
  constructor(options) {
    const {
      domElement,
      camera,
      scene,
      orbitControls,
      onMouseDown,
      onMouseUp,
      onObjectChange,
    } = options;

    this.object = null;
    this.domElement = domElement;
    this.camera = camera;
    this.scene = scene;
    this.orbitControls = orbitControls;

    this.onObjectChange = onObjectChange;
    this.onMouseDown = onMouseDown;
    this.onMouseUp = onMouseUp;

    this.initTransformControls();
  }

  disable(value) {
    if (!value) {
      this.attachObject(this.object);
    } else {
      this.detachObject();
    }
  }

  initTransformControls() {
    const transformControls = new THREE.TransformControls(
      this.camera,
      this.domElement.current,
    );
    transformControls.setSpace('local');

    transformControls.addEventListener('objectChange', () => {
      this.onObjectChange(this.object);
    });

    transformControls.addEventListener('mouseDown', () => {
      this.orbitControls.enabled = false;
      this.onMouseDown(this.object);
    });

    transformControls.addEventListener('mouseUp', () => {
      this.orbitControls.enabled = true;
      this.onMouseUp();
    });

    this.transformControls = transformControls;
    this.scene.add(this.transformControls);
    this.transformControls.setMode('combined');
  }

  attachObject(object) {
    this.object = object;
    this.transformControls.attach(this.object);
  }

  detachObject() {
    if (this.object) {
      this.transformControls.detach(this.object);
    }
  }

  setSpace(space) {
    this.transformControls.setSpace(space);
  }

  showTranslateGizmo(axis, flag) {
    switch (axis) {
      case AXIS_MAP.X:
        this.transformControls.showX = flag;
        break;
      case AXIS_MAP.Y:
        this.transformControls.showY = flag;
        break;
      case AXIS_MAP.Z:
        this.transformControls.showZ = flag;
        break;
      default:
        break;
    }
  }

  showPlaneTranslateGizmo(plane, flag) {
    switch (plane) {
      case PLANE_MAP.XY:
        this.transformControls.showXY = flag;
        break;
      case PLANE_MAP.YZ:
        this.transformControls.showYZ = flag;
        break;
      case PLANE_MAP.XZ:
        this.transformControls.showXZ = flag;
        break;
      case PLANE_MAP.XYZ:
        this.transformControls.showXYZ = flag;
        break;
      default:
        break;
    }
  }

  showRotateGizmo(axis, flag) {
    switch (axis) {
      case ROTATE_MAP.RX:
        this.transformControls.showRX = flag;
        break;
      case ROTATE_MAP.RY:
        this.transformControls.showRY = flag;
        break;
      case ROTATE_MAP.RZ:
        this.transformControls.showRZ = flag;
        break;
      case ROTATE_MAP.E:
        this.transformControls.showRE = flag;
        break;
      case ROTATE_MAP.XYZE:
        this.transformControls.showRXYZE = flag;
        break;
      default:
        break;
    }
  }

  toggle3DMove(flag) {
    this.showPlaneTranslateGizmo(PLANE_MAP.XYZ, true);
  }

  toggle3DRotate(flag) {
    this.showRotateGizmo(ROTATE_MAP.XYZE, true);
  }

  showAllTranslateAxis() {
    this.showTranslateGizmo(AXIS_MAP.X, true);
    this.showTranslateGizmo(AXIS_MAP.Y, true);
    this.showTranslateGizmo(AXIS_MAP.Z, true);
  }

  showAllRotateAxis() {
    this.showRotateGizmo(AXIS_MAP.X, true);
    this.showRotateGizmo(AXIS_MAP.Y, true);
    this.showRotateGizmo(AXIS_MAP.Z, true);
  }

  enable6DOF(space) {
    this.transformControls.setSpace(space);
    this.showAllTranslateAxis();
    this.showAllRotateAxis();
  }
}

export default TransformControls;
