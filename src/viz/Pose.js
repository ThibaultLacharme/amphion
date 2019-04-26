import _ from 'lodash';

const { THREE } = window;

import Core from '../core';
import { MESSAGE_TYPE_POSESTAMPED, OBJECT_TYPE_ARROW, OBJECT_TYPE_AXES, OBJECT_TYPE_FLAT_ARROW } from '../utils/constants';
import Arrow from '../primitives/Arrow';
import Axes from '../primitives/Axes';
import LineArrow from '../primitives/LineArrow';
import { DEFAULT_COLOR_X_AXIS } from '../utils/defaults';

export const POSE_VIZ_TYPES = {
  arrow: OBJECT_TYPE_ARROW,
  axes: OBJECT_TYPE_AXES,
  flatArrow: OBJECT_TYPE_FLAT_ARROW,
};

export const SHAFT_LENGTH = 1;
export const SHAFT_RADIUS = 0.05;

export const HEAD_LENGTH = 0.3;
export const HEAD_RADIUS = 0.1;

class Pose extends Core {
  constructor(ros, topicName, options) {
    super(ros, topicName, MESSAGE_TYPE_POSESTAMPED);
    this.options = options || {};
    this.object = new THREE.Group();
    this.setVizType(POSE_VIZ_TYPES.arrow);
  }

  static getNewPrimitive(options) {
    const {
      color,
      alpha,
      shaftLength,
      shaftRadius,
      headLength,
      headRadius,
      type
    } = options;
    let newObject = null;

    switch (type) {
      case POSE_VIZ_TYPES.arrow:
        newObject = new Arrow();
        newObject.setHead({
          radius: headRadius || HEAD_RADIUS,
          length: headLength || HEAD_LENGTH
        });
        newObject.setShaft({
          radius: shaftRadius || SHAFT_RADIUS,
          length: shaftLength || SHAFT_LENGTH
        });
        newObject.setAlpha(alpha || 1);
        if (color) {
          newObject.setColor({ cone: new THREE.Color(color), cylinder: new THREE.Color(color) });
        }
        break;
      case POSE_VIZ_TYPES.axes:
        newObject = new Axes();
        break;
      case POSE_VIZ_TYPES.flatArrow:
        newObject = new LineArrow();
        break;
    }
    return newObject;
  }

  setVizType(type) {
    const newObject = Pose.getNewPrimitive(this.options);
    _.each(this.object.children, (child) => {
      child.parent.remove(child);
    });
    this.object.add(newObject);
    Object.setPrototypeOf(this.object, Object.getPrototypeOf(newObject));
  }

  updateOptions(options) {
    const { type } = options;

    if (type !== this.object.children[0]) {
      this.setVizType(type);
    }

    const currentObjType = this.object.children[0];

    switch (type) {
      case POSE_VIZ_TYPES.arrow: {
        const {
          color,
          alpha,
          shaftLength,
          shaftRadius,
          headLength,
          headRadius
        } = options;

        currentObjType.setHead({ radius: headRadius, length: headLength });
        currentObjType.setShaft({ radius: shaftRadius, length: shaftLength });
        currentObjType.setAlpha(alpha);
        currentObjType.setColor({ cone: new THREE.Color(color), cylinder: new THREE.Color(color) });
        break;
      }
      case POSE_VIZ_TYPES.axes: {
        const { axesLength, axesRadius, alpha } = options;

        currentObjType.setLength(axesLength);
        currentObjType.setRadius(axesRadius);
        break;
      }
    }
  }

  update(message) {
    const { pose: { position, orientation } } = message;
    this.object.setTransform({
      translation: position,
      rotation: orientation
    });
  }
}

export default Pose;
