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

### Games -> InsertGameName
Second game built using [this].

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [Astro Documentation](https://docs.astro.build)
- [Preact Documentation](https://preactjs.com)

## Database Schema

The database is built using Astro DB with Drizzle ORM. It consists of four tables:

### Users
| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key, auto-incremented |
| username | text | Unique username |
| password | text | Hashed password |
| email | text | Unique email address |
| createdAt | date | Account creation timestamp |
| updatedAt | date | Last update timestamp |
| elo | number | ELO rating (default: 1000) |
| lastSeen | date | Last activity timestamp (optional) |

### Matches
| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key, auto-incremented |
| game | text | Game identifier |
| player1Id | number | Foreign key to Users |
| player2Id | number | Foreign key to Users |
| winnerId | number | Foreign key to winning user (optional) |
| startedAt | date | Match start timestamp |
| completedAt | date | Match completion timestamp (optional) |
| score | text | Match score details (optional) |

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

**Relationships:**
- Matches references Users for player1Id, player2Id, and winnerId
- Sessions references Users for userId
- Friendships references Users for userId and friendId (many-to-many relationship via junction table)

## Individual Contributions

- abostrom: Created Web3D game using WASM, supported development coordination with other teams
- vkuusela: Implemented 3D Pong game using BabylonJS
- jtuomi: Frontend and backend development
- maoliiny: Frontend, backend, and database development
- vlopatin: Server-side Pong implementation and AI opponent

## Modules

### Major Modules
- Full-stack framework (Astro + Preact) - 2 points
- Standard user management and authentication - 2 points
- Remote players (real-time multiplayer) - 2 points
- AI opponent for games - 2 points
- Another game with user history and matchmaking - 2 points
- Web-based game (Pong) - 2 points
- Advanced 3D techniques (BabylonJS) - 2 points
- Server-side Pong with API implementation - 2 points

### Minor Modules
- ORM for database (Drizzle) - 1 point
- Expanding browser compatibility - 1 point
- Server-Side Rendering (SSR) - 1 point

Total: 20 points

## AI Usage

Gemini 3 Pro was used to create privacy policy & ToS.</br> Github Copilot did at least one code review.</br>ChatGPT was consulted on TypeScript usage. 

## Features List

You can go login, play games with friends and have limited usage history.
