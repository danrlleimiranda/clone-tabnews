const dotenv = require("dotenv");
dotenv.config({
  path: ".env.development",
});
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: ".",
});
const customJestConfig = {
  moduleDirectories: ["node_modules", "<rootDir>"],
  moduleNameMapper: {
    "jsroot/io": "<rootDir>/node_modules/jsroot/",
  },
};

module.exports = createJestConfig(customJestConfig);
