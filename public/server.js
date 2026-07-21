const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const querystring = require("querystring");

const ROOT_DIR = __dirname;
const PORT = Number(process.env.PORT || 3000);
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const CONTACT_TARGET_EMAIL = "ferres@datanolie.com.au";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime"
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.end();
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function sendViaResend(fields) {
  const sections = Object.entries(fields).map(([label, value]) => {
    const display = value && String(value).trim() !== "" ? value : "-";
    return `<strong>${escapeHtml(label)}:</strong><br>${escapeHtml(display).replace(/\n/g, "<br>")}`;
  });

  const payload = {
    from: RESEND_FROM_EMAIL,
    to: [CONTACT_TARGET_EMAIL],
    subject: "New Contact Form Submission - DataNoLie",
    html: `<h2>New Contact Request</h2>${sections.join("<br><br>")}`,
    reply_to: fields.Email
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Resend HTTP ${response.status}: ${bodyText}`);
  }
}

async function handleContactSubmit(req, res) {
  try {
    const raw = await readRequestBody(req);
    const data = querystring.parse(raw);

    if ((data.website || "").toString().trim() !== "") {
      redirect(res, "/contactus/index.html?mail_status=sent");
      return;
    }

    const name = (data.name || "").toString().trim();
    const email = (data.email || "").toString().trim();
    const description = (data.description || "").toString().trim();
    const consent = data.consent !== undefined;

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !description || !consent || !validEmail) {
      redirect(res, "/contactus/index.html?mail_status=failed");
      return;
    }

    if (!RESEND_API_KEY) {
      console.error("Resend error: RESEND_API_KEY is not configured.");
      redirect(res, "/contactus/index.html?mail_status=failed");
      return;
    }

    const fields = {
      Name: name,
      Email: email,
      Company: (data.company || "").toString().trim(),
      Phone: (data.phone || "").toString().trim(),
      "Business / Industry": (data.industry || "").toString().trim(),
      Interest: (data.interest || "").toString().trim(),
      Budget: (data.budget || "").toString().trim(),
      Timeline: (data.timeline || "").toString().trim(),
      "How did you hear about us?": (data.source || "").toString().trim(),
      "Project Description": description
    };

    await sendViaResend(fields);
    redirect(res, "/contactus/index.html?mail_status=sent");
  } catch (error) {
    console.error("Contact submit error:", error.message);
    redirect(res, "/contactus/index.html?mail_status=failed");
  }
}

function safeFilePathFromUrlPath(urlPathname) {
  const decodedPath = decodeURIComponent(urlPathname.split("?")[0]);
  let relativePath = decodedPath === "/" ? "/index.html" : decodedPath;

  const absolutePath = path.resolve(ROOT_DIR, `.${relativePath}`);
  if (!absolutePath.startsWith(ROOT_DIR)) {
    return null;
  }

  let finalPath = absolutePath;
  if (fs.existsSync(finalPath) && fs.statSync(finalPath).isDirectory()) {
    finalPath = path.join(finalPath, "index.html");
  }

  return finalPath;
}

function serveStatic(req, res, pathname) {
  const filePath = safeFilePathFromUrlPath(pathname);

  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  res.statusCode = 200;
  res.setHeader("Content-Type", contentType);
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const method = req.method || "GET";
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname;

  if (method === "POST" && (pathname === "/contactus/send" || pathname === "/contactus/send/")) {
    await handleContactSubmit(req, res);
    return;
  }

  if (method !== "GET" && method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Method Not Allowed");
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
