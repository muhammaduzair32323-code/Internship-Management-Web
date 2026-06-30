const euclideanDistance = (desc1, desc2) => {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += (desc1[i] - desc2[i]) ** 2;
  }
  return Math.sqrt(sum);
};

const FACE_MATCH_THRESHOLD = 0.6;

const isFaceMatch = (storedDescriptor, liveDescriptor) => {
  const distance = euclideanDistance(storedDescriptor, liveDescriptor);
  return { match: distance <= FACE_MATCH_THRESHOLD, distance };
};

module.exports = { isFaceMatch, FACE_MATCH_THRESHOLD };