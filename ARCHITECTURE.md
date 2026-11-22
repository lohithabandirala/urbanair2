# Architecture & System Design

This document details the high-level architecture, module decomposition, and data flow of **UrbanAir (Saaf Hawa)**.

---

## 1. System Overview

```mermaid
flowchart TD
    Client["Browser (Client Component Tree)"]
    Proxy["Next.js Proxy (Nonce CSP & Headers)"]
    API["Next.js Route Handlers (/api/*)"]
    Services["Services Layer (Modular Providers)"]
    Domain["Pure Domain Logic"]
    Cache["In-Memory SWR Cache"]
    Upstream["External APIs (CPCB / WAQI / Open-Meteo / Gemini)"]

    Client -->|HTTPS Request| Proxy
    Proxy -->|Pass Through| API
    API -->|Query / Mutate| Services
    Services <-->|Read / Write| Cache
    Services -->|Pure Computations| Domain
    Services -->|Network I/O| Upstream
```

---

## 2. Request Lifecycle & GenAI Grounding

UrbanAir integrates Generative AI strictly as an **explanation layer**, avoiding hallucinations through mandatory server-side data grounding:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (ChatAssistant)
    participant Route as /api/assistant
    participant AirService as Air Quality Service
    participant Guard as Prompt Injection Guard
    participant Gemini as Google Gemini 3.5 Flash
    participant Fallback as Grounded Fallback Engine

    User->>Route: POST { question, language, location, profile }
    Route->>Route: Validate payload with Zod (.strict())
    Route->>Guard: Check for prompt-injection patterns
    alt Prompt Injection Detected
        Guard-->>Route: Guard refusal response
        Route-->>User: Refusal notice
    else Clean Question
        Route->>AirService: Re-fetch verified snapshot for location
        AirService-->>Route: Return live snapshot & provenance
        alt Gemini Key Configured & Healthy
            Route->>Gemini: Send strictly structured prompt & grounding facts
            Gemini-->>Route: Return natural language guidance
        else Gemini Offline or Absent
            Route->>Fallback: Generate deterministic grounded advice
            Fallback-->>Route: Return advice based on snapshot
        end
        Route-->>User: Return answer with provenance badges & sources
    end
```

---

## 3. Modular Service Architecture

Following the refactoring, every major service is split into dedicated, single-responsibility files under its own subdirectory:

### Geocoding Service (`src/services/geocode/`)
- `types.ts`: Type contracts (`Place`).
- `schemas.ts`: Zod parsing schemas for Open-Meteo and BigDataCloud.
- `defaultCities.ts`: 30-city offline fallback database.
- `searchPlaces.ts`: Forward place search with cache and offline fallback.
- `reverseGeocode.ts`: Coordinate-to-location reverse resolution.
- `resolveLocation.ts`: Normalization orchestrator.
- `index.ts`: Barrel export.

### Grounded Assistant Service (`src/services/assistant/`)
- `types.ts`: Payload and response interfaces.
- `facts.ts`: Verified facts extraction from air quality snapshots.
- `prompts.ts`: System prompt construction and leakage defense.
- `geminiClient.ts`: SDK-free fetch integration with schema parsing.
- `groundedFallback.ts`: Deterministic answer generation when LLM is offline.
- `sources.ts`: Authoritative citation mapping.
- `index.ts`: Orchestration controller.

### Weather Service (`src/services/weather/`)
- `types.ts`: Provider interfaces.
- `openMeteo.ts`: Open-Meteo atmospheric forecast adapter.
- `openWeather.ts`: OpenWeatherMap forecast adapter.
- `index.ts`: Resilience provider cascade.

### Component Sub-packages
- `src/components/chat/`: `ChatMessageItem`, `ChatMessageList`, `SuggestionChips`, `types`.
- `src/components/impact/`: `Metric`, `EstimateCard`, `AssumptionsDetails`, `constants`.
- `src/components/location/`: `LocationSearchResults`, `types`.
- `src/components/SampleDataBanner.tsx`: Independent alerting component.
