export const apps = [
  {
    name: "testmind",
    script: "npm",
    args: "run start:next",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: process.env.PORT || 8080,
    },
  },
];
