// On importe le middleware à tester
const logger = require('../src/middlewares/logger');

describe('Middleware Logger', () => {
  it('ne log rien en mode test mais appelle next()', () => {
    // On force l’environnement en mode test
    // (le logger désactive console.log dans ce mode)
    process.env.NODE_ENV = 'test';

    // Faux objet req simulant une requête Express
    const req = {
      method: 'GET',
      originalUrl: '/api/test',
      user: { id: 1 } // Simule un utilisateur authentifié
    };

    // Faux objet res avec un mock de res.on()
    // Le logger utilise res.on('finish', callback)
    // donc on simule immédiatement l’appel du callback
    const res = {
      statusCode: 200,
      on: jest.fn((event, cb) => cb())
    };

    // next() doit être appelé par le middleware
    const next = jest.fn();

    // On espionne console.log pour vérifier qu'il n'est PAS appelé
    console.log = jest.fn();

    // Exécution du middleware
    logger(req, res, next);

    // Vérifie que next() a bien été appelé
    expect(next).toHaveBeenCalled();

    // Vérifie que console.log n’a PAS été appelé en mode test
    // (comportement normal et voulu)
    expect(console.log).not.toHaveBeenCalled();
  });
});
