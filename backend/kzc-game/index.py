import json
import os
import random
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_from_token(cur, token: str):
    cur.execute(
        "SELECT u.id, u.username, u.balance FROM kzc_users u JOIN kzc_sessions s ON s.user_id=u.id WHERE s.token=%s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    """Игровая механика: слоты, рулетка, блэкджек, краш, dice, покер."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    token = (event.get("headers") or {}).get("X-Auth-Token") or (event.get("headers") or {}).get("x-auth-token")
    if not token:
        return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Не авторизован"})}

    body = json.loads(event.get("body") or "{}")
    game = body.get("game", "")
    bet = int(body.get("bet", 0))

    if bet <= 0:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Ставка должна быть больше 0"})}

    conn = get_conn()
    cur = conn.cursor()

    try:
        user = get_user_from_token(cur, token)
        if not user:
            return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Сессия истекла"})}

        user_id, username, balance = user

        if balance < bet:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Недостаточно KAZAHCOIN"})}

        result_data = {}

        if game == "slots":
            symbols = ["🍒", "🍋", "🍊", "⭐", "7️⃣", "💎"]
            reels = [random.choice(symbols) for _ in range(3)]
            if reels[0] == reels[1] == reels[2] == "💎":
                multiplier = 20
            elif reels[0] == reels[1] == reels[2]:
                multiplier = 10
            elif reels[0] == reels[1] or reels[1] == reels[2]:
                multiplier = 3
            else:
                multiplier = 0
            won = multiplier > 0
            win_amount = bet * multiplier if won else 0
            result_data = {"reels": reels, "multiplier": multiplier, "win_amount": win_amount}

        elif game == "roulette":
            number = random.randint(0, 36)
            color = "green" if number == 0 else ("red" if number % 2 == 1 else "black")
            choice = body.get("choice", "red")
            if choice in ("red", "black"):
                won = choice == color and number != 0
                win_amount = bet * 2 if won else 0
            elif choice == "even":
                won = number != 0 and number % 2 == 0
                win_amount = bet * 2 if won else 0
            elif choice == "odd":
                won = number % 2 == 1
                win_amount = bet * 2 if won else 0
            else:
                try:
                    chosen_num = int(choice)
                    won = chosen_num == number
                    win_amount = bet * 36 if won else 0
                except Exception:
                    won = False
                    win_amount = 0
            result_data = {"number": number, "color": color, "choice": choice, "win_amount": win_amount}

        elif game == "blackjack":
            player_score = random.randint(14, 21)
            dealer_score = random.randint(14, 21)
            if player_score > 21:
                won = False
            elif dealer_score > 21:
                won = True
            else:
                won = player_score > dealer_score
            win_amount = bet * 2 if won else 0
            result_data = {"player_score": player_score, "dealer_score": dealer_score, "win_amount": win_amount}

        elif game == "crash":
            multiplier_raw = random.uniform(1.0, 10.0)
            crash_at = round(multiplier_raw, 2)
            cash_out = float(body.get("cash_out", 1.5))
            won = cash_out <= crash_at
            win_amount = int(bet * cash_out) if won else 0
            result_data = {"crash_at": crash_at, "cash_out": cash_out, "win_amount": win_amount}

        elif game == "dice":
            player_roll = random.randint(1, 6)
            computer_roll = random.randint(1, 6)
            won = player_roll > computer_roll
            win_amount = bet * 2 if won else 0
            result_data = {"player_roll": player_roll, "computer_roll": computer_roll, "win_amount": win_amount}

        elif game == "poker":
            ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
            suits = ["♠", "♥", "♦", "♣"]
            deck = [r + s for r in ranks for s in suits]
            random.shuffle(deck)
            player_hand = deck[:5]
            dealer_hand = deck[5:10]
            player_val = sum(ranks.index(c[:-1]) for c in player_hand)
            dealer_val = sum(ranks.index(c[:-1]) for c in dealer_hand)
            won = player_val > dealer_val
            win_amount = bet * 2 if won else 0
            result_data = {"player_hand": player_hand, "dealer_hand": dealer_hand, "win_amount": win_amount}

        else:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Неизвестная игра"})}

        net = result_data["win_amount"] - bet
        new_balance = balance + net

        cur.execute("UPDATE kzc_users SET balance=%s WHERE id=%s", (new_balance, user_id))
        cur.execute(
            "INSERT INTO kzc_game_history (user_id, game, bet, result, won) VALUES (%s,%s,%s,%s,%s)",
            (user_id, game, bet, result_data["win_amount"], won)
        )
        if net != 0:
            cur.execute(
                "INSERT INTO kzc_transactions (user_id, type, amount, description) VALUES (%s,%s,%s,%s)",
                (user_id, "win" if won else "loss", abs(net), f"Игра: {game}")
            )

        conn.commit()
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({
                "won": won,
                "new_balance": new_balance,
                "result": result_data
            })
        }

    except Exception as e:
        conn.rollback()
        return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": str(e)})}
    finally:
        cur.close()
        conn.close()
