export function validateInsertionScoring(scoring, stars) {
  if (!scoring) return null;
  if (!Number.isInteger(scoring.pointsPerStep) || scoring.pointsPerStep < 1 || scoring.pointsPerStep > 10000 ||
      !Number.isInteger(scoring.penaltyPerError) || scoring.penaltyPerError < 0 || scoring.penaltyPerError > 10000)
    return "coefficients";
  if (!Array.isArray(stars) || stars.length !== 3 ||
      stars.some((value, index) => !Number.isInteger(value) || value < 1 || value > 1280000 ||
        (index > 0 && value <= stars[index - 1])))
    return "thresholds";
  return null;
}
