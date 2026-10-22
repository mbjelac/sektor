import { describe, it, expect } from "vitest";
import { parseCommands } from "../../shared/parseCommands";

describe("parseCommands", () => {
  it("reads a fractional number in every modifier", () => {
    const [body] = parseCommands(
      "pri4 t(1.5,-2.5,3.5) r(22.5,-45.5,90.5) ro(0.5,1.5,2.5) s(10.5,20.5,30.5) h(50.5) f(40.5) sh(60.5) " +
      "at(1.5,2.5,3.5,1000.5,200.5) ar(1.5,2.5,3.5,40.5) act(#ff0000,100.5,200.5,300.5) acg(#00ff00,500.5) ashow(10.5,20.5,30.5)"
    );

    expect({
      translate: body.translate,
      rotate: body.rotate,
      rotationOffset: body.rotationOffset,
      scale: body.scale,
      hollow: body.hollow,
      frustum: body.frustum,
      shine: body.shine,
      animateTranslate: body.animateTranslate,
      animateRotate: [body.animateRotate?.d1, body.animateRotate?.d2, body.animateRotate?.d3, body.animateRotate?.stepDelay],
      animateColorToggle: body.animateColorToggle,
      animateColorGradual: body.animateColorGradual?.dt,
      animateShow: body.animateShow,
    }).toEqual({
      translate: [1.5, -2.5, 3.5],
      rotate: [22.5, -45.5, 90.5],
      rotationOffset: [0.5, 1.5, 2.5],
      scale: [10.5, 20.5, 30.5],
      hollow: 50.5,
      frustum: 40.5,
      shine: 60.5,
      animateTranslate: {dx: 1.5, dy: 2.5, dz: 3.5, dt: 1000.5, phaseSwitchDelay: 200.5, delay: 0},
      animateRotate: [1.5, 2.5, 3.5, 40.5],
      animateColorToggle: {color: "#ff0000", dt1: 100.5, dt2: 200.5, dt3: 300.5, delay: 0},
      animateColorGradual: 500.5,
      animateShow: {dt1: 10.5, dt2: 20.5, dt3: 30.5},
    });
  });
});
