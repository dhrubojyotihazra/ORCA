// SVG filter definitions for the liquid-glass chromatic dispersion effect.
// Rendered off-screen (0×0), referenced by CSS filter: url(#liquid-glass-refraction).
// Based on the Terranova reference pattern — exact scale/frequency values preserved.

export function GlassFilterDefs() {
  return (
    <svg
      className="absolute w-0 h-0 pointer-events-none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id="liquid-glass-refraction"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          {/* Step 1 — Fractal noise: the refraction normal map */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.015"
            numOctaves={3}
            result="noise"
          />

          {/* Step 2 — Boost SourceAlpha to full opacity so the mask has hard edges */}
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            result="boosted_alpha"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 100 0"
          />

          {/* Step 3 — Blur the boosted alpha to get a smooth interior / rim gradient */}
          <feGaussianBlur
            in="boosted_alpha"
            stdDeviation={45}
            result="blurred_alpha"
          />

          {/* Step 4 — Invert: interior ≈ 0, bevel rim ≈ 1.
               slope="-1.3" intercept="1" pushes values above zero at the edges */}
          <feComponentTransfer in="blurred_alpha" result="edge_mask">
            <feFuncA type="linear" slope={-1.3} intercept={1} />
          </feComponentTransfer>

          {/* Step 5 — Multiply noise by the edge mask: strong displacement at rim, near-zero inside */}
          <feComposite
            in="noise"
            in2="edge_mask"
            operator="arithmetic"
            k1={1}
            k2={0}
            k3={0}
            k4={0}
            result="masked_noise"
          />

          {/* Step 6 — Chromatic dispersion: three displacement passes at different scales.
               The offset between R/G/B scales (65 / 56 / 47) is what produces rainbow fringing. */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="masked_noise"
            scale={65}
            xChannelSelector="R"
            yChannelSelector="G"
            result="red_displaced"
          />
          <feColorMatrix
            in="red_displaced"
            type="matrix"
            result="red"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          />

          <feDisplacementMap
            in="SourceGraphic"
            in2="masked_noise"
            scale={56}
            xChannelSelector="R"
            yChannelSelector="G"
            result="green_displaced"
          />
          <feColorMatrix
            in="green_displaced"
            type="matrix"
            result="green"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
          />

          <feDisplacementMap
            in="SourceGraphic"
            in2="masked_noise"
            scale={47}
            xChannelSelector="R"
            yChannelSelector="G"
            result="blue_displaced"
          />
          <feColorMatrix
            in="blue_displaced"
            type="matrix"
            result="blue"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
          />

          {/* Step 7 — Recombine RGB channels with screen blends */}
          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}
