import { useReveal } from "@/hooks/use-reveal"
import { useState, type FormEvent } from "react"
import { MagneticButton } from "@/components/magnetic-button"
import Icon from "@/components/ui/icon"

export function RegisterSection() {
  const { ref, isVisible } = useReveal(0.3)
  const [formData, setFormData] = useState({ username: "", email: "", password: "", promo: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [balance] = useState(500)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.username || !formData.email || !formData.password) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsSubmitting(false)
    setSubmitSuccess(true)
    setFormData({ username: "", email: "", password: "", promo: "" })
    setTimeout(() => setSubmitSuccess(false), 6000)
  }

  const fields = [
    { key: "username", label: "Никнейм", type: "text", placeholder: "Твой игровой псевдоним" },
    { key: "email", label: "Email", type: "email", placeholder: "your@email.com" },
    { key: "password", label: "Пароль", type: "password", placeholder: "Минимум 8 символов" },
    { key: "promo", label: "Промокод (необязательно)", type: "text", placeholder: "BONUS500" },
  ] as const

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start items-center px-4 pt-20 md:px-12 md:pt-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-16 lg:gap-24">
          <div className="flex flex-col justify-center">
            <div
              className={`mb-6 transition-all duration-700 md:mb-12 ${
                isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
              }`}
            >
              <h2 className="mb-2 font-sans text-4xl font-light leading-[1.05] tracking-tight text-foreground md:mb-3 md:text-7xl lg:text-8xl">
                Начни
                <br />
                играть
              </h2>
              <p className="font-mono text-xs text-yellow-400/70 md:text-base">/ Регистрация занимает 30 секунд</p>
            </div>

            <div className="space-y-5 md:space-y-8">
              <div
                className={`transition-all duration-700 ${
                  isVisible ? "translate-x-0 opacity-100" : "-translate-x-16 opacity-0"
                }`}
                style={{ transitionDelay: "200ms" }}
              >
                <div className="inline-flex items-center gap-3 rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-3">
                  <span className="text-2xl">₭</span>
                  <div>
                    <p className="font-mono text-xs text-yellow-400/70">Стартовый бонус</p>
                    <p className="text-2xl font-light text-yellow-300">{balance} KAZAHCOIN</p>
                  </div>
                </div>
              </div>

              <div
                className={`space-y-3 transition-all duration-700 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                }`}
                style={{ transitionDelay: "350ms" }}
              >
                {[
                  { icon: "Shield", text: "Анонимная регистрация" },
                  { icon: "Zap", text: "Мгновенное зачисление монет" },
                  { icon: "Users", text: "Переводы между игроками" },
                  { icon: "Gift", text: "Бонусы и промокоды каждую неделю" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Icon name={item.icon as "Shield"} size={14} className="text-yellow-400/60" />
                    <span className="font-mono text-xs text-foreground/70">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            {submitSuccess ? (
              <div
                className={`transition-all duration-700 ${
                  isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
                }`}
              >
                <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-8 text-center">
                  <div className="mb-4 text-5xl">🎉</div>
                  <h3 className="mb-2 font-sans text-2xl font-light text-yellow-300">Добро пожаловать!</h3>
                  <p className="font-mono text-sm text-foreground/70">500 KAZAHCOIN зачислены на счёт</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                {fields.map((field, i) => (
                  <div
                    key={field.key}
                    className={`transition-all duration-700 ${
                      isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
                    }`}
                    style={{ transitionDelay: `${150 + i * 100}ms` }}
                  >
                    <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">{field.label}</label>
                    <input
                      type={field.type}
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      required={field.key !== "promo"}
                      className="w-full border-b border-foreground/30 bg-transparent py-1.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-yellow-400/50 focus:outline-none md:py-2 md:text-base"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}

                <div
                  className={`transition-all duration-700 ${
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                  }`}
                  style={{ transitionDelay: "600ms" }}
                >
                  <MagneticButton
                    variant="primary"
                    size="lg"
                    className="w-full disabled:opacity-50"
                  >
                    {isSubmitting ? "Создаём аккаунт..." : "Получить 500 KAZAHCOIN →"}
                  </MagneticButton>
                  <p className="mt-3 text-center font-mono text-xs text-foreground/40">
                    Нажимая кнопку, ты соглашаешься с правилами платформы
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
