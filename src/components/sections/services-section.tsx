import { useReveal } from "@/hooks/use-reveal"
import { useState } from "react"

const BONUSES = [
  {
    title: "Приветственный бонус",
    description: "500 KAZAHCOIN при регистрации — просто так, без условий",
    tag: "СТАРТ",
    direction: "top",
  },
  {
    title: "Промокоды",
    description: "Вводи промокод и получай дополнительные монеты. Новые коды каждую неделю",
    tag: "PROMO",
    direction: "right",
  },
  {
    title: "Перевод монет",
    description: "Отправляй KAZAHCOIN друзьям мгновенно — внутри платформы без комиссий",
    tag: "P2P",
    direction: "left",
  },
  {
    title: "Кэшбэк 10%",
    description: "Каждую пятницу возвращаем 10% от потраченных монет за неделю",
    tag: "WEEKLY",
    direction: "bottom",
  },
  {
    title: "Реферальная программа",
    description: "Приглашай друзей — получай 100 KAZAHCOIN за каждого нового игрока",
    tag: "REFER",
    direction: "top",
  },
  {
    title: "VIP-статус",
    description: "Чем больше играешь — тем выше статус и эксклюзивнее бонусы",
    tag: "VIP",
    direction: "bottom",
  },
]

export function BonusSection() {
  const { ref, isVisible } = useReveal(0.3)
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)

  const handlePromo = () => {
    if (promoCode.trim()) {
      setPromoApplied(true)
      setTimeout(() => setPromoApplied(false), 3000)
      setPromoCode("")
    }
  }

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start items-center px-6 pt-20 md:px-12 md:pt-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div
          className={`mb-8 transition-all duration-700 md:mb-10 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Бонусы
          </h2>
          <p className="font-mono text-sm text-yellow-400/70 md:text-base">/ Щедрые награды для игроков</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-x-12 md:gap-y-8 lg:gap-x-16">
          {BONUSES.map((bonus, i) => {
            const getRevealClass = () => {
              if (!isVisible) {
                switch (bonus.direction) {
                  case "left": return "-translate-x-16 opacity-0"
                  case "right": return "translate-x-16 opacity-0"
                  case "top": return "-translate-y-16 opacity-0"
                  case "bottom": return "translate-y-16 opacity-0"
                  default: return "translate-y-12 opacity-0"
                }
              }
              return "translate-x-0 translate-y-0 opacity-100"
            }

            return (
              <div
                key={i}
                className={`group transition-all duration-700 ${getRevealClass()}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-px w-6 bg-yellow-400/40 transition-all duration-300 group-hover:w-10 group-hover:bg-yellow-400/70" />
                  <span className="font-mono text-xs text-yellow-400/70">{bonus.tag}</span>
                </div>
                <h3 className="mb-1.5 font-sans text-lg font-light text-foreground group-hover:text-yellow-300 transition-colors md:text-xl">
                  {bonus.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/70 md:text-base">{bonus.description}</p>
              </div>
            )
          })}
        </div>

        <div
          className={`mt-8 transition-all duration-700 md:mt-10 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
          style={{ transitionDelay: "700ms" }}
        >
          <div className="flex items-center gap-3 max-w-md">
            <div className="flex-1 border-b border-foreground/30 hover:border-yellow-400/50 transition-colors">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Введи промокод..."
                className="w-full bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handlePromo()}
              />
            </div>
            <button
              onClick={handlePromo}
              className="border border-yellow-400/50 bg-yellow-400/10 px-4 py-2 font-mono text-xs text-yellow-300 transition-all hover:bg-yellow-400/20 hover:border-yellow-400"
            >
              {promoApplied ? "✓ Применён!" : "Применить"}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
