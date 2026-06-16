import json
from typing import List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from . import config

# Pydantic Schemas for Structured JSON generation
class SourceThread(BaseModel):
    title: str = Field(..., description="The title of the Reddit post")
    url: str = Field(..., description="The full URL to the Reddit post")
    subreddit: str = Field(..., description="The subreddit where this post was found, e.g. 'SaaS'")
    upvotes: int = Field(..., description="Upvote score of the post")
    numComments: int = Field(..., description="Number of comments on the post")

class IdeaCard(BaseModel):
    id: str = Field(..., description="A unique lowercase URL-safe ID, e.g. 'dev-tool-api-watcher'")
    category: str = Field(..., description="The category slug matching this request")
    title: str = Field(..., description="Punchy, creative startup or product name (not the Reddit title)")
    tagline: str = Field(..., description="One compelling, benefit-driven sentence")
    whatItIs: str = Field(..., description="2-3 plain-English sentences explaining the MVP, beginner-friendly")
    momentum: str = Field(..., description="Must be one of: 'Emerging', 'Heating Up', 'Hot', 'Crowded'")
    momentumScore: int = Field(..., description="Interest score between 0 and 100 based on thread volume and engagement")
    momentumWhy: str = Field(..., description="One line explaining the momentum rating")
    difficulty: str = Field(..., description="Must be one of: 'Beginner', 'Intermediate', 'Advanced'")
    whyNow: str = Field(..., description="Explanation of why now is the ideal time to build this")
    theTea: str = Field(..., description="Community discourse: key debates, arguments, or interesting viewpoints found in comments")
    whoIsDoingIt: str = Field(..., description="Briefly describe who is currently active or building in this space")
    gettingStarted: List[str] = Field(..., description="2-3 concrete checkable first moves for a developer to launch a basic MVP")
    tags: List[str] = Field(..., description="3-5 keyword tags")
    sources: List[SourceThread] = Field(..., description="Citations of original threads that supported this idea")
    lastUpdated: str = Field(default="", description="Leave empty, will be populated automatically by script")

class CategoryIdeas(BaseModel):
    ideas: List[IdeaCard]

def get_gemini_client():
    if not config.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is missing in your .env configuration.")
    return genai.Client(api_key=config.GEMINI_API_KEY)

def decode_threads_to_ideas(category_slug: str, raw_threads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not raw_threads:
        print(f"No raw threads available to decode for {category_slug}.")
        return []
        
    print(f"Decoding {len(raw_threads)} raw threads for category: {category_slug} using Gemini...")
    
    client = get_gemini_client()
    
    formatted_context = ""
    for idx, thread in enumerate(raw_threads):
        formatted_context += f"--- THREAD #{idx+1} ---\n"
        formatted_context += f"Subreddit: r/{thread['subreddit']}\n"
        formatted_context += f"Title: {thread['title']}\n"
        formatted_context += f"Upvotes: {thread['upvotes']} | Comments: {thread['num_comments']}\n"
        formatted_context += f"Content: {thread['text']}\n"
        
        if thread.get("comments"):
            formatted_context += "Top Comments:\n"
            for c in thread["comments"]:
                formatted_context += f"- {c['body']} (Score: {c['score']})\n"
        formatted_context += "\n"

    system_prompt = (
        "You are decoding Reddit discussions into a hub of startable ideas. "
        "Surface what people are building, excited about, and actively discussing — momentum, angles, and opportunities. "
        "This is an idea hub, not a pain hub: do NOT frame things as complaints or pain points. "
        "Focus on positive build opportunities. Capture 'the tea' — the live debates, contrarian takes, "
        "and the general community vibe — in a fun, candid, encouraging tone. "
        "Ground every card strictly in the supplied threads; never invent facts, numbers, or sources. "
        "Each card must cite the threads it came from. Return ONLY valid JSON matching the schema."
    )

    prompt = (
        f"Analyze these raw Reddit threads representing the '{category_slug}' category. "
        f"Group related discussions and synthesize them into 4-8 high-quality, actionable, startable Idea Cards. "
        f"Ensure every card maps to the provided Pydantic schema and references the actual threads from which it was derived.\n\n"
        f"Input Threads:\n{formatted_context}"
    )

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CategoryIdeas,
                system_instruction=system_prompt,
                temperature=0.2,
            ),
        )
        
        result = json.loads(response.text)
        decoded_ideas = result.get("ideas", [])
        
        current_time = datetime.utcnow().isoformat() + "Z"
        final_ideas = []
        
        for idx, idea in enumerate(decoded_ideas):
            if idea["momentum"] not in ["Emerging", "Heating Up", "Hot", "Crowded"]:
                idea["momentum"] = "Emerging"
            if idea["difficulty"] not in ["Beginner", "Intermediate", "Advanced"]:
                idea["difficulty"] = "Intermediate"
            
            idea["category"] = category_slug
            idea["lastUpdated"] = current_time
            
            if not idea["id"].startswith(category_slug):
                idea["id"] = f"{category_slug}-{idea['id']}"
                
            final_ideas.append(idea)
            
        print(f"Successfully decoded {len(final_ideas)} ideas for {category_slug}!")
        return final_ideas
        
    except Exception as e:
        print(f"Error calling Gemini or parsing response: {e}")
        return []

def generate_simulated_ideas(category_slug: str, category_name: str, subreddits: List[str]) -> List[Dict[str, Any]]:
    print(f"Generating 6 distinct dynamic ideas for category '{category_name}' using Gemini...")
    try:
        client = get_gemini_client()
    except Exception as e:
        print(f"Skipping AI generation: {e}")
        return []

    system_prompt = (
        "You are a decoder generating a hub of startable business and product ideas. "
        "Surface what people are building, excited about, and actively discussing in these subreddits — momentum, angles, and opportunities. "
        "This is an idea hub, not a pain hub: do NOT frame things as complaints or pain points. "
        "Focus on positive build opportunities. Capture 'the tea' — the live debates, contrarian takes, "
        "and the general community vibe — in a fun, candid, encouraging tone. "
        "Each card must list realistic mock source threads referencing these subreddits. Return ONLY valid JSON matching the schema."
    )

    prompt = (
        f"Generate 6 distinct, highly realistic, startable Idea Cards for the business category '{category_name}' "
        f"based on typical hot topics, trends, and builder discussions on these subreddits: {', '.join(subreddits)}.\n\n"
        f"Ensure every card maps to the provided Pydantic schema. Ground the ideas in plausible developer workflows or startup opportunities."
    )

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CategoryIdeas,
                system_instruction=system_prompt,
                temperature=0.7,
            ),
        )
        
        result = json.loads(response.text)
        decoded_ideas = result.get("ideas", [])
        
        current_time = datetime.utcnow().isoformat() + "Z"
        final_ideas = []
        
        for idx, idea in enumerate(decoded_ideas):
            if idea["momentum"] not in ["Emerging", "Heating Up", "Hot", "Crowded"]:
                idea["momentum"] = "Emerging"
            if idea["difficulty"] not in ["Beginner", "Intermediate", "Advanced"]:
                idea["difficulty"] = "Intermediate"
            
            idea["category"] = category_slug
            idea["lastUpdated"] = current_time
            
            if not idea["id"].startswith(category_slug):
                idea["id"] = f"{category_slug}-{idea['id']}"
                
            final_ideas.append(idea)
            
        print(f"Successfully generated {len(final_ideas)} ideas for {category_name}!")
        return final_ideas
        
    except Exception as e:
        print(f"Error calling Gemini for simulated ideas: {e}")
        return []
