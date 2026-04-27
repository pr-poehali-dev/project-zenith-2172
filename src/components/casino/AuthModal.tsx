import { useState } from "react"
import { api } from "@/lib/api"
import { useKzcStore } from "@/lib/store"
import Icon from "@/components/ui/icon"

interface Props {
  onClose: () => void
}

export default function AuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<"login" | "register">("register")
  const [form, setForm] = useState({ username: "", email: "", password: "", promo: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { setUser, setToken } = useKzcStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = mode === "register"
        ? await api.register(form)
        : await api.login({ email: form.email, password: form.password })

      if (res.error) { setError(res.error); return }
      setToken(res.token)
      setUser(res.user)
      onClose()
    } catch {
      setError("Ошибка соединения")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-xl border border-yellow-400/20 bg-black/90 p-8">
        <button onClick={onClose} className="absolute right-4 top-4 text-foreground/40 hover:text-foreground">
          <Icon name="X" size={20} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">₭</span>
            <span className="font-sans text-xl font-semibold text-yellow-400">KAZAHCOIN</span>
          </div>
          <div className="flex gap-4 mt-4">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`font-mono text-sm pb-1 border-b transition-colors ${
                  mode === m ? "border-yellow-400 text-yellow-300" : "border-transparent text-foreground/50 hover:text-foreground"
                }`}
              >
                {m === "register" ? "Регистрация" : "Войти"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block font-mono text-xs text-foreground/50 mb-1">Никнейм</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                className="w-full border-b border-foreground/30 bg-transparent py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-400/60 focus:outline-none"
                placeholder="Твой игровой псевдоним"
              />
            </div>
          )}
          <div>
            <label className="block font-mono text-xs text-foreground/50 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full border-b border-foreground/30 bg-transparent py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-400/60 focus:outline-none"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-foreground/50 mb-1">Пароль</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full border-b border-foreground/30 bg-transparent py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-400/60 focus:outline-none"
              placeholder="Минимум 6 символов"
            />
          </div>
          {mode === "register" && (
            <div>
              <label className="block font-mono text-xs text-foreground/50 mb-1">Промокод (необязательно)</label>
              <input
                type="text"
                value={form.promo}
                onChange={(e) => setForm({ ...form, promo: e.target.value.toUpperCase() })}
                className="w-full border-b border-foreground/30 bg-transparent py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-400/60 focus:outline-none"
                placeholder="KAZAH500"
              />
            </div>
          )}

          {error && <p className="font-mono text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 border border-yellow-400/50 bg-yellow-400/10 py-3 font-mono text-sm text-yellow-300 transition-all hover:bg-yellow-400/20 disabled:opacity-50"
          >
            {loading ? "Загрузка..." : mode === "register" ? "Получить 500 ₭ KAZAHCOIN →" : "Войти в аккаунт →"}
          </button>
        </form>

        {mode === "register" && (
          <p className="mt-4 text-center font-mono text-xs text-foreground/30">
            Попробуй промокод <span className="text-yellow-400/60">KAZAH500</span> для +500₭
          </p>
        )}
      </div>
    </div>
  )
}
