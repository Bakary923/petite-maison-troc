const adminMiddleware = require('../src/middlewares/adminMiddleware');

describe('Middleware Admin', () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };

  beforeEach(() => jest.clearAllMocks());

  it('401 si req.user absent', () => {
    const req = {};

    adminMiddleware(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Non authentifié' });
  });

  it('403 si user non admin', () => {
    const req = { user: { role: 'user' } };

    adminMiddleware(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès réservé aux admins' });
  });

  it('next() si admin', () => {
    const req = { user: { role: 'admin' } };
    const next = jest.fn();

    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
