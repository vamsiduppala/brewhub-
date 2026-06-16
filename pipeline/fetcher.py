import praw
import requests
from typing import List, Dict, Any
from . import config

def get_reddit_client():
    if not config.REDDIT_CLIENT_ID or not config.REDDIT_CLIENT_SECRET:
        # Return None to signal fallback mode
        return None
    try:
        return praw.Reddit(
            client_id=config.REDDIT_CLIENT_ID,
            client_secret=config.REDDIT_CLIENT_SECRET,
            user_agent=config.REDDIT_USER_AGENT
        )
    except Exception as e:
        print(f"  [Warning] Failed to initialize PRAW: {e}. Switching to public API.")
        return None

def fetch_via_public_api(sub_name: str, limit: int = 15) -> List[Dict[str, Any]]:
    threads = []
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    
    try:
        # Fetch hot posts
        hot_url = f"https://www.reddit.com/r/{sub_name}/hot.json?limit={limit}"
        r_hot = requests.get(hot_url, headers=headers, timeout=12)
        r_hot.raise_for_status()
        hot_data = r_hot.json().get("data", {}).get("children", [])
        
        # Fetch top posts
        top_url = f"https://www.reddit.com/r/{sub_name}/top.json?limit={limit}&t=month"
        r_top = requests.get(top_url, headers=headers, timeout=12)
        r_top.raise_for_status()
        top_data = r_top.json().get("data", {}).get("children", [])
        
        seen_ids = set()
        posts = []
        for p in hot_data + top_data:
            p_data = p.get("data", {})
            p_id = p_data.get("id")
            if p_id and p_id not in seen_ids and not p_data.get("stickied"):
                seen_ids.add(p_id)
                posts.append(p_data)
                
        for post in posts:
            comments = []
            comment_url = f"https://www.reddit.com/r/{sub_name}/comments/{post['id']}.json"
            
            try:
                r_comm = requests.get(comment_url, headers=headers, timeout=10)
                if r_comm.status_code == 200:
                    comm_data = r_comm.json()
                    if isinstance(comm_data, list) and len(comm_data) > 1:
                        comm_list = comm_data[1].get("data", {}).get("children", [])
                        for c in comm_list[:6]:
                            c_data = c.get("data", {})
                            body = c_data.get("body", "")
                            if body and body not in ["[deleted]", "[removed]"]:
                                comments.append({
                                    "body": body[:800],
                                    "score": c_data.get("score", 0)
                                })
            except Exception as ce:
                # Silently ignore comment fetch failures per post to avoid breaking main crawl
                pass
                
            threads.append({
                "id": post["id"],
                "title": post["title"],
                "text": post.get("selftext", "")[:2000],
                "url": f"https://www.reddit.com{post.get('permalink', '')}",
                "subreddit": sub_name,
                "upvotes": post.get("score", 0),
                "num_comments": post.get("num_comments", 0),
                "comments": comments
            })
            
    except Exception as e:
        print(f"  [Warning] Failed to fetch via public API for r/{sub_name}: {e}")
        
    return threads

def fetch_subreddit_threads(reddit, sub_name: str, limit: int = 15) -> List[Dict[str, Any]]:
    # If PRAW is not initialized, use public JSON API
    if reddit is None:
        return fetch_via_public_api(sub_name, limit)
        
    threads = []
    try:
        subreddit = reddit.subreddit(sub_name)
        hot_posts = list(subreddit.hot(limit=limit))
        top_posts = list(subreddit.top(time_filter="month", limit=limit))
        
        seen_ids = set()
        posts = []
        for post in hot_posts + top_posts:
            if post.id not in seen_ids and not post.stickied:
                seen_ids.add(post.id)
                posts.append(post)
                
        for post in posts:
            post.comment_sort = "best"
            try:
                post.comments.replace_more(limit=0)
            except Exception:
                pass
                
            comments = []
            for comment in post.comments[:6]:
                body = getattr(comment, "body", "")
                if body and body not in ["[deleted]", "[removed]"]:
                    comments.append({
                        "body": body[:800],
                        "score": getattr(comment, "score", 0)
                    })
            
            threads.append({
                "id": post.id,
                "title": post.title,
                "text": post.selftext[:2000],
                "url": f"https://www.reddit.com{post.permalink}",
                "subreddit": sub_name,
                "upvotes": post.score,
                "num_comments": post.num_comments,
                "comments": comments
            })
            
    except Exception as e:
        print(f"  [Warning] Failed to fetch r/{sub_name} via PRAW: {e}. Trying public fallback...")
        return fetch_via_public_api(sub_name, limit)
        
    return threads

def fetch_category_data(category_slug: str, subreddits: List[str], limit_per_sub: int = 10) -> List[Dict[str, Any]]:
    print(f"\n--- Fetching Category: {category_slug} ---")
    reddit = get_reddit_client()
    
    if reddit is None:
        print("  [Info] Reddit credentials not found. Using public JSON API fallback...")
        
    all_threads = []
    for sub in subreddits:
        threads = fetch_subreddit_threads(reddit, sub, limit=limit_per_sub)
        all_threads.extend(threads)
        print(f"  Crawled {len(threads)} posts from r/{sub}")
        
    return all_threads
