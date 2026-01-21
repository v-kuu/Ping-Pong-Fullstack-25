*This project has been created as part of the 42 curriculum by abostrom, maoliiny, jtuomi, vkuusela and vlopatin.*

## Description

ft_transcendence is a real-world web application developed as part of the 42 curriculum. The primary goal is to learn core technologies by implementing various modules that team members are interested in, enabling all members to develop themselves as generalists who can pick up new skills after the core curriculum.

The project includes a complete web application with user management, interactive games, real-time multiplayer support, and multiple modules covering various domains.

## Instructions

### Development

**Prerequisites:** Bun, mkcert, Docker

```bash
bun i && bun dev
```

### Production

**Prerequisites:** Docker, mkcert

```bash
./run.sh -u
```

## Team & roles
**PO (Product Owner)**: ville - Defined product vision, prioritized features, maintained product backlog</br>
**PM (Project Manager)**: jtuomi - Organized team meetings, tracked progress, ensured team communication</br>
**Architect**: maoliiny - Defined technical architecture, made technology stack decisions, ensured code quality</br>
**Developers**: abostrom, maoliiny, jtuomi, vkuusela, vlopatin - Implemented features, participated in code reviews</br>

## Project Management

Communication is handled through a Discord group where the team coordinated daily. The team met at least once every two weeks in person at the campus reserved rooms. The GitHub repository is set up with issue-driven development where tasks are tracked as issues and assigned to team members. All pull requests to the main branch require at least one review before merging. Core team decisions are documented.

## Tech stack

### Framework -> [Astro](https://astro.build)
Astro is a web framework for building content-driven websites. We chose [Preact](https://preactjs.com) for interactive components because it is lightweight and fast. </br>
It utilizes [TailwindCSS](https://tailwindcss.com) which we extended with [DaisyUI](https://daisyui.com) and [Typography](https://github.com/tailwindlabs/tailwindcss-typography) plugins. </br>
Database is built using [Astro DB](https://astro.build/db) which uses [Drizzle ORM](https://orm.drizzle.team/) under the hood.

### Games -> Pong
[BabylonJS](https://babylonjs.com) is used for 3D rendering on the client end. </br>
And a backend server is used for calculating the state and communicating that to clients using WebSockets. </br>

### Games -> Web3D
A second game built with WebAssembly for competitive gem collection. Players compete to collect gems in a real-time multiplayer environment. Uses WASM compiled from C for high-performance gameplay.

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [Astro Documentation](https://docs.astro.build)
- [Preact Documentation](https://preactjs.com)

## Database Schema

The database is built using Astro DB with Drizzle ORM. It consists of five tables:

### Users
| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key, auto-incremented |
| username | text | Unique username |
| password | text | Hashed password |
| email | text | Unique email address |
| lastSeen | date | Last activity timestamp (optional) |

### Matches
| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key, auto-incremented |
| game | text | Game identifier |
| playerIds | json | Array of player user IDs |
| scores | json | Array of scores corresponding to players |
| createdAt | date | Match creation timestamp |

### Sessions
| Field | Type | Description |
|-------|------|-------------|
| id | text | Primary key (session token) |
| userId | number | Foreign key to Users |

### Friendships
| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key, auto-incremented |
| userId | number | Foreign key to Users |
| friendId | number | Foreign key to Users |
| status | text | Friendship status |

### Messages
| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key, auto-incremented |
| fromId | number | Foreign key to Users (sender) |
| toId | number | Foreign key to Users (receiver) |
| content | text | Message content |
| createdAt | date | Message timestamp |
| read | boolean | Read status (default: false) |

**Relationships:**
- Sessions references Users for userId
- Friendships references Users for userId and friendId
- Messages references Users for fromId and toId

## Individual Contributions

**abostrom**: Created Web3D game using WebAssembly, implemented Web3D WebSocket server.

**vkuusela**: Implemented 3D Pong game using BabylonJS, created game assets and visual effects.

**vlopatin**: Implemented server-side Pong logic and AI opponent. 

**jtuomi**: Frontend and backend development, REST API endpoints, UI design.

**maoliiny**: Frontend, backend, and database development, system architecture.

## Modules

### Major Modules (2 points each)
| Module | Justification | Implemented By |
|--------|---------------|----------------|
| Framework for frontend and backend (Astro + Preact) | Astro provides SSR and island architecture; Preact is lightweight and fast | maoliiny, jtuomi |
| Real-time features using WebSockets | Needed for multiplayer game synchronization and live messaging | vlopatin, abostrom, jtuomi |
| User interaction (chat, friends, profiles) | Core social features for a multiplayer platform | maoliiny |
| User management and authentication | Security and session management for user accounts | maoliiny, jtuomi |
| AI Opponent for games | Single-player Pong experience when no opponents available | vlopatin |
| Complete web-based game (3D Pong) | Main competitive game with BabylonJS rendering | vkuusela, vlopatin, jtuomi |
| Remote players (real-time multiplayer) | Two players on separate computers playing together | vlopatin, vkuusela, jtuomi, abostrom |
| Advanced 3D graphics (BabylonJS) | 3D rendering for immersive Pong gameplay | vkuusela |
| Second game with history and matchmaking (Web3D) | WASM-based gem collection game for variety | abostrom |

### Minor Modules (1 point each)
| Module | Justification | Implemented By |
|--------|---------------|----------------|
| ORM for database (Drizzle via Astro DB) | Type-safe database operations and migrations | maoliiny |
| Server-Side Rendering (SSR) | SEO-friendly initial page loads | maoliiny |

**Total: 20 points**

## AI Usage

Gemini 3 Pro was used to create privacy policy & ToS.</br> Github Copilot did at least one code review.</br>ChatGPT was consulted on TypeScript usage. 

## Features List

### Authentication & User Management
- User registration and login (jtuomi, maoliiny)
- Session management with httpOnly cookies (maoliiny)
- Profile management and avatar upload (maoliiny)
- Password strength validation (jtuomi)

### Social Features
- Friends system (add/remove friends, online status) (maoliiny)
- Direct messaging between users (maoliiny)
- Friend requests handling (maoliiny)

### Games
- 3D Pong game with BabylonJS (vkuusela)
- Pong WebSocket server for real-time multiplayer (vlopatin)
- AI opponent for Pong (vlopatin)
- Web3D WASM-based game (abostrom)
- Web3D WebSocket server (abostrom)

### Backend & Database
- Astro DB schema and migrations (maoliiny)
- REST API endpoints for all features (jtuomi, maoliiny)
- WebSocket servers for game synchronization (vlopatin, abostrom)

### Frontend
- Astro + Preact component architecture (jtuomi)
- TailwindCSS + DaisyUI styling (jtuomi)
- Responsive UI design (jtuomi)
- Game UI overlays with BabylonJS (vkuusela)
