from flask import Flask, request, jsonify
from flask_cors import CORS
from polarity import get_sentiment
from ner_model import extract_mental_health_concerns, classify_concern, score_intensity
from timeline_analysis import TimelineSentimentAnalyzer
from pymongo import MongoClient
import datetime

app = Flask(__name__)
CORS(app)

# Initialize MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["mental_health_db"]
collection = db["user_inputs"]

timeline_analyzer = TimelineSentimentAnalyzer()

@app.route('/api/process_input', methods=['POST'])
def process_input():
    """
    Process user input, analyze sentiment and mental health concerns, store the data.
    """
    data = request.get_json()
    user_input = data.get('sentence', '').strip()

    if user_input.lower() == 'exit':
        return jsonify({"message": "Exiting..."})

    if user_input.lower() == 'report':
        return jsonify({"report": timeline_analyzer.generate_graph("daily")})

    sentiment, keywords = get_sentiment(user_input)
    concerns = extract_mental_health_concerns(user_input)
    concern_categories = {concern: classify_concern(concern) for concern in concerns}
    concern_intensities = {concern: score_intensity(concern) for concern in concerns}

    # Store input data in MongoDB
    entry = {
        "text": user_input,
        "sentiment": sentiment,
        "keywords": keywords if keywords else [],
        "concerns": concerns if concerns else [],
        "concern_categories": concern_categories if concern_categories else {},
        "intensity_scores": concern_intensities if concern_intensities else {},
        "timestamp": datetime.datetime.utcnow()
    }
    collection.insert_one(entry)

    timeline_analyzer.add_input(1, user_input, concerns, concern_categories, concern_intensities)

    response_message = generate_response_based_on_sentiment(sentiment)

    response = {
        "sentiment": sentiment,
        "response_message": response_message,
        "keywords": keywords if keywords else "None",
        "concerns": concerns if concerns else "None",
        "concern_categories": concern_categories if concern_categories else "None",
        "intensity_scores": concern_intensities if concern_intensities else "None"
    }

    return jsonify(response)

@app.route('/api/get_graph', methods=['POST'])
def get_graph():
    """
    Generate a graph based on the selected timeframe (hourly, daily, weekly).
    """
    data = request.get_json()
    timeframe = data.get("timeframe", "daily")

    graph = timeline_analyzer.generate_graph(timeframe)

    return jsonify({"graph": graph}) if graph else jsonify({"error": "No data available for this timeframe."})

@app.route('/api/intensity-history', methods=['GET'])
def get_history():
    """
    Fetch historical data for plotting the sentiment trend.
    """
    history = list(collection.find({}, {"_id": 0, "timestamp": 1, "sentiment": 1}))

    # Convert timestamps to string format
    for entry in history:
        entry["timestamp"] = entry["timestamp"].strftime("%Y-%m-%d %H:%M:%S")

    if history:
        return jsonify({"history": history})
    else:
        return jsonify({"error": "No historical data available."})


def generate_response_based_on_sentiment(sentiment):
    """
    Generate a chatbot response based on the sentiment.
    """
    responses = {
        "Positive": "I'm glad to hear that you're feeling positive!",
        "Neutral": "It seems like you're feeling neutral.",
        "Negative": "I'm sorry you're feeling this way. Let me know if I can help."
    }
    return responses.get(sentiment, "I'm here to help. Feel free to share more.")

if __name__ == '__main__':
    app.run(debug=True, threaded=True)