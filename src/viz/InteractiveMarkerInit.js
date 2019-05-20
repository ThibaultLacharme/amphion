import Core from '../core';
import { MESSAGE_TYPE_INTERACTIVEMARKER_INIT } from '../utils/constants';
import Group from '../primitives/Group';
import Marker from './Marker';

const { THREE } = window;

class InteractiveMarkerInit extends Core {
  constructor(ros, topicName, options = {}) {
    super(ros, topicName, MESSAGE_TYPE_INTERACTIVEMARKER_INIT);

    this.options = options;

    const { onInitSuccess } = options;
    const { object } = options;

    this.object = object;
    this.callback = onInitSuccess;
  }


  processMarker(marker) {
    const markerViz = new Marker();
    markerViz.update(marker);
    return markerViz;
  }

  processControls(controls) {

  }


  updateMarkers(message) {
    console.log(message);

    const { markers } = message;

    markers.forEach((marker) => {
      const { pose: { position: translation, orientation: rotation } } = marker;
      const object = new Group();
      const { controls, name } = marker;

      object.name = name;
      object.setTransform({ translation, rotation });

      controls.forEach((control) => {
        const { markers: controlMarkers } = control;

        if (control.markers.length) {
          controlMarkers.forEach((controlMarker) => {
            const markerObject = this.processMarker(controlMarker);

            object.add(markerObject.object);
          });
        }
      });

      const { header: { frame_id: frameId } } = marker;
      const { scene } = this.options;
      const frameObject = scene.getObjectByName(frameId);

      console.log(frameId);

      frameObject.add(object);
    });
  }

  update(message) {
    this.updateMarkers(message);
    this.unsubscribe();
    this.callback();
  }
}

export default InteractiveMarkerInit;
