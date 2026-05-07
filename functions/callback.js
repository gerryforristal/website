export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const origin = url.origin;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${origin}/callback`,
    }),
  });

  const data = await tokenRes.json();

  if (!data.access_token) {
    return new Response('OAuth error: ' + JSON.stringify(data), { status: 500 });
  }

  const payload = JSON.stringify({ token: data.access_token, provider: 'github' });

  const html = `<!doctype html>
<html>
<head><title>Authorizing...</title></head>
<body>
<script>
(function() {
  var payload = ${payload};
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:success:' + JSON.stringify(payload),
      e.origin
    );
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
