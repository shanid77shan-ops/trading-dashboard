import os, json, traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import anthropic

app = Flask(__name__)
CORS(app)

SYMBOL_MAP = {"XAUUSD": "GC=F", "USOIL": "CL=F", "UKOIL": "BZ=F"}

def rsi(prices, period=14):
    delta = prices.diff()
    gain  = delta.where(delta > 0, 0).rolling(period).mean()
    loss  = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs    = gain / loss
    return round(float((100 - 100 / (1 + rs)).iloc[-1]), 2)

def macd(prices):
    ema12 = prices.ewm(span=12, adjust=False).mean()
    ema26 = prices.ewm(span=26, adjust=False).mean()
    return round(float((ema12 - ema26).iloc[-1]), 6)

@app.route("/health", methods=["GET"])
def health():
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    return jsonify({"status": "ok", "api_key_set": bool(key), "prefix": key[:20] if key else "NOT SET"})

@app.route("/", methods=["POST", "OPTIONS"])
def signal():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    body = request.get_json(force=True)
    symbol = body.get("symbol", "")
    label  = body.get("label", symbol)
    print(f"[REQUEST] {symbol}")
    yf_sym = SYMBOL_MAP.get(symbol, symbol)
    try:
        hist  = yf.Ticker(yf_sym).history(period="6mo", interval="1d")
        if hist.empty:
            raise ValueError("Empty data")
        close = hist["Close"]
    except Exception as e:
        print(f"[ERROR] {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500
    price_val = round(float(close.iloc[-1]), 5)
    rsi_val   = rsi(close)
    macd_val  = macd(close)
    print(f"[DATA] price={price_val} rsi={rsi_val} macd={macd_val}")
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY not set"}), 500
    client = anthropic.Anthropic(api_key=api_key)
    prompt = f"""Analyze {label} and give a trading signal.
Data: Price={price_val}, RSI={rsi_val}, MACD={macd_val}
Reply ONLY with JSON: {{"signal":"BUY|SELL|WAIT","entry":"<price>","stop_loss":"<price>","take_profit":"<price>","reason":"<2-3 sentences>","confidence":"low|medium|high"}}"""
    try:
        msg = client.messages.create(model="claude-opus-4-5", max_tokens=512, messages=[{"role":"user","content":prompt}])
        result = json.loads(msg.content[0].text)
        print(f"[SIGNAL] {result}")
    except Exception as e:
        print(f"[ERROR] {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500
    result.update({"price": str(price_val), "rsi": str(rsi_val), "macd": str(macd_val)})
    return jsonify(result)

if __name__ == "__main__":
    print("Backend running on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
