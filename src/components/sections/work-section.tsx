import { useReveal } from "@/hooks/use-reveal"
import Icon from "@/components/ui/icon"
import { useState } from "react"

const GAMES = [
  { number: "01", title: "Слоты", category: "Однорукий бандит", emoji: "🎰", desc: "Классические барабаны, джекпоты и бонус-раунды", direction: "left" },
  { number: "02", title: "Рулетка", category: "Европейская & американская", emoji: "🎡", desc: "Делай ставки, крути колесо, выигрывай KAZAHCOIN", direction: "right" },
  { number: "03", title: "Блэкджек", category: "Карточная игра", emoji: "🃏", desc: "Набери 21 и обыграй дилера", direction: "left" },
  { number: "04", title: "Покер", category: "Техасский холдем", emoji: "♠️", desc: "Турниры и кэш-игры за KAZAHCOIN", direction: "right" },
  { number: "05", title: "Краш", category: "Быстрая игра", emoji: "🚀", desc: "Успей забрать множитель до краша", direction: "left" },
  { number: "06", title: "Dice", category: "Кости на удачу", emoji: "🎲", desc: "Угадай результат броска и умножь монеты", direction: "right" },
]

export function GamesSection() {
  const { ref, isVisible } = useReveal(0.3)
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start items-center px-6 pt-20 md:px-12 md:pt-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div
          className={`mb-8 transition-all duration-700 md:mb-12 ${
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Игры
          </h2>
          <p className="font-mono text-sm text-yellow-400/70 md:text-base">/ 6 уникальных режимов</p>
        </div>

        <div className="space-y-3 md:space-y-4">
          {GAMES.map((game, i) => {
            const isLeft = game.direction === "left"
            const revealClass = !isVisible
              ? isLeft ? "-translate-x-16 opacity-0" : "translate-x-16 opacity-0"
              : "translate-x-0 opacity-100"

            return (
              <div
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={`group flex items-center justify-between border-b border-foreground/10 py-4 transition-all duration-700 hover:border-yellow-400/30 cursor-pointer md:py-5 ${revealClass}`}
                style={{
                  transitionDelay: `${i * 80}ms`,
                  marginLeft: i % 2 === 0 ? "0" : "auto",
                  maxWidth: i % 2 === 0 ? "85%" : "92%",
                }}
              >
                <div className="flex items-center gap-4 md:gap-8">
                  <span className="font-mono text-sm text-foreground/30 transition-colors group-hover:text-yellow-400/50 md:text-base">
                    {game.number}
                  </span>
                  <span className="text-2xl">{game.emoji}</span>
                  <div>
                    <h3 className="mb-0.5 font-sans text-xl font-light text-foreground transition-all duration-300 group-hover:translate-x-2 group-hover:text-yellow-300 md:text-2xl lg:text-3xl">
                      {game.title}
                    </h3>
                    <p className="font-mono text-xs text-foreground/50 md:text-sm">
                      {hovered === i ? game.desc : game.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden font-mono text-xs text-yellow-400/60 md:block">KAZAHCOIN</span>
                  <Icon name="ChevronRight" size={16} className="text-foreground/30 transition-all group-hover:text-yellow-400 group-hover:translate-x-1" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
