// /core/curve_clothoid.js
// Euler (Clothoid) spiral via incremental integration of Fresnel integrals.
// Normalized Fresnel integrals:
//   C(t) = ∫_0^t cos(π u^2 / 2) du
//   S(t) = ∫_0^t sin(π u^2 / 2) du
// A segment: (x,y) = scale * (C(t), S(t)), then rotated & translated.

export function sampleClothoid(params, quality) {
  const {
    t0 = 0,          // start Fresnel parameter
    t1 = 3.5,        // end Fresnel parameter
    symmetric = true,// if true → span [-t1, +t1]
    scale = 180,     // px
    rotate = 0,      // rad
    dir = 1,         // +1 / -1: flips curvature (u → dir·u)
    center = { x: 0, y: 0 }
  } = params || {};

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.35) * Math.PI / 180);
  const maxSeg   = quality?.maxSegLenPx ?? 2.0;
  const maxVerts = quality?.maxVerts ?? 120000;

  // t-span
  let tStart, tEnd;
  if (symmetric) {
    tStart = -Math.abs(t1);
    tEnd   =  Math.abs(t1);
  } else {
    const a = Math.min(t0, t1), b = Math.max(t0, t1);
    tStart = a; tEnd = b;
  }

  // rotation & translation
  const cosR = Math.cos(rotate), sinR = Math.sin(rotate);
  const applyTR = (x, y) => [center.x + (x * cosR - y * sinR),
                             center.y + (x * sinR + y * cosR)];

  // Fresnel integrand at u (midpoint integration)
  const deriv = (u) => {
    const uu = dir * u;
    const w = 0.5 * Math.PI * uu * uu; // π/2 · (dir·u)^2
    return [Math.cos(w), Math.sin(w)]; // [dC/du, dS/du]
  };

  const pts = [];
  let length = 0;

  // incremental integrals (local frame)
  let u = tStart;
  let X = 0, Y = 0;

  // seed point
  {
    const [px, py] = applyTR(scale * X, scale * Y);
    pts.push([px, py]);
  }

  // safety: hard cap on loop count
  const MAX_ITERS = Math.min(4 * maxVerts, 5_000_000);
  let iterCount = 0;

  while (u < tEnd) {
    if (++iterCount > MAX_ITERS) break;

    // target phase step: dφ/du = π|u|  ⇒  dt0 ≈ maxAngle / (π·max(|u|,ε))
    const denom = Math.max(1e-6, Math.PI * Math.max(1e-6, Math.abs(u)));
    let dt = maxAngle / denom;

    // near the center allow a bigger step but still bounded
    if (Math.abs(u) < 0.2) dt = Math.min(0.06, dt);

    // clamp to remaining span
    if (u + dt > tEnd) dt = tEnd - u;
    if (dt <= 1e-12) break;

    // --- refine dt locally so that pixel segment <= maxSeg ---
    let accepted = false;
    let dtLocal = dt;
    for (let k = 0; k < 30; k++) {
      const um = u + 0.5 * dtLocal;
      const [cx, sy] = deriv(um);
      const dX = cx * dtLocal;
      const dY = sy * dtLocal;

      const segPx = Math.hypot(dX * scale, dY * scale);
      if (segPx > maxSeg) {
        dtLocal *= 0.5;
        if (dtLocal <= 1e-12) break; // give up
        continue;
      }
      // accept step
      X += dX; Y += dY; u += dtLocal;
      const [px, py] = applyTR(scale * X, scale * Y);
      const prev = pts[pts.length - 1];
      length += Math.hypot(px - prev[0], py - prev[1]);
      pts.push([px, py]);
      accepted = true;
      break;
    }

    // if we failed to accept after refinement, nudge u minimally to avoid stall
    if (!accepted) {
      const tiny = Math.min(tEnd - u, 1e-6);
      if (tiny <= 0) break;
      u += tiny;
    }

    if (pts.length >= maxVerts) break;
  }

  // bbox
  let xmin = +Infinity, xmax = -Infinity, ymin = +Infinity, ymax = -Infinity;
  for (const [x, y] of pts) {
    if (x < xmin) xmin = x; if (x > xmax) xmax = x;
    if (y < ymin) ymin = y; if (y > ymax) ymax = y;
  }

  return {
    pathData: { polylines: [pts], closed: false },
    bbox: { xmin, xmax, ymin, ymax },
    stats: { vertices: pts.length, lengthPx: length }
  };
}
