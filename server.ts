import cluster from "cluster";
import os from "os";
import { spawn } from "child_process";

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} starting server...`);

  spawn("node", [".next/standalone/server.js"], {
    stdio: "inherit",
    env: process.env,
  });
}
