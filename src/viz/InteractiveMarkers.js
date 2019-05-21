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

  onInitSuccess() {
    this.initSucess = true;
  }

  update(message) {
    const { type } = message;

    // If markers are initialized and type is update i.e 1
    if (this.initSucess && type === 1) {
      this.interactiveMarkerInit.initMarkers(message);
      this.interactiveMarkerInit.updatePose(message);
      this.interactiveMarkerInit.erase(message);
    }
  }
}

export default InteractiveMarkers;
