import {Router} from 'express';

export const statusRoutes = (router = new Router()) => {
  router.get('/', (req, res) => {
    res.send({message: 'Server online'});
  });

  return router;
}
