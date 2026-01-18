export function unauthorized(message = "Unauthorized"): Response {
  return Response.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden"): Response {
  return Response.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found"): Response {
  return Response.json({ error: message }, { status: 404 });
}

export function conflict(message = "Conflict"): Response {
  return Response.json({ error: message }, { status: 409 });
}

export function badRequest(message = "Bad request"): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function internalError(message = "Internal server error"): Response {
  return Response.json({ error: message }, { status: 500 });
}

export function success<T>(data: T): Response {
  return Response.json(data, { status: 200 });
}

export function created<T>(data: T): Response {
  return Response.json(data, { status: 201 });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}