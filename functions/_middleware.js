const VERIFICATION_PATH = "/googleb57ade3d80d6a628.html";
const VERIFICATION_BODY = "google-site-verification: googleb57ade3d80d6a628.html";

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);

  if (pathname === VERIFICATION_PATH) {
    return new Response(VERIFICATION_BODY, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "x-content-type-options": "nosniff"
      }
    });
  }

  return context.next();
}
