const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middlewares/auth');

describe('Middleware Auth', () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };

  beforeEach(() => jest.clearAllMocks());

  it('401 si header Authorization manquant', () => {
    const req = { headers: {} };

    authMiddleware(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token manquant ou invalide' });
  });

  it('401 si header ne commence pas par Bearer', () => {
    const req = { headers: { authorization: 'Token abc' } };

    authMiddleware(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('401 si token invalide', () => {
    const req = { headers: { authorization: 'Bearer invalid' } };

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('invalid');
    });

    authMiddleware(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token invalide ou expiré' });
  });

  it('next() si token valide', () => {
    const req = { headers: { authorization: 'Bearer valid' } };
    const next = jest.fn();

    jest.spyOn(jwt, 'verify').mockReturnValue({ id: 1, role: 'user' });

    authMiddleware(req, res, next);

    expect(req.user.id).toBe(1);
    expect(next).toHaveBeenCalled();
  });
});
