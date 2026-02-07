import asyncio
from crawl4ai import AsyncWebCrawler

async def scrape_to_markdown(url):
    """
    Spins up a local browser, renders the page, and returns clean Markdown.
    Free. Fast. Local.
    """
    async with AsyncWebCrawler(verbose=True) as crawler:
        result = await crawler.arun(url=url)
        return result.markdown

def run_scrape(url):
    """Synchronous wrapper for our Ralph Loops"""
    return asyncio.run(scrape_to_markdown(url))
