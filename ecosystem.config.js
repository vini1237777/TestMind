export const apps = [
  {
    name: "testmind",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3000",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
    },
  },
];
