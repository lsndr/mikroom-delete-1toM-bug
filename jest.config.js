module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.(t|j)s'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
    ],
  },
};
