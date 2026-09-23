import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "session";
const WEEK = 60 * 60 * 24 * 7;

if (!SECRET) {
  throw new Error("JWT_SECRET is not defined in your environment variables");
}

// Small built-in cookie helpers (replaces the "cookie" package).
function buildCookie(value, maxAge) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

function readCookie(req, name) {
  if (req.cookies && typeof req.cookies === "object" && req.cookies[name]) {
    return req.cookies[name];
  }
  const header = (req.headers && req.headers.cookie) || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      const raw = part.slice(i + 1).trim();
      try {
        return decodeURIComponent(raw);
      } catch (err) {
        return raw;
      }
    }
  }
  return null;
}

// Create a signed token for a user and return a Set-Cookie header value
export function createSessionCookie(user) {
  const token = jwt.sign(
    { id: user._id.toString(), fullname: user.fullname, email: user.email },
    SECRET,
    { expiresIn: "7d" }
  );
  return buildCookie(token, WEEK);
}

// Cookie value used to clear the session on logout
export function clearSessionCookie() {
  return buildCookie("", 0);
}

// Read + verify the session from an incoming request (API routes)
export function getUserFromRequest(req) {
  const token = readCookie(req, COOKIE_NAME);
  if (!token) return null;

  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

// Used inside getServerSideProps (req/res come from context)
export function getUserFromContext(context) {
  return getUserFromRequest(context.req);
}
