export const onRequest: PagesFunction = async (context) => {
  const url = context.request.url;
  const targetUrl = new URL(url).searchParams.get("url");
  if (!targetUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }
  try {
    const resp = await fetch(targetUrl, { 
      cf: { cacheTtl: 30, cacheEverything: true }
    });
    const body = await resp.text();
    return new Response(body, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("Content-Type") || "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
