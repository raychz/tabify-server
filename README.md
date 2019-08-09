[![CircleCI](https://circleci.com/gh/raychz/tabify-server.svg?style=svg&circle-token=957db853568e352e6625c6b61c5e20b16afadb4d)](https://circleci.com/gh/raychz/tabify-server)

# Tabify-Server

Tabify's NestJS API and TypeORM database.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Install [Docker](https://docs.docker.com/install/), [Node](https://nodejs.org/en/download/), and [Yarn](https://yarnpkg.com/en/docs/install).

### Installing

Follow these steps to get a local dev environment set up.

1. Create a local environment .env file and populate it with the necessary values. See [dotenv-flow](https://github.com/kerimdzhanov/dotenv-flow) for details on how the environment variables in the .env directory are loaded into process.env. Note that all .local files are git-ignored to avoid checking in sensitive keys and passwords.

```
cp .env.development .env.development.local
// Fill in the key-value pairs in .env.development.local
```

2. Initialize a local MySQL database using Docker Compose.

```
docker-compose up
```

3. Verify that the container was started successfuly and that its state is `Up`.

```
docker-compose ps
```

4. Install the dependencies.

```
yarn install
```

5. Run the development server.
```
yarn start:dev
```

6. Make a test GET request by opening your browser to http://localhost:3000, using a tool like [Postman](https://www.getpostman.com/), or simply using Curl.
```
curl localhost:3000
```

If you see a message about a missing auth token, you've successfully started the server! 🎉

## Running the tests

WIP Explain how to run the automated tests for this system here

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

WIP Add additional notes about how to deploy this on a live system

## Built With

* [NestJS](https://docs.nestjs.com/) - A framework for building efficient, scalable Node.js server-side applications
* [TypeORM](https://typeorm.io/#/) - ORM for TypeScript and JavaScript (ES7, ES6, ES5). Supports MySQL and many others
* [Firebase](https://firebase.google.com/) - Authentication, Cloud Firestore, and Hosting are a few of the Firebase products we use
