import json
import os
import hashlib
import secrets
import string
import psycopg2
from datetime import datetime, timedelta


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(64)


def make_referral_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "KZC" + "".join(secrets.choice(chars) for _ in range(7))


def handler(event: dict, context) -> dict:
    """Регистрация и авторизация игроков KAZAHCOIN."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    path = event.get("path", "/")
    body = json.loads(event.get("body") or "{}")
    conn = get_conn()
    cur = conn.cursor()

    try:
        if path.endswith("/register"):
            username = (body.get("username") or "").strip()
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            promo = (body.get("promo") or "").strip().upper()
            referred_by_code = (body.get("referral") or "").strip().upper()

            if not username or not email or not password:
                return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Заполни все поля"})}

            if len(password) < 6:
                return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Пароль минимум 6 символов"})}

            cur.execute("SELECT id FROM kzc_users WHERE username=%s OR email=%s", (username, email))
            if cur.fetchone():
                return {"statusCode": 409, "headers": cors, "body": json.dumps({"error": "Никнейм или email уже занят"})}

            ref_code = make_referral_code()
            pwd_hash = hash_password(password)

            referred_by_id = None
            if referred_by_code:
                cur.execute("SELECT id FROM kzc_users WHERE referral_code=%s", (referred_by_code,))
                row = cur.fetchone()
                if row:
                    referred_by_id = row[0]

            cur.execute(
                "INSERT INTO kzc_users (username, email, password_hash, referral_code, referred_by) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                (username, email, pwd_hash, ref_code, referred_by_id)
            )
            user_id = cur.fetchone()[0]

            cur.execute(
                "INSERT INTO kzc_transactions (user_id, type, amount, description) VALUES (%s,'bonus',500,'Приветственный бонус')",
                (user_id,)
            )

            bonus_extra = 0
            if promo:
                cur.execute("SELECT id, reward FROM kzc_promo_codes WHERE code=%s AND is_active=TRUE AND used_count < max_uses", (promo,))
                pc = cur.fetchone()
                if pc:
                    promo_id, reward = pc
                    cur.execute("SELECT 1 FROM kzc_promo_uses WHERE user_id=%s AND promo_id=%s", (user_id, promo_id))
                    if not cur.fetchone():
                        cur.execute("UPDATE kzc_users SET balance=balance+%s WHERE id=%s", (reward, user_id))
                        cur.execute("UPDATE kzc_promo_codes SET used_count=used_count+1 WHERE id=%s", (promo_id,))
                        cur.execute("INSERT INTO kzc_promo_uses (user_id, promo_id) VALUES (%s,%s)", (user_id, promo_id))
                        cur.execute("INSERT INTO kzc_transactions (user_id, type, amount, description) VALUES (%s,'promo',%s,%s)", (user_id, reward, f"Промокод {promo}"))
                        bonus_extra = reward

            if referred_by_id:
                cur.execute("UPDATE kzc_users SET balance=balance+100 WHERE id=%s", (referred_by_id,))
                cur.execute("INSERT INTO kzc_transactions (user_id, type, amount, description) VALUES (%s,'referral',100,'Реферальный бонус')", (referred_by_id,))

            token = make_token()
            expires = datetime.now() + timedelta(days=30)
            cur.execute("INSERT INTO kzc_sessions (user_id, token, expires_at) VALUES (%s,%s,%s)", (user_id, token, expires))

            cur.execute("SELECT balance FROM kzc_users WHERE id=%s", (user_id,))
            balance = cur.fetchone()[0]

            conn.commit()
            return {
                "statusCode": 200,
                "headers": cors,
                "body": json.dumps({
                    "token": token,
                    "user": {"id": user_id, "username": username, "balance": balance, "vip_level": 1, "referral_code": ref_code},
                    "bonus_extra": bonus_extra
                })
            }

        elif path.endswith("/login"):
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            pwd_hash = hash_password(password)

            cur.execute("SELECT id, username, balance, vip_level, referral_code FROM kzc_users WHERE email=%s AND password_hash=%s", (email, pwd_hash))
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Неверный email или пароль"})}

            user_id, username, balance, vip_level, ref_code = row
            token = make_token()
            expires = datetime.now() + timedelta(days=30)
            cur.execute("INSERT INTO kzc_sessions (user_id, token, expires_at) VALUES (%s,%s,%s)", (user_id, token, expires))
            conn.commit()
            return {
                "statusCode": 200,
                "headers": cors,
                "body": json.dumps({
                    "token": token,
                    "user": {"id": user_id, "username": username, "balance": balance, "vip_level": vip_level, "referral_code": ref_code}
                })
            }

        elif path.endswith("/me"):
            token = (event.get("headers") or {}).get("X-Auth-Token") or (event.get("headers") or {}).get("x-auth-token")
            if not token:
                return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Не авторизован"})}

            cur.execute(
                "SELECT u.id, u.username, u.balance, u.vip_level, u.referral_code, u.created_at FROM kzc_users u JOIN kzc_sessions s ON s.user_id=u.id WHERE s.token=%s AND s.expires_at > NOW()",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Сессия истекла"})}

            user_id, username, balance, vip_level, ref_code, created_at = row
            return {
                "statusCode": 200,
                "headers": cors,
                "body": json.dumps({
                    "id": user_id,
                    "username": username,
                    "balance": balance,
                    "vip_level": vip_level,
                    "referral_code": ref_code,
                    "created_at": str(created_at)
                })
            }

        return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}

    except Exception as e:
        conn.rollback()
        return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": str(e)})}
    finally:
        cur.close()
        conn.close()
