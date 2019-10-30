import 'babel-polyfill';
import Request from '../../src/services/request.service';
import {CONFIG} from '../../src/constants';

describe('Request Class Test', () => {
  const api = new Request();
  let requestSpy = null

  beforeEach(() => {
    requestSpy = jest.spyOn(api, 'request');
  });

  afterEach(() => {
    requestSpy.mockRestore();
  })

  it('should verify if const api is a instance of Request class', done => {
    expect(api).toBeInstanceOf(Request)
    done();
  });

  it('should verify if constructor pass options to setting', done => {
    const api2 = new Request({test: 'test'});

    expect(api2.settings).toEqual({test: 'test'});
    done();
  });

  describe('setUrl', () => {
    it('should change the url', done => {
      const url = 'https://developers.teravoz.com.br/';
      api.setUrl(url);

      expect(api.settings.url).toEqual(url);
      done();
    });
  });

  describe('getHeaders', () => {
    it('should return any header data', done => {
      expect(api.getHeaders()).toBeUndefined();
      done();
    });

    it('should return header data', done => {
      api.setUrl(CONFIG.BASEURL);

      expect(api.getHeaders()).toEqual({ 'Content-Type': 'application/json' });
      done();
    });
  });

  describe('get', () => {
    it('should call the request method', done => {
      api.get('/', {});

      expect(requestSpy).toHaveBeenCalledWith({method: 'get', url: '/', params: {}});
      done();
    });
  });

  describe('post', () => {
    it('should call the request method', done => {
      const data = {test: 'test'};
      api.post('/', data, {});

      expect(requestSpy).toHaveBeenCalledWith({method: 'post', url: '/', params: {}, data});
      done();
    });
  });

  describe('put', () => {
    it('should call the request method', done => {
      const data = {test: 'test'};
      api.put('/', data, {});

      expect(requestSpy).toHaveBeenCalledWith({method: 'put', url: '/', params: {}, data});
      done();
    });

    describe('delete', () => {
      it('should call the request method', done => {
        const data = {test: 'test'};
        api.delete('/', data, {});

        expect(requestSpy).toHaveBeenCalledWith({method: 'delete', url: '/', params: {}, data});
        done();
      });
    });
  });
});

