*This project has been created as part of the 42 curriculum by abostrom, maoliiny, jtuomi, vkuusela and vlopatin.*

## Description

ft_transcendence is a real-world web application developed as part of the 42 curriculum. The primary goal is to learn core technologies by implementing various modules that team members are interested in, enabling all members to develop themselves as generalists who can pick up new skills after the core curriculum.

The project includes a complete web application with user management, interactive games, real-time multiplayer support, and multiple modules covering various domains.

## Instructions

### Development

```bash
bun i && bun dev
```

### Production

```bash
./run.sh -u
```

## Team & roles
[abostrom](https://intra.42.fr/users/abostrom) </br>
[vkuusela](https://intra.42.fr/vkuusela) </br>
[vlopatin](https://intra.42.fr/users/vlopatin) </br>
[jtuomi](https://intra.42.fr/users/jtuomi)</br>
[maoliiny](https://intra.42.fr/users/maoliiny)

## Project Management

Communication is handled through a Discord group. The GitHub repository is set up with issue-driven development where tasks are tracked as issues and assigned to team members. All pull requests to the main branch require at least one review before merging. Core team decisions are documented, and meetings are held in the reserved rooms when needed.

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

- abostrom: Created Web3D game using WASM, supported development coordination with other teams
- vkuusela: Implemented 3D Pong game using BabylonJS
- jtuomi: Frontend and backend development
- maoliiny: Frontend, backend, and database development
- vlopatin: Server-side Pong implementation and AI opponent

## Modules

### Major Modules
- Use a framework for both the frontend and backend (Astro + Preact) - 2 points
- Implement real-time features using WebSockets or similar technology - 2 points
- Allow users to interact with other users (chat, profile, friends system) - 2 points
- Standard user management and authentication - 2 points
- Introduce an AI Opponent for games - 2 points
- Implement a complete web-based game where users can play against each other (3D Pong) - 2 points
- Remote players — Enable two players on separate computers to play the same game in real-time - 2 points
- Implement advanced 3D graphics using a library like Three.js or Babylon.js - 2 points
- Add another game with user history and matchmaking (Web3D) - 2 points

### Minor Modules
- Use an ORM for the database (Drizzle via Astro DB) - 1 point
- Server-Side Rendering (SSR) - 1 point

Total: 20 points

## AI Usage

Gemini 3 Pro was used to create privacy policy & ToS.</br> Github Copilot did at least one code review.</br>ChatGPT was consulted on TypeScript usage.

## Features List

You can login, play games with friends, and chat with other users.
