export const apps = [
  {
    name: "testmind",
    script: "npm",
    args: "start",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
    },
  },
];
