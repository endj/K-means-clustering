const body = document.querySelector("body");
const canvas = document.createElement("canvas");
body.appendChild(canvas);
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

function randomData(size = 10) {
  return new Array(size).fill(null).map((_) => {
    const x = Math.floor(Math.random() * innerWidth);
    const y = Math.floor(Math.random() * innerHeight);
    return newPoint(x, y);
  });
}

function newPoint(x, y) {
  return {
    x,
    y,
    color: "black",
    key: () => `${x},${y}`,
  };
}

function renderPoints(points) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const point of points) {
    ctx.beginPath();
    ctx.fillStyle = point.color;
    ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function generateDistinctColors(numColors) {
  const colors = [];
  const step = 360 / numColors;

  for (let i = 0; i < numColors; i++) {
    const hue = Math.floor(i * step);
    const saturation = 70;
    const lightness = 50;
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    colors.push(color);
  }

  return colors;
}

function assignCentroidColors(centroids, k) {
  const colors = generateDistinctColors(k);
  for (let i = 0; i < centroids.length; i++) {
    const centroid = centroids[i];
    centroid.color = colors[i];
  }
}

function getInitialCentroids(points, k) {
  const centroids = selectNPoints(points, k);
  assignCentroidColors(centroids, k);
  const cluster = new Map();
  centroids.forEach((c) => cluster.set(c.key(), []));
  return [centroids, cluster];
}

function getClosestCentroidIndex(point, centroids) {
  let closestCentroidIndex = 0;
  let closestDistance = Number.MAX_VALUE;
  for (let i = 0; i < centroids.length; i++) {
    const centroid = centroids[i];
    const distanceToCentroid = distance(centroid, point);
    if (distanceToCentroid < closestDistance) {
      closestCentroidIndex = i;
      closestDistance = distanceToCentroid;
    }
  }
  return closestCentroidIndex;
}

function updateCentroids(clusters, k) {
  const newCluster = new Map();
  const centroids = [];
  for (const cluster of clusters) {
    const [_, points] = cluster;

    let centroidXSum = 0;
    let centroidYSum = 0;
    for (const point of points) {
      centroidXSum += point.x;
      centroidYSum += point.y;
    }
    const centroidX = Math.floor(centroidXSum / points.length);
    const centroidY = Math.floor(centroidYSum / points.length);
    const newCentroid = newPoint(centroidX, centroidY);
    newCluster.set(newCentroid.key(), []);
    centroids.push(newCentroid);
  }
  assignCentroidColors(centroids, k);
  return [centroids, newCluster];
}

function* cluster(points, arguments) {
  assert(
    Boolean(arguments) &&
      arguments.maxIterations > 0 &&
      points.length >= arguments.k,
  );
  const { k, maxIterations } = arguments;

  let [centroids, cluster] = getInitialCentroids(points, k);

  let lastKeys = new Set([...cluster.keys()]);

  for (let i = 0; i < maxIterations; i++) {
    for (const point of points) {
      const closestCentroidIndex = getClosestCentroidIndex(point, centroids);
      const closestCentroid = centroids[closestCentroidIndex];
      cluster.get(closestCentroid.key()).push(point);
      point.color = closestCentroid.color;
    }
    yield points;
    [centroids, cluster] = updateCentroids(cluster, k);

    const noMoreUpdates = cluster.keys().every((k) => lastKeys.has(k));
    if (noMoreUpdates) {
      break;
    }
    lastKeys = new Set([...cluster.keys()]);
  }

  return null;
}

function distance(pointA, pointB) {
  return Math.sqrt(
    Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2),
  );
}

function selectNPoints(points, n) {
  assert(points.length >= n);
  return shuffleArray(points).slice(0, n);
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = 0; i < copy.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function assert(condition, message = "") {
  if (!condition) throw new Error("AssertionError ", message);
}

const points = randomData(500);
const clusterGenerator = cluster(points, { k: 50, maxIterations: 20 });

let lastDraw = -1;
const animate = (minTimeBetweenFrameMs) => {
  const now = performance.now();
  if (lastDraw === -1 || now - lastDraw >= minTimeBetweenFrameMs) {
    const points = clusterGenerator.next().value;
    if (points) {
      renderPoints(points);
      lastDraw = now;
    } else {
      console.log("Done");
      return;
    }
  }
  requestAnimationFrame(() => animate(minTimeBetweenFrameMs));
};

animate(500);
