import { exec } from "child_process";
import { resolve } from "path";

const syncPerformanceFile = resolve(
  __dirname, "../performance/sync.performance.ts"
);

const asyncPerformanceFile = resolve(
  __dirname, "../performance/async.performance.ts"
);

const buildCommand = 'npm run build';
const command = 'ts-node';

console.log('Performance tests are running...');

exec(`${buildCommand}`);
setTimeout(() => {}, 300);
exec(`${command} ${syncPerformanceFile}`);
setTimeout(() => {}, 500);
exec(`${command} ${asyncPerformanceFile}`);

console.log('Performance tests are done!');
