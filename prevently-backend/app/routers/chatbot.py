from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import anthropic
from app.config import Config
import os
import firebase_admin
from firebase_admin import credentials, firestore
import time
from collections import defaultdict

router = APIRouter()

if not firebase_admin._apps:
    if Config.FIREBASE_SERVICE_ACCOUNT_KEY_PATH and os.path.exists(Config.FIREBASE_SERVICE_ACCOUNT_KEY_PATH):
        cred = credentials.Certificate(Config.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)
    else:
        cred = credentials.ApplicationDefault()
    
    firebase_admin.initialize_app(cred, {
        'projectId': Config.FIREBASE_PROJECT_ID
    })

db = firestore.client()

async def get_recent_news(limit: int = 5) -> str:
    """Fetch recent news articles and format them for context"""
    try:
        news_ref = db.collection('news_datastore').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
        docs = news_ref.stream()

        articles = []
        for doc in docs:
            article_data = doc.to_dict()
            sentiment = article_data.get('sentiment_numeric', 0)
            sentiment_label = "neutral"
            if sentiment > 0.1:
                sentiment_label = "positive"
            elif sentiment < -0.1:
                sentiment_label = "negative"
            
            articles.append({
                'title': article_data.get('title', ''),
                'domain': article_data.get('domain', ''),
                'sentiment': sentiment_label,
                'companies': article_data.get('companies', [])
            })

        formatted = "Recent News Articles:\n"
        for i, article in enumerate(articles, 1):
            companies_str = ", ".join(article['companies']) if article['companies'] else "No specific companies"
            formatted += f"{i}. {article['title']} (Domain: {article['domain']}, Sentiment: {article['sentiment']}, Companies: {companies_str})\n"
        
        return formatted
    except Exception as e:
        return f"Unable to fetch recent news: {str(e)}"

async def get_sentiment_analytics_summary(days: int = 7) -> str:
    """Fetch sentiment analytics summary for the last N days"""
    try:
        current_time = int(time.time() * 1000)
        days_ago = current_time - (days * 24 * 60 * 60 * 1000)

        query = db.collection('news_datastore').where('timestamp', '>=', days_ago)
        docs = query.order_by('timestamp', direction=firestore.Query.DESCENDING).stream()

        from collections import defaultdict
        domain_sentiment = defaultdict(list)
        total_sentiment = []

        for doc in docs:
            article_data = doc.to_dict()
            sentiment = article_data.get('sentiment_numeric', 0)
            domain = article_data.get('domain', 'unknown')
            
            domain_sentiment[domain].append(sentiment)
            total_sentiment.append(sentiment)

        summary = f"Sentiment Analytics Summary (Last {days} days):\n"
        summary += f"Total articles analyzed: {len(total_sentiment)}\n"
        
        if total_sentiment:
            avg_sentiment = sum(total_sentiment) / len(total_sentiment)
            sentiment_label = "neutral"
            if avg_sentiment > 0.1:
                sentiment_label = "positive"
            elif avg_sentiment < -0.1:
                sentiment_label = "negative"
            summary += f"Overall average sentiment: {avg_sentiment:.3f} ({sentiment_label})\n"
        
        summary += "\nSentiment by domain:\n"
        for domain, sentiments in sorted(domain_sentiment.items()):
            avg = sum(sentiments) / len(sentiments)
            count = len(sentiments)
            sentiment_label = "neutral"
            if avg > 0.1:
                sentiment_label = "positive"
            elif avg < -0.1:
                sentiment_label = "negative"
            summary += f"- {domain}: {count} articles, avg sentiment {avg:.3f} ({sentiment_label})\n"
        
        return summary
    except Exception as e:
        return f"Unable to fetch sentiment analytics: {str(e)}"

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = None
    model: Optional[str] = "claude-3-5-haiku-20241022"
    system_prompt: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024
    context_variables: Optional[dict] = None

class ChatResponse(BaseModel):
    response: str

def get_anthropic_client():
    if not Config.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="Anthropic API key not configured")
    return anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """
    Chat with Claude AI assistant
    """
    try:
        client = get_anthropic_client()

        messages = []

        if request.conversation_history:
            for msg in request.conversation_history[-10:]:
                role = "user" if msg.get("sender") == "user" else "assistant"
                messages.append({
                    "role": role,
                    "content": msg.get("content", "")
                })

        messages.append({
            "role": "user",
            "content": request.message
        })

        if request.system_prompt:
            system_prompt = request.system_prompt
        else:
            prompt_file = os.path.join(os.path.dirname(__file__), '..', 'prompts', 'clara_system_prompt.txt')
            try:
                with open(prompt_file, 'r', encoding='utf-8') as f:
                    system_prompt = f.read()
            except FileNotFoundError:
                raise HTTPException(status_code=500, detail="System prompt file not found")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error loading system prompt: {str(e)}")

        if request.context_variables:
            request.context_variables['recent_news'] = await get_recent_news(5)
            request.context_variables['sentiment_analytics'] = await get_sentiment_analytics_summary(7)
            
            for key, value in request.context_variables.items():
                placeholder = "{{" + key + "}}"
                system_prompt = system_prompt.replace(placeholder, str(value))
        else:
            context_vars = {
                'recent_news': await get_recent_news(5),
                'sentiment_analytics': await get_sentiment_analytics_summary(7)
            }
            for key, value in context_vars.items():
                placeholder = "{{" + key + "}}"
                system_prompt = system_prompt.replace(placeholder, str(value))

        response = client.messages.create(
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            system=system_prompt,
            messages=messages
        )

        return ChatResponse(response=response.content[0].text)

    except anthropic.APIError as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")