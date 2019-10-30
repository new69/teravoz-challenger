# teravoz-challenger

This project is a challenge applied by Teravoz. It's a simple webhook with [Nodejs](https://nodejs.org/en/), [Express](https://expressjs.com) and [Redis](https://redis.io/)

For dashboard you can find out on [here](https://github.com/new69/teravoz_dashboard).

## Getting Started
---------------

### Prerequisistes
This project needs the [Docker](https://www.docker.com/get-started) installed on your system

### Commands
#### Show all commands
```
$make
```
or
```
$make help
```

#### Up server
```
$make server
```
It'll create a server on **http://localhost:8080/**

#### Stop server
```
$make stop
```

#### Show server status
```
$make status
```

#### Tests
```
$make test
```

### Endpoints
This project have 3 endpoints

#### [GET] /
Verify if server is up
```json
{
    "message": "Server online"
}
```

#### [GET] /webhook
Get all active calls
```json
{
    "data": [
        {
            "type": "call.new",
            "call_id": "1463669263.30031",
            "code": "123456",
            "direction": "inbound",
            "our_number": "0800000000",
            "their_number": "11999990000",
            "their_number_type": "mobile",
            "timestamp": "2017-01-01T00:00:00Z",
            "destination": "901"
        }
    ]
}
```

#### [POST] /webhook
Receive the Teravoz calls. For an complete operation, don't forget to add your user and password from Teravoz API.
Access the **scr/constants/config.constants.js** and change the variables **USERNAME** and **PASSWORD** with your credentials
```json
{
    "data": {
        "type": "call.new",
        "call_id": "1463669263.30031",
        "code": "123456",
        "direction": "inbound",
        "our_number": "0800000000",
        "their_number": "11999990000",
        "their_number_type": "mobile",
        "timestamp": "2017-01-01T00:00:00Z",
        "destination": "901"
    }
}
```
