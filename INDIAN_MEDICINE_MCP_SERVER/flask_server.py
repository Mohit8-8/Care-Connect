from flask import Flask, request, jsonify
import json

app = Flask(__name__)

DATA_PATH = "/Users/siddharthbajpai/Downloads/MCP_SERVER/medicines.json"

try:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        medicines = json.load(f)
except FileNotFoundError:
    medicines = []

@app.route('/search', methods=['GET'])
def search_medicines():
    query = request.args.get('query', '')
    results = [med for med in medicines if query.lower() in med.get('Name', '').lower()]
    return jsonify(results[:10])

if __name__ == '__main__':
    app.run(port=8001)
