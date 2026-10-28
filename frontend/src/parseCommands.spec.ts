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
      animateTranslate: {dx: 1.5, dy: 2.5, dz: 3.5, dt: 1000.5, phaseSwitchDelay: 200.5, delay: 0, oneWay: false},
      animateRotate: [1.5, 2.5, 3.5, 40.5],
      animateColorToggle: {color: "#ff0000", dt1: 100.5, dt2: 200.5, dt3: 300.5, delay: 0},
      animateColorGradual: 500.5,
      animateShow: {dt1: 10.5, dt2: 20.5, dt3: 30.5},
    });
  });

  it("reads an initial delay as the 6th argument of a translation animation", () => {
    const [withoutInitialDelay, withInitialDelay] = parseCommands(
      "cyl at(0,0,10,500,100)\n" +
      "cyl at(0,0,10,500,100,750)"
    );

    expect([withoutInitialDelay.animateTranslate, withInitialDelay.animateTranslate]).toEqual([
      {dx: 0, dy: 0, dz: 10, dt: 500, phaseSwitchDelay: 100, delay: 0, oneWay: false},
      {dx: 0, dy: 0, dz: 10, dt: 500, phaseSwitchDelay: 100, delay: 750, oneWay: false},
    ]);
  });

  it("reads a one-way translation animation", () => {
    const [body] = parseCommands("cyl at1(0,0,10,500,100,750)");

    expect(body.animateTranslate).toEqual({dx: 0, dy: 0, dz: 10, dt: 500, phaseSwitchDelay: 100, delay: 750, oneWay: true});
  });

  it("reads a gradual color change with its optional pause and initial delay, without a random start delay", () => {
    const [withoutOptionalArguments, withOptionalArguments] = parseCommands(
      "sph acg(#ffffff00,3000)\n" +
      "sph acg(#ffffff00,3000,100,700)"
    );

    expect([withoutOptionalArguments.animateColorGradual, withOptionalArguments.animateColorGradual]).toEqual([
      {color: "#ffffff00", dt: 3000, pause: 0, delay: 0, oneWay: false},
      {color: "#ffffff00", dt: 3000, pause: 100, delay: 700, oneWay: false},
    ]);
  });

  it("reads a rotation animation without a random start delay", () => {
    const [body] = parseCommands("pri4 ar(1,0,0,100)");

    expect(body.animateRotate).toEqual({d1: 1, d2: 0, d3: 0, stepDelay: 100, delay: 0});
  });

  it("reads a one-way gradual color change with its optional pause and initial delay", () => {
    const [withoutOptionalArguments, withOptionalArguments] = parseCommands(
      "sph acg1(#ffffff00,3000)\n" +
      "sph acg1(#ffffff00,3000,100,700)"
    );

    expect([withoutOptionalArguments.animateColorGradual, withOptionalArguments.animateColorGradual]).toEqual([
      {color: "#ffffff00", dt: 3000, pause: 0, delay: 0, oneWay: true},
      {color: "#ffffff00", dt: 3000, pause: 100, delay: 700, oneWay: true},
    ]);
  });

  it("reads a shine animation, which is not mistaken for a shine", () => {
    const [body] = parseCommands("sph ash(80.5,1000,200)");

    expect({shine: body.shine, animateShine: body.animateShine}).toEqual({
      shine: null,
      animateShine: {shine: 80.5, dt: 1000, pause: 200, delay: 0, cyclePause: 0},
    });
  });

  it("reads a shine animation with its optional initial delay and cycle pause", () => {
    const [withDelay, withDelayAndCyclePause] = parseCommands(
      "sph ash(80,1000,200,700)\n" +
      "sph ash(80,1000,200,700,3000)"
    );

    expect([withDelay.animateShine, withDelayAndCyclePause.animateShine]).toEqual([
      {shine: 80, dt: 1000, pause: 200, delay: 700, cyclePause: 0},
      {shine: 80, dt: 1000, pause: 200, delay: 700, cyclePause: 3000},
    ]);
  });

  it("reads a one-way size animation with its optional pause and initial delay", () => {
    const [withoutOptionalArguments, withOptionalArguments] = parseCommands(
      "sph as1(1,2,3,3000)\n" +
      "sph as1(1,2,3,3000,100,700)"
    );

    expect([withoutOptionalArguments.animateScale, withOptionalArguments.animateScale]).toEqual([
      {dx: 1, dy: 2, dz: 3, dt: 3000, pause: 0, delay: 0},
      {dx: 1, dy: 2, dz: 3, dt: 3000, pause: 100, delay: 700},
    ]);
  });
});
