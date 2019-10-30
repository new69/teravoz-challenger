import 'babel-polyfill';
import supertest from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import {statusRoutes, webhookRoutes} from '../src/routes';
import Request from '../src/services/request.service';

describe('App test', () => {
  const init = (
    mockRedisClient = {
      get: jest.fn((key, callback) => {
        callback(null, null);
      }),
      setex: jest.fn()
    },
    api
  ) => {
    const app = express();
    api = api || new Request();
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json())
    app.use(statusRoutes());
    app.use(webhookRoutes(mockRedisClient, api));
    return app;
  }

  it('should verify if server is live', done => {
    const app = init();
    supertest(app).get('/').then(res => {
      expect(res.statusCode).toBe(200);
      done();
    });
  })

  describe('POST /webhook', () => {
    const _fields = [
      'type',
      'call_id',
      'code',
      'direction',
      'our_number',
      'their_number',
      'timestamp'
    ];

    let data = {
      call_id: "1463669263.30032",
      code: "123456",
      direction: "inbound",
      our_number: "0800000000",
      their_number: "11999990000",
      their_number_type: "mobile",
      timestamp: "2017-01-01T00:00:00Z"
    };

    describe('type = call.new', () => {
      it('should returns malformat body error', async done => {
        const testBody = {
          type: 'call.new'
        };

        const body = Object.keys(testBody);
        const missFields = _fields.filter(item => !body.includes(item));

        const app = init();
        const response = await supertest(app)
          .post('/webhook')
          .send(testBody);

        const responseBodyTest = {
          message: 'Body malformat',
          missed_fields: missFields
        };
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual(responseBodyTest);
        done();
      });

      it('should returns new cache created', async done => {
        data.type = 'call.new';

        const app = init();
        const response = await supertest(app)
          .post('/webhook')
          .send(data);

        const responseBodyTest = {
          data: {
            type: 'call.new',
            call_id: '1463669263.30032',
            code: '123456',
            direction: 'inbound',
            our_number: '0800000000',
            their_number: '11999990000',
            their_number_type: 'mobile',
            timestamp: '2017-01-01T00:00:00Z',
            destination: '900'
          }
        };

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(responseBodyTest);
        done();
      });

      it('should returns new cache created with destination 901', async done => {
        data.type = 'call.new';
        const testValue = JSON.stringify([data]);
        const mockRedisClient = {
          get: jest.fn((key, callback) => {
            callback(null, testValue);
          }),
          setex: jest.fn()
        };

        const setexSpy = jest.spyOn(mockRedisClient, 'setex');

        const app = init(mockRedisClient);
        const response = await supertest(app)
          .post('/webhook')
          .send(data);

        const responseBodyTest = {
          data: {
            type: 'call.new',
            call_id: '1463669263.30032',
            code: '123456',
            direction: 'inbound',
            our_number: '0800000000',
            their_number: '11999990000',
            their_number_type: 'mobile',
            timestamp: '2017-01-01T00:00:00Z',
            destination: '901'
          }
        };

        expect(setexSpy).toHaveBeenCalled();
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(responseBodyTest);

        setexSpy.mockRestore();
        done();
      });
    });

    describe('type = call.standby', () => {

      it('should returns not found error if doesn\'t have cache', async done => {
        data.type = 'call.standby';

        const app = init();
        const response = await supertest(app)
          .post('/webhook')
          .send(data);

        const responseBodyTest = {
          message: 'Call not found'
        }
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual(responseBodyTest);
        done();
      });

      it('should call Teravoz api', async done => {
        let test = {...data, type: 'call.new', destination: '900'};
        const testValue = JSON.stringify([test]);
        const mockRedisClient = {
          get: jest.fn((key, callback) => {
            callback(null, testValue);
          }),
          setex: jest.fn()
        };

        const api = new Request();
        const postSpy = jest.spyOn(api, 'post');
        postSpy.mockResolvedValue({message: 'Hi'})
        const setexSpy = jest.spyOn(mockRedisClient, 'setex');

        const app = init(mockRedisClient, api);

        data.type = 'call.standby';
        const response = await supertest(app)
          .post('/webhook')
          .send(data);

        expect(postSpy).toHaveBeenCalledWith(
          'actions',
          {
            type: 'delegate',
            call_id: test.call_id,
            destination: test.destination
          },
          {}
        );
        expect(setexSpy).toHaveBeenCalled();
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({...test, type:'call.standby'});

        setexSpy.mockRestore();
        postSpy.mockRestore();
        done();
      });

      it('should call Teravoz api and returns an error', async done => {
        let test = {...data, type: 'call.new', destination: '900'};
        const testValue = JSON.stringify([test]);
        const mockRedisClient = {
          get: jest.fn((key, callback) => {
            callback(null, testValue);
          }),
          setex: jest.fn()
        };
        const responseBodyTest = {response: {data: { messagem: 'Error'  }}};
        const api = new Request();
        const postSpy = jest.spyOn(api, 'post');
        postSpy.mockRejectedValue(responseBodyTest);
        const setexSpy = jest.spyOn(mockRedisClient, 'setex');

        const app = init(mockRedisClient, api);

        data.type = 'call.standby';
        const response = await supertest(app)
          .post('/webhook')
          .send(data);

        expect(postSpy).toHaveBeenCalled();
        expect(setexSpy).not.toHaveBeenCalled();
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({error: responseBodyTest.response.data});

        setexSpy.mockRestore();
        postSpy.mockRestore();
        done();
      });
    });

    describe('other events', () => {
      it('should return error if event not exists', async done => {
        data.type = 'test';

        const app = init();
        const response = await supertest(app)
          .post('/webhook')
          .send(data);

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({message: 'Call not found'});
        done();
      });

      it('should return updated data', async done => {
        let test = {...data, type: 'call.standby'};
        const testValue = JSON.stringify([test]);
        const mockRedisClient = {
          get: jest.fn((key, callback) => {
            callback(null, testValue);
          }),
          setex: jest.fn()
        };
        const setexSpy = jest.spyOn(mockRedisClient, 'setex');

        const app = init(mockRedisClient);

        data.type = 'call.waiting';
        const response = await supertest(app)
          .post('/webhook')
          .send(data);

        expect(setexSpy).toHaveBeenCalled();
        expect(response.body).toEqual({data});

        setexSpy.mockRestore();
        done();
      });
    });
  });

  describe('GET /webhook', () => {
    it('should get a empty object if doesn\'t have cache ', async done => {
      const app = init();
      const response = await supertest(app).get('/webhook');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({data: []});
      done();
    });

    it('should get the cache value', async done => {
      const testValue = JSON.stringify([{type: 'call.new'}]);
      const mockRedisClient = {
        get: jest.fn((key, callback) => {
          callback(null, testValue);
        })
      };
      const app = init(mockRedisClient);
      const response = await supertest(app).get('/webhook');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({data: JSON.parse(testValue)});
      done();
    });

    it('should not get the cache when type is call.finished', async done => {
      const testValue = JSON.stringify([{type: 'call.finished'}]);
      const mockRedisClient = {
        get: jest.fn((key, callback) => {
          callback(null, testValue);
        })
      };
      const app = init(mockRedisClient);
      const response = await supertest(app).get('/webhook');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({data: []});
      done();
    });

    it('should return empty array when redis get error', async done => {
      const mockRedisClient = {
        get: jest.fn((key, callback) => {
          callback(true, 'test');
        })
      };

      const app = init(mockRedisClient);
      const response = await supertest(app).get('/webhook');

      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({message: 'Error to get calls'});
      done();
    });
  });
})

