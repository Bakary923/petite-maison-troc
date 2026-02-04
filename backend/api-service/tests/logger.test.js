const logger = require('../src/middlewares/logger');

describe('Middleware Logger', () => {
  it('log correctement une requête', () => {
    const req = {
      method: 'GET',
      originalUrl: '/api/test',
      user: { id: 1 }
    };

    const res = {
      statusCode: 200,
      on: jest.fn((event, cb) => cb())
    };

    const next = jest.fn();

    console.log = jest.fn();

    logger(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
  });
});
