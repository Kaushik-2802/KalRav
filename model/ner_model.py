import spacy

MODEL_PATH = "mental_health_ner" 
nlp = spacy.load(MODEL_PATH)

MENTAL_HEALTH_CATEGORIES = {
    "Anxiety": {
        "keywords": ["anxious", "panic", "worried", "overthinking", "nervous", "uneasy", "tense", "restless", "calm", "relaxed"],
        "intensity": {"suicide":10,"panic": 9, "anxious": 8, "nervous": 7, "worried": 6, "overthinking": 7, "uneasy": 4, "tense": 5, "restless": 5, "calm": 2, "relaxed": 1}
    },
    "Depression": {
        "keywords": ["sad", "hopeless", "worthless", "unmotivated", "empty", "down", "gloomy", "lonely", "content", "hopeful"],
        "intensity": {"hopeless": 10, "worthless": 9, "sad": 7, "unmotivated": 6, "empty": 8, "down": 5, "gloomy": 4, "lonely": 5, "content": 2, "hopeful": 1,"happy":1}
    },
    "Stress": {
        "keywords": ["stressed", "pressure", "overwhelmed", "burnout", "tension", "frustrated", "exhausted", "agitated", "focused", "motivated"],
        "intensity": {"burnout": 10, "overwhelmed": 9, "stressed": 8, "pressure": 7, "tension": 6, "frustrated": 5, "exhausted": 4, "agitated": 3, "focused": 2, "motivated": 1,"sleepy":2}
    },
    "Insomnia": {
        "keywords": ["can't sleep", "insomnia", "restless", "sleep-deprived", "awake", "nightmare", "tossing", "turning", "well-rested", "refreshed"],
        "intensity": {"insomnia": 10, "sleep-deprived": 9, "restless": 8, "can't sleep": 7, "awake": 6, "nightmare": 5, "tossing": 4, "turning": 3, "well-rested": 2, "refreshed": 1}
    },
    "Eating Disorder": {
        "keywords": ["not eating", "overeating", "binge eating", "starving", "food issue", "skipping meals", "losing appetite", "craving food", "healthy eating", "balanced diet"],
        "intensity": {"binge eating": 10, "starving": 9, "overeating": 8, "food issue": 7, "not eating": 6, "skipping meals": 5, "losing appetite": 4, "craving food": 3, "healthy eating": 2, "balanced diet": 1}
    }
}


def extract_mental_health_concerns(text):
    doc = nlp(text)
    concerns = [ent.text for ent in doc.ents if ent.label_ == "MENTAL_HEALTH_CONCERN"]
    return concerns

def classify_concern(concern_text):
    for category, data in MENTAL_HEALTH_CATEGORIES.items():
        if any(keyword in concern_text.lower() for keyword in data["keywords"]):
            return category
    return "Other"  

def score_intensity(concern_text):
    intensity_score = 0
    for category, data in MENTAL_HEALTH_CATEGORIES.items():
        for keyword, score in data["intensity"].items():
            if keyword in concern_text.lower():
                intensity_score = max(intensity_score, score)
    return intensity_score if intensity_score > 0 else 1  
