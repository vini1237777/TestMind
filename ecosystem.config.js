export const apps = [
  {
    name: "testmind",
    script: "server.js",
    exec_mode: "cluster",
    instances: 2,
    max_memory_restart: "350M",
    env: {
      NODE_ENV: "production",
      PORT: process.env.PORT || 8080,
    },
  },
];
