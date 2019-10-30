import {Router} from 'express';

import {CONFIG} from '../constants';

const _validate = (cache, bodyData, actionBefore) => {
  if (!cache) {
    return false;
  }

  const customers = JSON.parse(cache);
  let customer = customers.filter(item => item.call_id === bodyData.call_id);

  if (customer.length <= 0) {
    return false;
  }

  if (customer[0].type !== actionBefore) {
    return false;
  }

  return true;
};

export const webhookRoutes  = (redisClient, api, router = new Router()) => {
  /**
   * Get the call last status
   *
   * @param {object} req - The request data
   * @param {object} res - The response data
   *
   * @returns {Json}
   */
  router.get('/webhook', async (req, res) => {
    await redisClient.get(CONFIG.CACHE_NAME, (err, cache) => {
      if (err) {
        res.status(500).send({message: 'Error to get calls'});
        return;
      }

      if (!cache) {
        res.json({data: []});
        return;
      }

      const customers = JSON.parse(cache);
      res.json({data: customers.filter(item => item.type !== 'call.finished')});
    });
  });

  /**
   * Receive data from Teravoz API
   *
   * @param {object} req - The request data
   * @param {object} res - The response data
   *
   * @returns {Json}
   */
  router.post('/webhook', async (req, res) => {
    await redisClient.get(CONFIG.CACHE_NAME, (err, cache) => {
      let clientData = req.body;
      const body = Object.keys(clientData);
      const missBody = CONFIG.FIELDS.filter(item => !body.includes(item));

      if (missBody.length > 0) {
        res.status(500).send({
          message: 'Body malformat',
          missed_fields: missBody
        });
        return;
      }

      const type = req.body.type;
      let customers = [];
      let customer = [];
      let updated = {};
      let nextCache = [];
      let cacheData = [];
      switch(type) {
        case 'call.new':
          if (!cache) {
            clientData.destination = '900';
            cacheData.push(clientData);
            redisClient.setex(CONFIG.CACHE_NAME, 3600, JSON.stringify(cacheData));

            res.json({data: clientData});
            return;
          }

          cacheData = JSON.parse(cache);
          const exists  = cacheData.some(item => item.their_number === clientData.their_number);
          updated = {...clientData, destination: exists ? '901' : '900'};
          nextCache = cacheData.filter(item => item.call_id !== clientData.call_id);

          nextCache.push(updated);
          redisClient.setex(CONFIG.CACHE_NAME, 3600, JSON.stringify(nextCache));
          res.json({data: updated});
          break;

        case 'call.standby':
          if (!_validate(cache, clientData, CONFIG.BEFORE_THAN[type])) {
            res.status(404).send({message: 'Call not found'});
            return;
          }

          customers = JSON.parse(cache);
          customer = customers.filter(item => item.call_id === clientData.call_id);
          const params = {
            type: 'delegate',
            call_id: customer[0].call_id,
            destination: customer[0].destination
          };

          api.post('actions', params, {})
            .then(response => {
              const updated = {...customer[0], type: clientData.type};
              let nextCache = customers.filter(item => item.call_id !== clientData.call_id);

              nextCache.push(updated);
              redisClient.setex(CONFIG.CACHE_NAME, 3600, JSON.stringify(nextCache));
              res.json(updated);
            })
            .catch(err => {
              res.status(500).send({error: err.response.data});
            });
          break;

        default:
          if (!_validate(cache, clientData, CONFIG.BEFORE_THAN[type])) {
            res.status(404).send({message: 'Call not found'});
            return;
          }

          customers = JSON.parse(cache);
          customer = customers.filter(item => item.call_id === clientData.call_id);
          nextCache = customers.filter(item => item.call_id !== clientData.call_id);
          updated = {...customer[0], type: clientData.type};

          nextCache.push(updated);
          redisClient.setex(CONFIG.CACHE_NAME, 3600, JSON.stringify(nextCache));
          res.json({data: updated});
      }
    });
  });

  return router;
}

