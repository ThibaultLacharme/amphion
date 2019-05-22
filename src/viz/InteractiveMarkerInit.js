import ROSLIB from 'roslib';
import Core from '../core';
import {
  INTERACTION_MODES,
  ORIENTATION_MODES,
  FEEDBACK_EVENT_TYPES,
  MESSAGE_TYPE_INTERACTIVEMARKER_INIT,
  MESSAGE_TYPE_INTERACTIVEMARKER_FEEDBACK
} from '../utils/constants';
import Group from '../primitives/Group';
import Marker from './Marker';
import TransformControl, { AXIS_MAP, ROTATE_MAP, PLANE_MAP } from '../utils/TransformControl';
import Axes from '../primitives/Axes';


const { THREE } = window;

class InteractiveMarkerInit extends Core {
  constructor(ros, topicName, options = {}) {
    super(ros, topicName, MESSAGE_TYPE_INTERACTIVEMARKER_INIT);

    this.options = options;
    this.objectMap = {};

    const { onInitSuccess } = options;

    this.callback = onInitSuccess;
    this.onceMouseDownFlag = true;

    this.onTMouseDown = this.onTMouseDown.bind(this);
    this.onTMouseUp = this.onTMouseUp.bind(this);
    this.onObjectChange = this.onObjectChange.bind(this);


    this.transformCtrlOptions = {
      onMouseDown: this.onTMouseDown,
      onMouseUp: this.onTMouseUp,
      onObjectChange: this.onObjectChange,
      ...this.options,
    };
  }

  onTMouseDown (object) {
    if (object) {

      for(const entry in this.objectMap) {
        const { object: currentObj, controls } = this.objectMap[entry];
        if (currentObj.name !== object.name) {
          controls.disable(true);
        }
      }
    }
  }

  onTMouseUp() {
    for(const entry in this.objectMap) {
      const { controls } = this.objectMap[entry];
      controls.disable(false);
    }
  }

  onObjectChange(object) {
    if (object) {
      const { name, position, quaternion } = object;
      const { marker } = this.objectMap[name];
      const pose = {
        position,
        orientation: {
          x: quaternion.x,
          y: quaternion.y,
          z: quaternion.z,
          w: quaternion.w,
        },
      };
      const feedbackTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/basic_controls/feedback',
        MESSAGE_TYPE_INTERACTIVEMARKER_FEEDBACK,
      });
      const msg = {
        header: {
          frame_id: object.parent.name,
        },
        marker_name:  name,
        client_id: 'testing',
        event_type: FEEDBACK_EVENT_TYPES.POSE_UPDATE,
        pose
      };
      const feedbackMsg = new ROSLIB.Message({
        ...msg,
      });

      feedbackTopic.publish(feedbackMsg);
    }
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

  initMarkers(message) {
    const { markers } = message;

    markers.forEach((marker) => {
      const {
        pose: { position: translation, orientation: rotation },
        controls,
        name
      } = marker;
      const transformControl = new TransformControl(this.transformCtrlOptions);
      const object = new Group();

      // FIX: Plane translation bug when rotation is 0,0,0,0
      if (rotation.w === 0) {
        rotation.w = 1;
      }

      this.objectMap[name] = {
        controls: transformControl,
        object: object,
        marker: marker,
      };

      object.add(new Axes(0.01, 0.5));
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

  updatePose(message) {
    const { poses } = message;

    poses.forEach((poseMsg) => {
      const {
        name,
        pose : {
          position: translation,
          orientation: rotation,
        },
      }  = poseMsg;

      const { object: currentObj } = this.objectMap[name];
      if (currentObj) {
        currentObj.setTransform({ translation, rotation });
      }
    });
  }

  eraseMarker(markerName) {
    const currentMarker = this.objectMap[markerName];

    if (currentMarker) {
      const { controls, object } = currentMarker;

      controls.detachObject();
      object.parent.remove(object);
      delete this.objectMap[markerName];
    }
  }

  erase(message) {
    const { erases } = message;

    erases.forEach((markerName) => {
      this.eraseMarker(markerName);
    });
  }

  update(message) {
    this.initMarkers(message);
    this.unsubscribe();
    this.callback();
  }

  destroy() {
    for(const entry in this.objectMap) {
      const { controls, object } = this.objectMap[entry];

      controls.detachObject(object);
      object.parent.remove(object);
      delete this.objectMap[entry];
    }
  }
}

export default InteractiveMarkerInit;
