const URLS = {
  auth: "https://functions.poehali.dev/bf42b559-1f2d-482d-bcdd-36950c4563f2",
  game: "https://functions.poehali.dev/78e87e4e-1964-48b9-be91-77b69e732165",
  wallet: "https://functions.poehali.dev/94644690-522d-4874-a49a-9a012a33eda8",
}

function getToken() {
  return localStorage.getItem("kzc_token") || ""
}

async function req(url: string, method = "GET", body?: object, auth = false) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (auth) headers["X-Auth-Token"] = getToken()
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export const api = {
  register: (data: { username: string; email: string; password: string; promo?: string }) =>
    req(URLS.auth + "/register", "POST", data),

  login: (data: { email: string; password: string }) =>
    req(URLS.auth + "/login", "POST", data),

  me: () => req(URLS.auth + "/me", "GET", undefined, true),

  play: (game: string, bet: number, extra?: object) =>
    req(URLS.game, "POST", { game, bet, ...extra }, true),

  history: () => req(URLS.wallet + "/history", "GET", undefined, true),

  gameHistory: () => req(URLS.wallet + "/games", "GET", undefined, true),

  transfer: (to_username: string, amount: number) =>
    req(URLS.wallet + "/transfer", "POST", { to_username, amount }, true),

  promo: (code: string) =>
    req(URLS.wallet + "/promo", "POST", { code }, true),
}
