import Core from '../core';
import { INTERACTION_MODES, ORIENTATION_MODES, MESSAGE_TYPE_INTERACTIVEMARKER_INIT } from '../utils/constants';
import Group from '../primitives/Group';
import Marker from './Marker';
import TransformControl, { AXIS_MAP, ROTATE_MAP, PLANE_MAP } from '../utils/TransformControl';
import Axes from '../primitives/Axes';


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

  processControls(transformControl, control) {
    const { interaction_mode: interactionMode, orientation_mode: orientationMode } = control;
    const { orientation } = control;

    transformControl.setSpace(orientationMode === ORIENTATION_MODES.FIXED ? 'world' : 'local');

    switch (interactionMode) {
      case INTERACTION_MODES.MOVE_AXIS:
        if (orientation.x) {
          transformControl.showTranslateGizmo(AXIS_MAP.X, true);
        } else if (orientation.y) {
          transformControl.showTranslateGizmo(AXIS_MAP.Y, true);
        } else {
          transformControl.showTranslateGizmo(AXIS_MAP.Z, true);
        }
        break;
      case INTERACTION_MODES.MOVE_PLANE:
        transformControl.showPlaneTranslateGizmo(PLANE_MAP.YZ, true);
        break;
      case INTERACTION_MODES.ROTATE_AXIS:
        if (orientationMode === ORIENTATION_MODES.VIEW_FACING) {
          transformControl.showRotateGizmo(ROTATE_MAP.E, true);
        } else {
          transformControl.setSpace(orientationMode === ORIENTATION_MODES.FIXED ? 'world' : 'local');
          if (orientation.x) {
            transformControl.showRotateGizmo(ROTATE_MAP.RX, true);
          } else if (orientation.y) {
            transformControl.showRotateGizmo(ROTATE_MAP.RY, true);
          } else {
            transformControl.showRotateGizmo(ROTATE_MAP.RZ, true);
          }
        }
        break;
      case INTERACTION_MODES.MOVE_ROTATE:
        break;
      case INTERACTION_MODES.MOVE_3D:
        transformControl.showPlaneTranslateGizmo(PLANE_MAP.XYZ, true);
        break;
      case INTERACTION_MODES.ROTATE_3D:
        transformControl.showRotateGizmo(ROTATE_MAP.XYZE, true);
        break;
      case INTERACTION_MODES.MOVE_ROTATE_3D:
        break;
    }
  }


  updateMarkers(message) {
    console.log(message);

    const { markers } = message;

    markers.forEach((marker) => {
      const transformControl = new TransformControl(this.options);
      const object = new Group();
      object.add(new Axes(0.01, 0.5));
      const {
        pose: { position: translation, orientation: rotation },
        controls,
        name
      } = marker;

      // This object should be transform controls
      if (rotation.w === 0) {
        rotation.w = 1;
      }

      object.name = name;
      object.setTransform({ translation, rotation });


      controls.forEach((control) => {
        const { markers: controlMarkers } = control;

        this.processControls(transformControl, control);

        controlMarkers.forEach((controlMarker) => {
          const markerObject = this.processMarker(controlMarker);

          object.add(markerObject.object);
        });
      });

      const { header: { frame_id: frameId } } = marker;
      const { scene } = this.options;
      const frameObject = scene.getObjectByName(frameId);

      transformControl.attachObject(object);
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
