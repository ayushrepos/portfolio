const VERIFICATION_FILES = {
  "/googleb57ade3d80d6a628.html": {
    body: "google-site-verification: googleb57ade3d80d6a628.html",
    contentType: "text/html; charset=utf-8"
  },
  "/.well-known/discord": {
    body: "dh=9e7988067562e929d7b65e0aaee8f067d58bb107",
    contentType: "text/plain; charset=utf-8"
  }
};

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);
  const file = VERIFICATION_FILES[pathname];

  if (!file) {
    return context.next();
  }

  return new Response(file.body, {
    status: 200,
    headers: {
      "content-type": file.contentType,
      "cache-control": "public, max-age=0, must-revalidate",
      "x-content-type-options": "nosniff"
    }
  });
}
