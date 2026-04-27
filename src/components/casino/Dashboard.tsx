import { useState, useEffect, useCallback } from "react"
import { useKzcStore } from "@/lib/store"
import { api } from "@/lib/api"
import Icon from "@/components/ui/icon"

const GAMES = [
  { id: "slots", name: "Слоты", emoji: "🎰" },
  { id: "roulette", name: "Рулетка", emoji: "🎡" },
  { id: "blackjack", name: "Блэкджек", emoji: "🃏" },
  { id: "crash", name: "Краш", emoji: "🚀" },
  { id: "dice", name: "Дайс", emoji: "🎲" },
  { id: "poker", name: "Покер", emoji: "♠️" },
]

type Tab = "games" | "wallet" | "transfer" | "promo"

export default function Dashboard({ onClose }: { onClose: () => void }) {
  const { user, logout, updateBalance } = useKzcStore()
  const [tab, setTab] = useState<Tab>("games")
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [bet, setBet] = useState(50)
  const [gameResult, setGameResult] = useState<null | { won: boolean; result: Record<string, unknown> }>(null)
  const [playing, setPlaying] = useState(false)
  const [rouletteChoice, setRouletteChoice] = useState("red")
  const [crashOut, setCrashOut] = useState(1.5)
  const [transactions, setTransactions] = useState<{ type: string; amount: number; description: string; created_at: string }[]>([])
  const [gameHistory, setGameHistory] = useState<{ game: string; bet: number; result: number; won: boolean; created_at: string }[]>([])
  const [transferTo, setTransferTo] = useState("")
  const [transferAmount, setTransferAmount] = useState(100)
  const [promoCode, setPromoCode] = useState("")
  const [msg, setMsg] = useState("")
  const [msgType, setMsgType] = useState<"ok" | "err">("ok")

  const showMsg = (text: string, type: "ok" | "err" = "ok") => {
    setMsg(text)
    setMsgType(type)
    setTimeout(() => setMsg(""), 4000)
  }

  const loadHistory = useCallback(async () => {
    const [h, g] = await Promise.all([api.history(), api.gameHistory()])
    if (h.transactions) setTransactions(h.transactions)
    if (g.games) setGameHistory(g.games)
  }, [])

  useEffect(() => {
    if (tab === "wallet") loadHistory()
  }, [tab, loadHistory])

  const playGame = async () => {
    if (!activeGame || bet <= 0) return
    setPlaying(true)
    setGameResult(null)
    const extra: Record<string, unknown> = {}
    if (activeGame === "roulette") extra.choice = rouletteChoice
    if (activeGame === "crash") extra.cash_out = crashOut
    const res = await api.play(activeGame, bet, extra)
    setPlaying(false)
    if (res.error) { showMsg(res.error, "err"); return }
    setGameResult({ won: res.won, result: res.result })
    updateBalance(res.new_balance)
  }

  const doTransfer = async () => {
    if (!transferTo || transferAmount <= 0) return
    const res = await api.transfer(transferTo, transferAmount)
    if (res.error) { showMsg(res.error, "err"); return }
    updateBalance(res.new_balance)
    showMsg(`Переведено ${transferAmount}₭ → ${transferTo}`)
    setTransferTo("")
  }

  const doPromo = async () => {
    if (!promoCode) return
    const res = await api.promo(promoCode)
    if (res.error) { showMsg(res.error, "err"); return }
    updateBalance(res.new_balance)
    showMsg(`+${res.reward} KAZAHCOIN зачислено!`)
    setPromoCode("")
  }

  const renderGameResult = () => {
    if (!gameResult) return null
    const r = gameResult.result
    return (
      <div className={`mt-4 rounded-lg border p-4 ${gameResult.won ? "border-yellow-400/40 bg-yellow-400/5" : "border-red-500/30 bg-red-500/5"}`}>
        <p className={`font-sans text-2xl font-light mb-2 ${gameResult.won ? "text-yellow-300" : "text-red-400"}`}>
          {gameResult.won ? "🎉 Победа!" : "😔 Проигрыш"}
        </p>
        {activeGame === "slots" && (
          <div className="flex gap-3 text-3xl mb-1">
            {(r.reels as string[]).map((s, i) => <span key={i}>{s}</span>)}
          </div>
        )}
        {activeGame === "roulette" && (
          <p className="font-mono text-sm text-foreground/70">Выпало: <span className="text-foreground">{r.number as number}</span> ({r.color as string})</p>
        )}
        {activeGame === "blackjack" && (
          <p className="font-mono text-sm text-foreground/70">Ты: {r.player_score as number} | Дилер: {r.dealer_score as number}</p>
        )}
        {activeGame === "crash" && (
          <p className="font-mono text-sm text-foreground/70">Краш на x{r.crash_at as number} | Ты вышел на x{r.cash_out as number}</p>
        )}
        {activeGame === "dice" && (
          <p className="font-mono text-sm text-foreground/70">Ты: {r.player_roll as number} 🎲 | Бот: {r.computer_roll as number} 🎲</p>
        )}
        {activeGame === "poker" && (
          <div>
            <p className="font-mono text-xs text-foreground/60 mb-1">Твои карты: {(r.player_hand as string[]).join(" ")}</p>
            <p className="font-mono text-xs text-foreground/60">Дилер: {(r.dealer_hand as string[]).join(" ")}</p>
          </div>
        )}
        {gameResult.won && <p className="font-mono text-sm text-yellow-400 mt-2">+{(r.win_amount as number) - bet}₭ прибыль</p>}
      </div>
    )
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "games", label: "Игры", icon: "Gamepad2" },
    { id: "wallet", label: "Кошелёк", icon: "Wallet" },
    { id: "transfer", label: "Перевод", icon: "ArrowLeftRight" },
    { id: "promo", label: "Промокод", icon: "Tag" },
  ]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-xl border border-yellow-400/20 bg-black/95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/10">
          <div className="flex items-center gap-3">
            <span className="text-xl">₭</span>
            <div>
              <p className="font-sans text-sm font-medium text-foreground">{user?.username}</p>
              <p className="font-mono text-xs text-yellow-400">{user?.balance?.toLocaleString()} KAZAHCOIN</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-foreground/40">VIP {user?.vip_level}</span>
            <button onClick={logout} className="font-mono text-xs text-foreground/40 hover:text-foreground transition-colors">Выйти</button>
            <button onClick={onClose} className="text-foreground/40 hover:text-foreground">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-foreground/10">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 font-mono text-xs transition-colors flex items-center justify-center gap-1.5 ${
                tab === t.id ? "text-yellow-400 border-b border-yellow-400" : "text-foreground/50 hover:text-foreground"
              }`}
            >
              <Icon name={t.icon as "Wallet"} size={12} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {msg && (
            <div className={`mb-4 rounded border px-4 py-2 font-mono text-xs ${msgType === "ok" ? "border-yellow-400/30 text-yellow-300" : "border-red-500/30 text-red-400"}`}>
              {msg}
            </div>
          )}

          {/* GAMES TAB */}
          {tab === "games" && (
            <div>
              {!activeGame ? (
                <div>
                  <p className="font-mono text-xs text-foreground/50 mb-4">Выбери игру:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {GAMES.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => { setActiveGame(g.id); setGameResult(null) }}
                        className="flex flex-col items-center gap-2 rounded-lg border border-foreground/10 p-4 hover:border-yellow-400/40 hover:bg-yellow-400/5 transition-all"
                      >
                        <span className="text-3xl">{g.emoji}</span>
                        <span className="font-mono text-xs text-foreground/70">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => { setActiveGame(null); setGameResult(null) }}
                    className="flex items-center gap-2 font-mono text-xs text-foreground/50 hover:text-foreground mb-4 transition-colors"
                  >
                    <Icon name="ChevronLeft" size={14} /> Назад к играм
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{GAMES.find(g => g.id === activeGame)?.emoji}</span>
                    <h3 className="font-sans text-xl text-foreground">{GAMES.find(g => g.id === activeGame)?.name}</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block font-mono text-xs text-foreground/50 mb-2">Ставка (KAZAHCOIN)</label>
                      <div className="flex gap-2 mb-2">
                        {[10, 50, 100, 250, 500].map((v) => (
                          <button
                            key={v}
                            onClick={() => setBet(v)}
                            className={`px-3 py-1 font-mono text-xs border transition-colors ${bet === v ? "border-yellow-400 text-yellow-300" : "border-foreground/20 text-foreground/50 hover:border-foreground/40"}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={bet}
                        onChange={(e) => setBet(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full border-b border-foreground/30 bg-transparent py-2 font-mono text-sm text-foreground focus:border-yellow-400/60 focus:outline-none"
                      />
                    </div>

                    {activeGame === "roulette" && (
                      <div>
                        <label className="block font-mono text-xs text-foreground/50 mb-2">Ставить на:</label>
                        <div className="flex gap-2 flex-wrap">
                          {["red", "black", "even", "odd"].map((c) => (
                            <button
                              key={c}
                              onClick={() => setRouletteChoice(c)}
                              className={`px-3 py-1 font-mono text-xs border transition-colors ${rouletteChoice === c ? "border-yellow-400 text-yellow-300" : "border-foreground/20 text-foreground/50 hover:border-foreground/40"}`}
                            >
                              {c === "red" ? "🔴 Красное" : c === "black" ? "⚫ Чёрное" : c === "even" ? "Чётное" : "Нечётное"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeGame === "crash" && (
                      <div>
                        <label className="block font-mono text-xs text-foreground/50 mb-2">Забрать на множителе:</label>
                        <div className="flex gap-2 flex-wrap">
                          {[1.2, 1.5, 2.0, 3.0, 5.0].map((v) => (
                            <button
                              key={v}
                              onClick={() => setCrashOut(v)}
                              className={`px-3 py-1 font-mono text-xs border transition-colors ${crashOut === v ? "border-yellow-400 text-yellow-300" : "border-foreground/20 text-foreground/50 hover:border-foreground/40"}`}
                            >
                              x{v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={playGame}
                      disabled={playing || bet > (user?.balance || 0)}
                      className="w-full border border-yellow-400/50 bg-yellow-400/10 py-3 font-mono text-sm text-yellow-300 transition-all hover:bg-yellow-400/20 disabled:opacity-40"
                    >
                      {playing ? "Крутим..." : `Играть за ${bet}₭`}
                    </button>
                  </div>

                  {renderGameResult()}
                </div>
              )}
            </div>
          )}

          {/* WALLET TAB */}
          {tab === "wallet" && (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-3">
                <span className="text-2xl">₭</span>
                <div>
                  <p className="font-mono text-xs text-foreground/50">Баланс</p>
                  <p className="font-sans text-2xl font-light text-yellow-300">{user?.balance?.toLocaleString()} KAZAHCOIN</p>
                </div>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-xs text-foreground/50">История транзакций</p>
                <button onClick={loadHistory} className="font-mono text-xs text-foreground/30 hover:text-foreground transition-colors">
                  <Icon name="RefreshCw" size={12} />
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {transactions.length === 0 && <p className="font-mono text-xs text-foreground/30">Пока нет транзакций</p>}
                {transactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-foreground/5">
                    <div>
                      <p className="font-mono text-xs text-foreground/70">{tx.description}</p>
                      <p className="font-mono text-xs text-foreground/30">{new Date(tx.created_at).toLocaleDateString("ru")}</p>
                    </div>
                    <span className={`font-mono text-sm ${["win", "bonus", "promo", "transfer_in", "referral"].includes(tx.type) ? "text-yellow-400" : "text-red-400"}`}>
                      {["win", "bonus", "promo", "transfer_in", "referral"].includes(tx.type) ? "+" : "-"}{tx.amount}₭
                    </span>
                  </div>
                ))}
              </div>

              <p className="font-mono text-xs text-foreground/50 mt-4 mb-2">История игр</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {gameHistory.length === 0 && <p className="font-mono text-xs text-foreground/30">Ещё не играл</p>}
                {gameHistory.map((g, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-foreground/5">
                    <div>
                      <p className="font-mono text-xs text-foreground/70">{g.game} · ставка {g.bet}₭</p>
                      <p className="font-mono text-xs text-foreground/30">{new Date(g.created_at).toLocaleDateString("ru")}</p>
                    </div>
                    <span className={`font-mono text-xs px-2 py-0.5 rounded ${g.won ? "bg-yellow-400/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                      {g.won ? `+${g.result - g.bet}₭` : `-${g.bet}₭`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRANSFER TAB */}
          {tab === "transfer" && (
            <div className="space-y-4">
              <div>
                <p className="font-mono text-sm text-foreground/80 mb-1">Перевод KAZAHCOIN</p>
                <p className="font-mono text-xs text-foreground/40">Мгновенно, без комиссий</p>
              </div>
              <div>
                <label className="block font-mono text-xs text-foreground/50 mb-2">Никнейм получателя</label>
                <input
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full border-b border-foreground/30 bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-400/60 focus:outline-none"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-foreground/50 mb-2">Сумма</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(parseInt(e.target.value) || 0)}
                  className="w-full border-b border-foreground/30 bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-400/60 focus:outline-none"
                />
              </div>
              <button
                onClick={doTransfer}
                className="w-full border border-yellow-400/50 bg-yellow-400/10 py-3 font-mono text-sm text-yellow-300 hover:bg-yellow-400/20 transition-all"
              >
                Отправить {transferAmount}₭ → {transferTo || "..."}
              </button>
              <p className="font-mono text-xs text-foreground/30">Реферальный код: <span className="text-yellow-400/60">{user?.referral_code}</span></p>
            </div>
          )}

          {/* PROMO TAB */}
          {tab === "promo" && (
            <div className="space-y-4">
              <div>
                <p className="font-mono text-sm text-foreground/80 mb-1">Промокод</p>
                <p className="font-mono text-xs text-foreground/40">Введи код и получи монеты мгновенно</p>
              </div>
              <div>
                <label className="block font-mono text-xs text-foreground/50 mb-2">Код</label>
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full border-b border-foreground/30 bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-400/60 focus:outline-none"
                  placeholder="KAZAH500"
                  onKeyDown={(e) => e.key === "Enter" && doPromo()}
                />
              </div>
              <button
                onClick={doPromo}
                className="w-full border border-yellow-400/50 bg-yellow-400/10 py-3 font-mono text-sm text-yellow-300 hover:bg-yellow-400/20 transition-all"
              >
                Применить промокод
              </button>
              <div className="mt-4 rounded border border-foreground/10 p-4">
                <p className="font-mono text-xs text-foreground/50 mb-2">Активные промокоды:</p>
                {[
                  { code: "KAZAH500", desc: "+500 KAZAHCOIN" },
                  { code: "BONUS200", desc: "+200 KAZAHCOIN" },
                  { code: "LUCKY777", desc: "+777 KAZAHCOIN" },
                ].map((p) => (
                  <div key={p.code} className="flex justify-between py-1">
                    <button
                      onClick={() => setPromoCode(p.code)}
                      className="font-mono text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors"
                    >
                      {p.code}
                    </button>
                    <span className="font-mono text-xs text-foreground/40">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
