import Core from '../core';
import { MESSAGE_TYPE_INTERACTIVEMARKER_UPDATE } from '../utils/constants';
import Cube from '../primitives/Cube';
import InteractiveMarkerInit from './InteractiveMarkerInit';

class InteractiveMarkers extends Core {
  constructor(ros, topicName, options = {}) {
    super(ros, topicName, MESSAGE_TYPE_INTERACTIVEMARKER_UPDATE);

    this.options = options;

    this.object = new THREE.Object3D();
    this.object.isInteractiveMarker = true;
    this.object.name = 'InteractiveMarker';

    this.onInitSuccess = this.onInitSuccess.bind(this);

    const initTopicName = `${topicName}_full`;
    const { scene } = this.options;
    const initOptions = {
      onInitSuccess: this.onInitSuccess,
      object: this.object,
      ...options,
    };
    this.interactiveMarkerInit = new InteractiveMarkerInit(ros, initTopicName, initOptions);
    this.interactiveMarkerInit.subscribe();
  }

  testTransformControls() {
    const box = new Cube();
    box.setColor(new THREE.Color('#ff0000'));
    this.object.add(box);
    this.attachTransformControls(box);
  }

  onInitSuccess() {
    this.initSucess = true;
  }

  attachTransformControls(object) {
    const transformControls = new TransformControls(object, this.options);
    transformControls.enable6DOF('local');
  }

  update(message) {
    if (this.initSucess) {
    }
  }
}

export default InteractiveMarkers;
