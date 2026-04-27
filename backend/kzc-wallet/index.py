import json
import os
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
    """Кошелёк: история транзакций, переводы, промокоды, история игр."""
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

    path = event.get("path", "/")
    body = json.loads(event.get("body") or "{}")
    conn = get_conn()
    cur = conn.cursor()

    try:
        user = get_user_from_token(cur, token)
        if not user:
            return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Сессия истекла"})}

        user_id, username, balance = user

        if path.endswith("/history"):
            cur.execute(
                "SELECT type, amount, description, created_at FROM kzc_transactions WHERE user_id=%s ORDER BY created_at DESC LIMIT 20",
                (user_id,)
            )
            rows = cur.fetchall()
            txs = [{"type": r[0], "amount": r[1], "description": r[2], "created_at": str(r[3])} for r in rows]
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"transactions": txs, "balance": balance})}

        elif path.endswith("/games"):
            cur.execute(
                "SELECT game, bet, result, won, created_at FROM kzc_game_history WHERE user_id=%s ORDER BY created_at DESC LIMIT 20",
                (user_id,)
            )
            rows = cur.fetchall()
            games = [{"game": r[0], "bet": r[1], "result": r[2], "won": r[3], "created_at": str(r[4])} for r in rows]
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"games": games})}

        elif path.endswith("/transfer"):
            to_username = (body.get("to_username") or "").strip()
            amount = int(body.get("amount") or 0)

            if not to_username or amount <= 0:
                return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Укажи получателя и сумму"})}
            if amount > balance:
                return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Недостаточно KAZAHCOIN"})}
            if to_username.lower() == username.lower():
                return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Нельзя переводить себе"})}

            cur.execute("SELECT id FROM kzc_users WHERE username=%s", (to_username,))
            target = cur.fetchone()
            if not target:
                return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Игрок не найден"})}

            to_id = target[0]
            cur.execute("UPDATE kzc_users SET balance=balance-%s WHERE id=%s", (amount, user_id))
            cur.execute("UPDATE kzc_users SET balance=balance+%s WHERE id=%s", (amount, to_id))
            cur.execute("INSERT INTO kzc_transactions (user_id, type, amount, description) VALUES (%s,'transfer_out',%s,%s)",
                        (user_id, amount, f"Перевод → {to_username}"))
            cur.execute("INSERT INTO kzc_transactions (user_id, type, amount, description) VALUES (%s,'transfer_in',%s,%s)",
                        (to_id, amount, f"Перевод ← {username}"))
            conn.commit()

            cur.execute("SELECT balance FROM kzc_users WHERE id=%s", (user_id,))
            new_balance = cur.fetchone()[0]
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"success": True, "new_balance": new_balance})}

        elif path.endswith("/promo"):
            code = (body.get("code") or "").strip().upper()
            if not code:
                return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Введи промокод"})}

            cur.execute("SELECT id, reward FROM kzc_promo_codes WHERE code=%s AND is_active=TRUE AND used_count < max_uses", (code,))
            pc = cur.fetchone()
            if not pc:
                return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Промокод не найден или истёк"})}

            promo_id, reward = pc
            cur.execute("SELECT 1 FROM kzc_promo_uses WHERE user_id=%s AND promo_id=%s", (user_id, promo_id))
            if cur.fetchone():
                return {"statusCode": 409, "headers": cors, "body": json.dumps({"error": "Ты уже использовал этот промокод"})}

            cur.execute("UPDATE kzc_users SET balance=balance+%s WHERE id=%s", (reward, user_id))
            cur.execute("UPDATE kzc_promo_codes SET used_count=used_count+1 WHERE id=%s", (promo_id,))
            cur.execute("INSERT INTO kzc_promo_uses (user_id, promo_id) VALUES (%s,%s)", (user_id, promo_id))
            cur.execute("INSERT INTO kzc_transactions (user_id, type, amount, description) VALUES (%s,'promo',%s,%s)",
                        (user_id, reward, f"Промокод {code}"))
            conn.commit()

            cur.execute("SELECT balance FROM kzc_users WHERE id=%s", (user_id,))
            new_balance = cur.fetchone()[0]
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"success": True, "reward": reward, "new_balance": new_balance})}

        return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}

    except Exception as e:
        conn.rollback()
        return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": str(e)})}
    finally:
        cur.close()
        conn.close()
