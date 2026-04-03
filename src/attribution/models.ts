import type { TouchpointChain, AttributionModel, AttributionResult, AttributionCredit, Touchpoint } from '../types';

/**
 * Get first touch (100% credit to the first touchpoint)
 */
export function getFirstTouch(chain: TouchpointChain): AttributionResult {
  const touchpoints = chain.touchpoints;
  
  if (touchpoints.length === 0) {
    return {
      model: 'first',
      credits: [],
      totalCredit: 0
    };
  }
  
  const firstTouchpoint = touchpoints[0];
  return {
    model: 'first',
    credits: [{
      touchpoint: firstTouchpoint,
      credit: 1.0
    }],
    totalCredit: 1.0
  };
}

/**
 * Get last touch (100% credit to the last touchpoint)
 */
export function getLastTouch(chain: TouchpointChain): AttributionResult {
  const touchpoints = chain.touchpoints;
  
  if (touchpoints.length === 0) {
    return {
      model: 'last',
      credits: [],
      totalCredit: 0
    };
  }
  
  const lastTouchpoint = touchpoints[touchpoints.length - 1];
  return {
    model: 'last',
    credits: [{
      touchpoint: lastTouchpoint,
      credit: 1.0
    }],
    totalCredit: 1.0
  };
}

/**
 * Linear attribution model (even credit distribution across all touchpoints)
 */
export function getLinearAttribution(chain: TouchpointChain): AttributionResult {
  const touchpoints = chain.touchpoints;
  
  if (touchpoints.length === 0) {
    return {
      model: 'linear',
      credits: [],
      totalCredit: 0
    };
  }
  
  const creditPerTouchpoint = 1.0 / touchpoints.length;
  const credits: AttributionCredit[] = touchpoints.map(tp => ({
    touchpoint: tp,
    credit: creditPerTouchpoint
  }));
  
  return {
    model: 'linear',
    credits,
    totalCredit: 1.0
  };
}

/**
 * U-shaped attribution model (40% first, 40% last, 20% evenly split among the rest)
 */
export function getUShapedAttribution(chain: TouchpointChain): AttributionResult {
  const touchpoints = chain.touchpoints;
  
  if (touchpoints.length === 0) {
    return {
      model: 'u-shaped',
      credits: [],
      totalCredit: 0
    };
  }
  
  if (touchpoints.length === 1) {
    return {
      model: 'u-shaped',
      credits: [{
        touchpoint: touchpoints[0],
        credit: 1.0
      }],
      totalCredit: 1.0
    };
  }
  
  if (touchpoints.length === 2) {
    return {
      model: 'u-shaped',
      credits: [
        { touchpoint: touchpoints[0], credit: 0.5 },
        { touchpoint: touchpoints[1], credit: 0.5 }
      ],
      totalCredit: 1.0
    };
  }
  
  // For 3+ touchpoints: 40% first, 40% last, 20% evenly split among the rest
  const firstCredit = 0.4;
  const lastCredit = 0.4;
  const middleTouchpoints = touchpoints.slice(1, -1);
  const middleCredit = middleTouchpoints.length > 0 ? 0.2 / middleTouchpoints.length : 0;
  
  const credits: AttributionCredit[] = [];
  
  // First touchpoint - 40%
  credits.push({
    touchpoint: touchpoints[0],
    credit: firstCredit
  });
  
  // Middle touchpoints - 20% evenly split
  middleTouchpoints.forEach(tp => {
    credits.push({
      touchpoint: tp,
      credit: middleCredit
    });
  });
  
  // Last touchpoint - 40%
  credits.push({
    touchpoint: touchpoints[touchpoints.length - 1],
    credit: lastCredit
  });
  
  return {
    model: 'u-shaped',
    credits,
    totalCredit: 1.0
  };
}

/**
 * Time decay attribution model (more recent touchpoints receive more credit)
 * Uses exponential decay with a 7-day half-life
 */
export function getTimeDecayAttribution(chain: TouchpointChain): AttributionResult {
  const touchpoints = chain.touchpoints;
  
  if (touchpoints.length === 0) {
    return {
      model: 'time-decay',
      credits: [],
      totalCredit: 0
    };
  }
  
  if (touchpoints.length === 1) {
    return {
      model: 'time-decay',
      credits: [{
        touchpoint: touchpoints[0],
        credit: 1.0
      }],
      totalCredit: 1.0
    };
  }
  
  // Decay half-life: 7 days in milliseconds
  const halfLifeMs = 7 * 24 * 60 * 60 * 1000;
  
  // Get current time
  const now = Date.now();
  
  // Calculate weights for each touchpoint (exponential decay)
  const weights: number[] = touchpoints.map(tp => {
    const ageMs = now - tp.ts;
    // Exponential decay: weight = 2^(-age/halfLife)
    // More recent touchpoints get higher weight
    const weight = Math.pow(2, -ageMs / halfLifeMs);
    return weight;
  });
  
  // Sum weights
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  // Normalize weights into credits (sum must be 1.0)
  const credits: AttributionCredit[] = touchpoints.map((tp, index) => ({
    touchpoint: tp,
    credit: totalWeight > 0 ? weights[index] / totalWeight : 0
  }));
  
  return {
    model: 'time-decay',
    credits,
    totalCredit: 1.0
  };
}

/**
 * Get attribution by the specified model
 */
export function getAttribution(
  chain: TouchpointChain,
  model: AttributionModel
): AttributionResult {
  switch (model) {
    case 'first':
      return getFirstTouch(chain);
    case 'last':
      return getLastTouch(chain);
    case 'linear':
      return getLinearAttribution(chain);
    case 'u-shaped':
      return getUShapedAttribution(chain);
    case 'time-decay':
      return getTimeDecayAttribution(chain);
    default:
      // Fallback to last touch
      return getLastTouch(chain);
  }
}

