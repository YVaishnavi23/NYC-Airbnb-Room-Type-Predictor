from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import joblib

# Create FastAPI app
app = FastAPI()

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expected column order for the model
COLUMNS = ["latitude",
    "longitude",
    "price",
    "minimum_nights",
    "number_of_reviews",
    "reviews_per_month",
    "calculated_host_listings_count",
    "availability_365",
    "neighbourhood_group",
    "neighbourhood"]

# Load the trained ML pipeline
model = joblib.load("Model_pipeline.pkl")

# Input validation using Pydantic
class Features(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    price: float = Field(..., gt=0)
    minimum_nights: int = Field(..., ge=1, le=365)
    number_of_reviews: int = Field(..., ge=0)
    reviews_per_month: float = Field(..., ge=0)
    calculated_host_listings_count: int = Field(..., ge=0)
    availability_365: int = Field(..., ge=0, le=365)
    neighbourhood_group: str = Field(..., min_length=1)
    neighbourhood: str = Field(..., min_length=1)

# Define a simple route
@app.get("/")
def greet():
    return {"message": "Hello, World!"}

# Define a route for prediction 
@app.post("/predict")
def predict(features: Features):
    # Convert the input features to a DataFrame
    row = pd.DataFrame(
        [features.model_dump()],
        columns=COLUMNS
    )

    # Make prediction using the loaded model
    prediction = model.predict(row)

    # Return the prediction result
    probability = model.predict_proba(row)

    return {"prediction": prediction[0], "probability": probability[0].tolist()}