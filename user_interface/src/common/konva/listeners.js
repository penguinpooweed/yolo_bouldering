import { throttle } from 'lodash';

export const offKonvaStageListeners = (stageNode) => {
  stageNode.off('touchmove touchend');
};

/**
 * Add listener to the node which awaits for dual touch events to scale the node around
 * https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html
 * @param {node} stageNode
 */
export const addKonvaListenerPinchZoom = (stageNode) => {
  let lastCenter = null;
  let lastDist = 0;
  const { width: imageWidth, height: imageHeight } = stageNode.size();

  stageNode.on(
    'touchmove',
    throttle((e) => {
      e.evt.preventDefault();
      const touch1 = e.evt.touches[0];
      const touch2 = e.evt.touches[1];

      if (touch1 && touch2) {
        if (stageNode.isDragging()) {
          stageNode.stopDrag();
        }

        const p1 = {
          x: touch1.clientX,
          y: touch1.clientY,
        };
        const p2 = {
          x: touch2.clientX,
          y: touch2.clientY,
        };

        if (!lastCenter) {
          lastCenter = getCenter(p1, p2);
          return;
        }
        const newCenter = getCenter(p1, p2);

        const dist = getDistance(p1, p2);

        if (!lastDist) {
          lastDist = dist;
        }

        var pointTo = {
          x: (newCenter.x - stageNode.x()) / stageNode.scaleX(),
          y: (newCenter.y - stageNode.y()) / stageNode.scaleX(),
        };

        const scale = stageNode.scaleX() * (dist / lastDist);

        // calculate new position of the stageNode
        const dx = newCenter.x - lastCenter.x;
        const dy = newCenter.y - lastCenter.y;

        const newPos = {
          x: newCenter.x - pointTo.x * scale + dx,
          y: newCenter.y - pointTo.y * scale + dy,
        };

        // calculate position of the bottom right corner
        const bottomRightPos = {
          x: newPos.x + scale * imageWidth,
          y: newPos.y + scale * imageHeight,
        };

        // ensure the user cannot zoom out indefinitely
        if (newPos.x > 0) {
          newPos.x = 0;
        }
        if (newPos.y > 0) {
          newPos.y = 0;
        }

        if (scale < 1) return;

        // if bottom right corner is out of bound, move the top left corner accordingly
        if (bottomRightPos.x < imageWidth) {
          if (newPos.x === 0) return;
          newPos.x += imageWidth - bottomRightPos.x;
        }
        if (bottomRightPos.y < imageHeight) {
          if (newPos.y === 0) return;
          newPos.y += imageHeight - bottomRightPos.y;
        }

        stageNode.scaleX(scale);
        stageNode.scaleY(scale);
        stageNode.position(newPos);
        stageNode.batchDraw();

        lastDist = dist;
        lastCenter = newCenter;
      }
    }, 5),
  );

  stageNode.on('touchend', () => {
    lastDist = 0;
    lastCenter = null;
  });

  const getDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getCenter = (p1, p2) => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  };
};

/**
 * Add listener to the node which awaits for single touch events to move the node around
 * @param {node} stageNode
 */
export const addKonvaListenerTouchMove = (stageNode) => {
  let lastCenter = null;
  const { width: imageWidth, height: imageHeight } = stageNode.size();

  stageNode.on(
    'touchmove',
    throttle((e) => {
      e.evt.preventDefault();
      if (e.evt.touches.length !== 1) return;

      const touch1 = e.evt.touches[0];

      const p1 = {
        x: touch1.clientX,
        y: touch1.clientY,
      };

      if (!lastCenter) {
        lastCenter = { ...p1 };
        return;
      }
      const dx = p1.x - lastCenter.x;
      const dy = p1.y - lastCenter.y;
      const newPos = {
        x: stageNode.x() + dx,
        y: stageNode.y() + dy,
      };

      // calculate position of the bottom right corner
      const bottomRightPos = {
        x: newPos.x + imageWidth * stageNode.scaleX(),
        y: newPos.y + imageHeight * stageNode.scaleY(),
      };

      // ensure the user cannot drag out of the bound
      if (newPos.x > 0 || bottomRightPos.x < imageWidth) {
        newPos.x = stageNode.x();
      }
      if (newPos.y > 0 || bottomRightPos.y < imageHeight) {
        newPos.y = stageNode.y();
      }

      stageNode.position(newPos);
      stageNode.batchDraw();

      lastCenter = { ...p1 };
    }, 5),
  );

  stageNode.on('touchend', () => {
    lastCenter = null;
  });
};
