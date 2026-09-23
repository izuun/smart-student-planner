import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";

const SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "session";

if (!SECRET) {
  throw new Error("JWT_SECRET is not defined in your environment variables");
}

// Create a signed token for a user and return a Set-Cookie header value
export function createSessionCookie(user) {
  const token = jwt.sign(
    { id: user._id.toString(), fullname: user.fullname, email: user.email },
    SECRET,
    { expiresIn: "7d" }
  );

  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Cookie value used to clear the session on logout
export function clearSessionCookie() {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// Read + verify the session from an incoming request (API routes)
export function getUserFromRequest(req) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];

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
