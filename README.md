# Usage
Install `npm` and `deno`.
Goto `site` and run `deno i`. Then either; </br>
 a) `deno task dev` to start development server or, </br>
 b) `deno task build && deno task start` for production build. </br>
Open browser and open address printed to stdout.

## Team & roles
👑 or product owner -> [abostrom](https://intra.42.fr/users/abostrom) </br>
[Beastmaster](https://en.wikipedia.org/wiki/The_Beastmaster#/media/File:TheBeastmaster.jpg)/manager -> [vkuusela](https://intra.42.fr/vkuusela) </br>
Technical architect -> [vlopatin](https://intra.42.fr/users/vlopatin) </br>
Developers -> [jtuomi](https://intra.42.fr/users/jtuomi), [maoliiny](https://intra.42.fr/users/maoliiny)

## Tech stack
### Framework -> [Fresh](https://fresh.deno.dev)
Fresh is built on top of [Deno](https://deno.com) runtime. It uses [Preact](https://preactjs.com) which has React API but renders to HTML on server. </br>
It builds using [Vite](https://vite.dev) with CORS, CRSF and trailingSlashes middleware plugins. </br> 
It utilizes [TailwindCSS](https://tailwindcss.com) which we extended with [DaisyUI](https://daisyui.com) and [Typography](https://github.com/tailwindlabs/tailwindcss-typography) plugins. </br>
Database schema is built with [Prisma ORM](https://www.prisma.io/) and database is [SQLite](https://sqlite.com).

### Games -> Pong
[BabylonJS](https://babylonjs.com) is used for 3D rendering on the client end. </br>
And a backend server is used for calculating the state and communicating that to clients using WebSockets. </br>

### Games -> InsertGameName
Second game built using [this].
