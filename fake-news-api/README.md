# News Aggregator Service

A scalable news aggregation service that fetches articles from multiple sources, enriches them with AI-generated content, and provides a unified API for accessing news articles across different categories.

## Features

- 🔄 Multiple news source integration with fallback mechanisms
- 🤖 AI-powered article enrichment using OpenAI
- ⚡ High-performance caching system
- 🛡️ Circuit breaker pattern for API resilience
- 📊 Comprehensive monitoring and metrics
- 🔒 Rate limiting and security measures
- 🎯 Category-based article organization

## Architecture

The service is built using NestJS and follows a modular architecture:

- **Article Module**: Core article management and enrichment
- **News Sources**: Extensible news source integration
- **OpenAI Integration**: AI-powered content enrichment
- **Circuit Breaker**: Fault tolerance management
- **Queue System**: Asynchronous processing
- **Monitoring**: Performance and health metrics

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key
- News API key

## Installation

## Configuration

Create a `.env` file with the following variables:

```
# Environment
NODE_ENV=development
PORT=8000

# API Keys
NEWS_API_KEY=your_news_api_key
OPENAI_API_KEY=your_openai_api_key

# Service URLs
NEWS_API_URL=https://newsapi.org/v2
OPENAI_API_URL=https://api.openai.com/v1
# Cache settings
CACHE_TTL=300000

# CORS settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

## Running the Service

```bash
npm start
```

## API Documentation

The service provides a Swagger API documentation at:

```
http://localhost:8000/api
```

run with:

```bash
npm run swagger
```

## Monitoring and Metrics

The service uses Prometheus for monitoring and metrics collection. The metrics are available at:

```
http://localhost:8000/metrics
```

## Error Handling and Logging

The service implements comprehensive error handling and logging:

- **Error Handling**: All API endpoints are wrapped in a try-catch block to handle errors gracefully.
- **Logging**: Detailed error logs are captured using NestJS's default logger and Winston.

## Testing

The service includes unit tests and integration tests:

- **Unit Tests**: Jest is used for unit testing the core functionality.
- **Integration Tests**: Jest is used for integration testing the API endpoints.

run tests with:

```bash
npm test
```
